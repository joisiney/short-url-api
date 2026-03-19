import { ApiProperty } from '@nestjs/swagger';
import { ValidationErrorDetail } from './validation-error-detail.contract';

export class ApiError {
  @ApiProperty({ description: 'Código do erro', example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({
    description: 'Código HTTP do status',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensagem do erro',
    example: 'Request validation failed',
  })
  message!: string;

  @ApiProperty({
    description: 'Detalhes de validação (se aplicável)',
    type: [ValidationErrorDetail],
    required: false,
  })
  details?: ValidationErrorDetail[];

  @ApiProperty({ description: 'ID da requisição', example: 'req_123' })
  requestId?: string;

  @ApiProperty({ description: 'ID de correlação', example: 'corr_123' })
  correlationId?: string;

  @ApiProperty({
    description: 'ID do trace OpenTelemetry (W3C)',
    example: '4bf92f3577b34da6a3ce929d0e0e4736',
    required: false,
  })
  traceId?: string;

  @ApiProperty({
    description: 'Timestamp do erro no servidor',
    example: '2026-03-18T12:00:00.000Z',
  })
  timestamp!: string;
}

export class ApiErrorResponse {
  @ApiProperty({ description: 'Objeto principal de erro', type: ApiError })
  error!: ApiError;
}
