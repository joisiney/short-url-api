import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import {
  SHORT_CODE_MIN_LENGTH,
  SHORT_CODE_MAX_LENGTH,
  SHORT_CODE_ALPHANUMERIC_PATTERN,
} from '@modules/short-url/domain/constants/short-code.constants';

@Injectable()
export class ShortCodeParamPipe implements PipeTransform<unknown, string> {
  transform(value: unknown, _metadata?: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            field: 'shortCode',
            message: 'Short code deve ser uma string',
          },
        ],
      });
    }

    if (value.length < SHORT_CODE_MIN_LENGTH) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            field: 'shortCode',
            message: 'Short code deve ter no minimo 4 caracteres',
          },
        ],
      });
    }

    if (value.length > SHORT_CODE_MAX_LENGTH) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            field: 'shortCode',
            message: 'Short code deve ter no maximo 8 caracteres',
          },
        ],
      });
    }

    if (!SHORT_CODE_ALPHANUMERIC_PATTERN.test(value)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            field: 'shortCode',
            message: 'Short code deve conter apenas letras e numeros',
          },
        ],
      });
    }

    return value;
  }
}
