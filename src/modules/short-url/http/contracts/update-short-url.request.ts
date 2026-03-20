import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class UpdateShortUrlRequest {
  @ApiProperty({
    example: 'https://www.example.com/new/destination',
    description:
      'Nova URL original a ser associada ao short code (formato URI válido)',
    format: 'uri',
  })
  @IsUrl({ require_protocol: true }, { message: 'O formato da URL é inválido' })
  url!: string;
}
