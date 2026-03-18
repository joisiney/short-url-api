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
  ConflictException,
  NotFoundException,
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
import { shortCodeSchema } from '../contracts/short-code.schema';
import { ShortUrlResponse } from '../contracts/short-url.response';
import { ShortUrlStatsResponse } from '../contracts/short-url-stats.response';
import { ShortUrlPresenter } from '../presenters/short-url.presenter';

import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { ShortCodeGenerationExhaustedError } from '../../domain/errors/short-code-generation-exhausted.error';

@ApiTags('short-url')
@Controller()
export class ShortenController {
  constructor(
    private readonly createShortUrl: CreateShortUrlUseCase,
    private readonly getShortUrl: GetShortUrlUseCase,
    private readonly updateShortUrl: UpdateShortUrlUseCase,
    private readonly deleteShortUrl: DeleteShortUrlUseCase,
    private readonly getShortUrlStats: GetShortUrlStatsUseCase,
  ) {}

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar URL curta' })
  @ApiBody({ type: CreateShortUrlRequest })
  @ApiResponse({ status: 201, type: ShortUrlResponse })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({
    status: 409,
    description: 'Não foi possível gerar short code único',
  })
  @UsePipes(new ZodValidationPipe(createShortUrlSchema))
  async create(
    @Body() body: CreateShortUrlRequestDto,
  ): Promise<ShortUrlResponse> {
    const result = await this.createShortUrl.execute({ url: body.url });

    if (result.isFailure) {
      if (result.error instanceof ShortCodeGenerationExhaustedError) {
        throw new ConflictException({
          code: 'SHORT_CODE_GENERATION_EXHAUSTED',
          message: result.error.message,
        });
      }
      throw result.error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Get('shorten/:shortCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter URL original pelo short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 200, type: ShortUrlResponse })
  @ApiResponse({ status: 400, description: 'Parâmetro inválido' })
  @ApiResponse({ status: 404, description: 'Short URL não encontrada' })
  async findOne(
    @Param('shortCode', new ZodValidationPipe(shortCodeSchema))
    shortCode: string,
  ): Promise<ShortUrlResponse> {
    const result = await this.getShortUrl.execute({ shortCode });

    if (result.isFailure) {
      if (result.error instanceof ShortUrlNotFoundError) {
        throw new NotFoundException({
          code: 'SHORT_URL_NOT_FOUND',
          message: result.error.message,
        });
      }
      throw result.error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Put('shorten/:shortCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar URL original de um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiBody({ type: UpdateShortUrlRequest })
  @ApiResponse({ status: 200, type: ShortUrlResponse })
  @ApiResponse({ status: 400, description: 'Payload ou parâmetro inválido' })
  @ApiResponse({ status: 404, description: 'Short URL não encontrada' })
  @UsePipes(new ZodValidationPipe(updateShortUrlSchema))
  async update(
    @Param('shortCode', new ZodValidationPipe(shortCodeSchema))
    shortCode: string,
    @Body() body: UpdateShortUrlRequestDto,
  ): Promise<ShortUrlResponse> {
    const result = await this.updateShortUrl.execute({
      shortCode,
      url: body.url,
    });

    if (result.isFailure) {
      if (result.error instanceof ShortUrlNotFoundError) {
        throw new NotFoundException({
          code: 'SHORT_URL_NOT_FOUND',
          message: result.error.message,
        });
      }
      throw result.error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Delete('shorten/:shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'Parâmetro inválido' })
  @ApiResponse({ status: 404, description: 'Short URL não encontrada' })
  async remove(
    @Param('shortCode', new ZodValidationPipe(shortCodeSchema))
    shortCode: string,
  ): Promise<void> {
    const result = await this.deleteShortUrl.execute({ shortCode });

    if (result.isFailure) {
      if (result.error instanceof ShortUrlNotFoundError) {
        throw new NotFoundException({
          code: 'SHORT_URL_NOT_FOUND',
          message: result.error.message,
        });
      }
      throw result.error;
    }
  }

  @Get('shorten/:shortCode/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas de acesso de um short code' })
  @ApiParam({ name: 'shortCode', type: String })
  @ApiResponse({ status: 200, type: ShortUrlStatsResponse })
  @ApiResponse({ status: 400, description: 'Parâmetro inválido' })
  @ApiResponse({ status: 404, description: 'Short URL não encontrada' })
  async stats(
    @Param('shortCode', new ZodValidationPipe(shortCodeSchema))
    shortCode: string,
  ): Promise<ShortUrlStatsResponse> {
    const result = await this.getShortUrlStats.execute({ shortCode });

    if (result.isFailure) {
      if (result.error instanceof ShortUrlNotFoundError) {
        throw new NotFoundException({
          code: 'SHORT_URL_NOT_FOUND',
          message: result.error.message,
        });
      }
      throw result.error;
    }

    return ShortUrlPresenter.toStatsResponse(result.value);
  }
}
