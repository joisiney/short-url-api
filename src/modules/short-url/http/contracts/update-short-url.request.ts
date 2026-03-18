import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateShortUrlSchema = z.object({
  url: z.url({ message: 'O formato da URL é inválido' }),
});

export type UpdateShortUrlRequestDto = z.infer<typeof updateShortUrlSchema>;

export class UpdateShortUrlRequest {
  @ApiProperty({
    example: 'https://www.example.com/new/destination',
    description: 'A nova URL original a ser associada ao short code',
  })
  url!: string;
}
