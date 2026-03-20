import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  BLOCKED_PATTERNS,
  HTML_ENTITY_DECIMAL_PATTERN_SOURCE,
  HTML_ENTITY_HEX_PATTERN_SOURCE,
} from './security-input.patterns';

type InputLocation = 'body' | 'params' | 'query' | 'headers';

type InputIssue = {
  location: InputLocation;
  path: string;
  reason: string;
};

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
  normalized = normalized.replace(
    new RegExp(HTML_ENTITY_DECIMAL_PATTERN_SOURCE, 'g'),
    (_m, n: string) => String.fromCharCode(parseInt(n, 10)),
  );
  normalized = normalized.replace(
    new RegExp(HTML_ENTITY_HEX_PATTERN_SOURCE, 'g'),
    (_m, n: string) => String.fromCharCode(parseInt(n, 16)),
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
