import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

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

    if (value.length < 4) {
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

    if (value.length > 8) {
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

    if (!/^[a-zA-Z0-9]+$/.test(value)) {
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
