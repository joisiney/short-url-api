import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

type InputLocation = 'body' | 'params' | 'query' | 'headers';

type InputIssue = {
  location: InputLocation;
  path: string;
  reason: string;
};

const BLOCKED_PATTERNS: ReadonlyArray<{ regex: RegExp; reason: string }> = [
  { regex: /<\s*script\b/i, reason: 'script_tag_detected' },
  { regex: /\bon\w+\s*=/i, reason: 'inline_event_handler_detected' },
  { regex: /javascript\s*:/i, reason: 'javascript_protocol_detected' },
  {
    regex: /data\s*:[^,]{0,50}(script|html|svg)/i,
    reason: 'data_uri_dangerous_detected',
  },
  { regex: /<\s*iframe\b/i, reason: 'iframe_tag_detected' },
  { regex: /<\s*object\b/i, reason: 'object_tag_detected' },
  { regex: /<\s*embed\b/i, reason: 'embed_tag_detected' },
  { regex: /\bsrcdoc\s*=/i, reason: 'srcdoc_attribute_detected' },
  { regex: /union\s+select/i, reason: 'sqli_union_detected' },
  {
    regex: /;\s*(drop|alter|truncate)\s+/i,
    reason: 'sqli_destructive_detected',
  },
  { regex: /--\s*$/m, reason: 'sqli_comment_detected' },
  { regex: /'\s*(or|and)\s*'/i, reason: 'sqli_boolean_detected' },
  { regex: /\bor\s+1\s*=\s*1\b/i, reason: 'sqli_boolean_or_detected' },
  { regex: /\band\s+1\s*=\s*1\b/i, reason: 'sqli_boolean_and_detected' },
];

const HEADERS_DENYLIST = new Set([
  'authorization',
  'content-type',
  'content-length',
  'user-agent',
  'referer',
  'host',
  'accept',
  'accept-encoding',
  'accept-language',
  'connection',
  'cookie',
]);

function normalizeForInspection(value: string): string {
  let normalized = value;
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // fallback para original
  }
  normalized = normalized.replace(/&#(\d+);/g, (_m, n: string) =>
    String.fromCharCode(parseInt(n, 10)),
  );
  normalized = normalized.replace(/&#x([0-9a-fA-F]+);/g, (_m, n: string) =>
    String.fromCharCode(parseInt(n, 16)),
  );
  return normalized.toLowerCase();
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function findIssueInString(
  value: string,
  location: InputLocation,
  path: string,
): InputIssue | null {
  const normalized = normalizeForInspection(value);
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      return { location, path, reason: pattern.reason };
    }
  }

  return null;
}

function inspectValue(
  value: unknown,
  location: InputLocation,
  path: string,
): InputIssue | null {
  if (typeof value === 'string') {
    return findIssueInString(value, location, path);
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const issue = inspectValue(value[index], location, `${path}[${index}]`);
      if (issue) {
        return issue;
      }
    }
    return null;
  }

  if (!isObjectLike(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = path ? `${path}.${key}` : key;
    const issue = inspectValue(nestedValue, location, nestedPath);
    if (issue) {
      return issue;
    }
  }

  return null;
}

function filterHeadersForInspection(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (!HEADERS_DENYLIST.has(lowerKey)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

function inspectRequestInput(request: Request): InputIssue | null {
  const bodyIssue = inspectValue(request.body, 'body', 'body');
  if (bodyIssue) {
    return bodyIssue;
  }

  const paramsIssue = inspectValue(request.params, 'params', 'params');
  if (paramsIssue) {
    return paramsIssue;
  }

  const queryIssue = inspectValue(request.query, 'query', 'query');
  if (queryIssue) {
    return queryIssue;
  }

  const filteredHeaders = filterHeadersForInspection(
    request.headers as unknown as Record<string, unknown>,
  );
  return inspectValue(filteredHeaders, 'headers', 'headers');
}

@Injectable()
export class SecurityInputGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const issue = inspectRequestInput(request);

    if (issue) {
      throw new BadRequestException({
        code: 'SECURITY_INPUT_REJECTED',
        message: 'Request rejected by security input filter',
        details: [issue],
      });
    }

    return true;
  }
}
