import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateShortUrlSchema = z.object({
  url: z.url({ message: 'O formato da URL é inválido' }),
});

export type UpdateShortUrlRequestDto = z.infer<typeof updateShortUrlSchema>;

export class UpdateShortUrlRequest {
  @ApiProperty({
    example: 'https://www.example.com/new/destination',
    description:
      'Nova URL original a ser associada ao short code (formato URI válido)',
    format: 'uri',
  })
  url!: string;
}
