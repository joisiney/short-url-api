import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorDetail {
  @ApiProperty({
    description: 'Campo com erro de validação (se houver)',
    example: 'url',
    required: false,
  })
  field?: string;

  @ApiProperty({
    description: 'Mensagem indicando o erro específico',
    example: 'Invalid URL format',
  })
  message!: string;
}
