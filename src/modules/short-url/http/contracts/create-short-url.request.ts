import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createShortUrlSchema = z.object({
  url: z.url({ message: 'A URL deve ser válida' }),
});

export type CreateShortUrlRequestDto = z.infer<typeof createShortUrlSchema>;

export class CreateShortUrlRequest {
  @ApiProperty({
    example: 'https://www.example.com/some/very/long/path',
    description: 'URL original a ser encurtada (formato URI válido)',
    format: 'uri',
  })
  url!: string;
}
