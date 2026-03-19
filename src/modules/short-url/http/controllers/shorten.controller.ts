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
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';

import { ApiErrorResponse } from '../../../../shared/http/contracts/api-error.contract';

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

const SHORT_CODE_PARAM = {
  name: 'shortCode',
  description: 'Identificador curto da URL (4 a 7 caracteres Base 62)',
  example: 'WK2s',
  schema: {
    type: 'string',
    minLength: 4,
    maxLength: 7,
    pattern: '^[a-zA-Z0-9]+$',
  },
} as const;

@ApiTags('short-url')
@ApiExtraModels(ApiErrorResponse)
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
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar URL curta' })
  @ApiBody({ type: CreateShortUrlRequest })
  @ApiResponse({
    status: 201,
    type: ShortUrlResponse,
    description: 'Short URL criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Bad Request - validação do payload falhou',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
  @UsePipes(new ZodValidationPipe(createShortUrlSchema))
  async create(
    @Body() body: CreateShortUrlRequestDto,
  ): Promise<ShortUrlResponse> {
    const result = await this.createShortUrl.execute({ url: body.url });
    return ShortUrlPresenter.toResponse(result);
  }

  @Get('shorten/:shortCode')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter URL original pelo short code' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiResponse({
    status: 200,
    type: ShortUrlResponse,
    description: 'Short URL encontrada',
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Bad Request - parâmetro shortCode inválido',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Not Found - short code inexistente',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
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
      throw result.error as Error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Put('shorten/:shortCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar URL original de um short code' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiBody({ type: UpdateShortUrlRequest })
  @ApiResponse({
    status: 200,
    type: ShortUrlResponse,
    description: 'Short URL atualizada com sucesso',
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Bad Request - payload ou parâmetro inválido',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Not Found - short code inexistente',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
  async update(
    @Param('shortCode', new ZodValidationPipe(shortCodeSchema))
    shortCode: string,
    @Body(new ZodValidationPipe(updateShortUrlSchema))
    body: UpdateShortUrlRequestDto,
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
      throw result.error as Error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Delete('shorten/:shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar um short code' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiResponse({
    status: 204,
    description: 'No Content - short code removido com sucesso',
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Bad Request - parâmetro shortCode inválido',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Not Found - short code inexistente',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
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
      throw result.error as Error;
    }
  }

  @Get('shorten/:shortCode/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas de acesso de um short code' })
  @ApiParam(SHORT_CODE_PARAM)
  @ApiResponse({
    status: 200,
    type: ShortUrlStatsResponse,
    description: 'Estatísticas de acesso da short URL',
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponse,
    description: 'Bad Request - parâmetro shortCode inválido',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponse,
    description: 'Not Found - short code inexistente',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
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
      throw result.error as Error;
    }

    return ShortUrlPresenter.toStatsResponse(result.value);
  }
}
