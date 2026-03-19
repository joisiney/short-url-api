import { ApiProperty } from '@nestjs/swagger';

export class ShortUrlResponse {
  @ApiProperty({
    example: '14000000',
    description: 'ID numerico da short URL (bigint)',
  })
  id!: string;

  @ApiProperty({
    example: 'https://www.example.com/some/very/long/path',
    description: 'URL original',
  })
  url!: string;

  @ApiProperty({
    example: 'WK2s',
    description: 'Codigo curto Base 62 (4 a 7 caracteres)',
  })
  shortCode!: string;

  @ApiProperty({
    example: '2026-03-18T00:00:00.000Z',
    description: 'Data de criação em UTC (ISO 8601)',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-03-18T00:00:00.000Z',
    description: 'Data da última atualização em UTC (ISO 8601)',
  })
  updatedAt!: string;
}
