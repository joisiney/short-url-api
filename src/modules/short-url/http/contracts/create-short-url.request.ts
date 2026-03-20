import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CreateShortUrlRequest {
  @ApiProperty({
    example: 'https://www.example.com/some/very/long/path',
    description: 'URL original a ser encurtada (formato URI válido)',
    format: 'uri',
  })
  @IsUrl({ require_protocol: true }, { message: 'A URL deve ser válida' })
  url!: string;
}
