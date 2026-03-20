import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import {
  type ValidationErrorDetail,
  flattenValidationErrors,
} from '@shared/validation/flatten-validation-errors';

export type { ValidationErrorDetail };
export { flattenValidationErrors };

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: flattenValidationErrors(errors),
  });
}
