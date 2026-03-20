import type { ValidationError } from 'class-validator';

export type ValidationErrorDetail = { field: string; message: string };

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] {
  const out: ValidationErrorDetail[] = [];

  for (const err of errors) {
    const segment = err.property ?? '';
    const path = parentPath ? `${parentPath}.${segment}` : segment;

    if (err.constraints) {
      for (const message of Object.values(err.constraints)) {
        out.push({ field: path, message });
      }
    }

    if (err.children?.length) {
      out.push(...flattenValidationErrors(err.children, path));
    }
  }

  return out;
}
