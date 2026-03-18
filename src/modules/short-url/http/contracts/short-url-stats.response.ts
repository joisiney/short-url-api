import { ApiProperty } from '@nestjs/swagger';

export class ShortUrlStatsResponse {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID único da short URL (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'abc1234',
    description: 'Código curto',
  })
  shortCode!: string;

  @ApiProperty({
    example: 'https://www.example.com/some/very/long/path',
    description: 'URL original',
  })
  url!: string;

  @ApiProperty({
    example: 42,
    description: 'Número de acessos ao short code',
  })
  accessCount!: number;

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
