export const BLOCKED_PATTERNS: ReadonlyArray<{
  regex: RegExp;
  reason: string;
}> = [
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

export const HTML_ENTITY_DECIMAL_PATTERN_SOURCE = '&#(\\d+);';
export const HTML_ENTITY_HEX_PATTERN_SOURCE = '&#x([0-9a-fA-F]+);';
