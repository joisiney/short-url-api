import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: result.error.issues.map((issue: z.core.$ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}
