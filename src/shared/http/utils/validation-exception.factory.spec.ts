import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';
import { validationExceptionFactory } from './validation-exception.factory';

class SampleDto {
  @IsString()
  foo!: string;
}

describe('validationExceptionFactory', () => {
  it('deve mapear erros do class-validator para o contrato VALIDATION_ERROR', () => {
    const instance = plainToInstance(SampleDto, { foo: 123 });
    const errors = validateSync(instance);
    const exception = validationExceptionFactory(errors);

    expect(exception).toBeInstanceOf(BadRequestException);
    const response = exception.getResponse() as {
      code: string;
      message: string;
      details: Array<{ field: string; message: string }>;
    };

    expect(response.code).toBe('VALIDATION_ERROR');
    expect(response.message).toBe('Request validation failed');
    expect(response.details[0]?.field).toBe('foo');
    expect(typeof response.details[0]?.message).toBe('string');
  });
});
