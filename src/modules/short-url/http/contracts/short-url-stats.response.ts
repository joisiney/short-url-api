import { ApiProperty } from '@nestjs/swagger';

export class ShortUrlStatsResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'abc1234' })
  shortCode!: string;

  @ApiProperty({ example: 'https://www.example.com/some/very/long/path' })
  url!: string;

  @ApiProperty({ example: 42 })
  accessCount!: number;

  @ApiProperty({ example: '2026-03-18T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-18T00:00:00.000Z' })
  updatedAt!: string;
}
