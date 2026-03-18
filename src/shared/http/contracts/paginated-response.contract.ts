import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponse<TItem> {
  @ApiProperty({ description: 'Lista de itens retornados', isArray: true })
  items!: TItem[];

  @ApiProperty({ description: 'Página atual', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Itens por página', example: 20 })
  pageSize!: number;

  @ApiProperty({ description: 'Total de itens disponíveis', example: 100 })
  totalItems!: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages!: number;
}
