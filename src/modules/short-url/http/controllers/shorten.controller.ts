import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';

import { CreateShortUrlUseCase } from '../../application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from '../../application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from '../../application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from '../../application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from '../../application/use-cases/get-short-url-stats.use-case';

import {
  CreateShortUrlRequest,
  createShortUrlSchema,
} from '../contracts/create-short-url.request';
import type { CreateShortUrlRequestDto } from '../contracts/create-short-url.request';
import {
  UpdateShortUrlRequest,
  updateShortUrlSchema,
} from '../contracts/update-short-url.request';
import type { UpdateShortUrlRequestDto } from '../contracts/update-short-url.request';
import { ShortUrlResponse } from '../contracts/short-url.response';
import { ShortUrlStatsResponse } from '../contracts/short-url-stats.response';
import { ShortUrlPresenter } from '../presenters/short-url.presenter';

@ApiTags('short-url')
@Controller()
export class ShortenController {
  constructor(
    private readonly createShortUrl: CreateShortUrlUseCase,
    private readonly getShortUrl: GetShortUrlUseCase,
    private readonly updateShortUrl: UpdateShortUrlUseCase,
    private readonly deleteShortUrl: DeleteShortUrlUseCase,
    private readonly getShortUrlStats: GetShortUrlStatsUseCase,
  ) { }

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar URL curta' })
  @ApiBody({ type: CreateShortUrlRequest })
  @ApiResponse({ status: 201, type: ShortUrlResponse })
  @UsePipes(new ZodValidationPipe(createShortUrlSchema))
  create(@Body() body: CreateShortUrlRequestDto): ShortUrlResponse {
    const result = this.createShortUrl.execute(body.url);
    return ShortUrlPresenter.toResponse(result);
  }

  @Get(':shortCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter URL original pelo short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 200, type: ShortUrlResponse })
  findOne(@Param('shortCode') shortCode: string): ShortUrlResponse {
    const result = this.getShortUrl.execute(shortCode);
    return ShortUrlPresenter.toResponse(result);
  }

  @Put(':shortCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar URL original de um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiBody({ type: UpdateShortUrlRequest })
  @ApiResponse({ status: 200, type: ShortUrlResponse })
  @UsePipes(new ZodValidationPipe(updateShortUrlSchema))
  update(
    @Param('shortCode') shortCode: string,
    @Body() body: UpdateShortUrlRequestDto,
  ): ShortUrlResponse {
    const result = this.updateShortUrl.execute(shortCode, body.url);
    return ShortUrlPresenter.toResponse(result);
  }

  @Delete(':shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 204 })
  remove(@Param('shortCode') shortCode: string): void {
    this.deleteShortUrl.execute(shortCode);
  }

  @Get(':shortCode/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas de acesso de um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 200, type: ShortUrlStatsResponse })
  stats(@Param('shortCode') shortCode: string): ShortUrlStatsResponse {
    const result = this.getShortUrlStats.execute(shortCode);
    return ShortUrlPresenter.toStatsResponse(result);
  }
}
