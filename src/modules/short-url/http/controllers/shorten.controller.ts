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
  NotFoundException,
  ConflictException,
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

import { ApiErrorResponse } from '@shared/http/contracts/api-error.contract';

import { ShortCodeParamPipe } from '@shared/http/pipes/short-code-param.pipe';

import { CreateShortUrlUseCase } from '@modules/short-url/application/use-cases/create-short-url.use-case';
import { GetShortUrlUseCase } from '@modules/short-url/application/use-cases/get-short-url.use-case';
import { UpdateShortUrlUseCase } from '@modules/short-url/application/use-cases/update-short-url.use-case';
import { DeleteShortUrlUseCase } from '@modules/short-url/application/use-cases/delete-short-url.use-case';
import { GetShortUrlStatsUseCase } from '@modules/short-url/application/use-cases/get-short-url-stats.use-case';

import { CreateShortUrlRequest } from '@modules/short-url/http/contracts/create-short-url.request';
import { UpdateShortUrlRequest } from '@modules/short-url/http/contracts/update-short-url.request';
import { ShortUrlResponse } from '@modules/short-url/http/contracts/short-url.response';
import { ShortUrlStatsResponse } from '@modules/short-url/http/contracts/short-url-stats.response';
import { ShortUrlPresenter } from '@modules/short-url/http/presenters/short-url.presenter';

import { ShortUrlNotFoundError } from '@modules/short-url/domain/errors/short-url-not-found.error';
import { UrlAlreadyShortenedError } from '@modules/short-url/domain/errors/url-already-shortened.error';
import {
  SHORT_CODE_MIN_LENGTH,
  SHORT_CODE_MAX_LENGTH,
  SHORT_CODE_PATTERN_SCHEMA,
} from '@modules/short-url/domain/constants/short-code.constants';

const SHORT_CODE_PARAM = {
  name: 'shortCode',
  description: `Identificador curto da URL (${SHORT_CODE_MIN_LENGTH} a ${SHORT_CODE_MAX_LENGTH} caracteres Base 62)`,
  example: 'WK2s',
  schema: {
    type: 'string',
    minLength: SHORT_CODE_MIN_LENGTH,
    maxLength: SHORT_CODE_MAX_LENGTH,
    pattern: SHORT_CODE_PATTERN_SCHEMA,
  },
} as const;

const THROTTLE_CONFIG = {
  default: {
    limit: 12,
    ttl: 60_000,
  },
};

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
  @Throttle(THROTTLE_CONFIG)
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
  async create(@Body() body: CreateShortUrlRequest): Promise<ShortUrlResponse> {
    const result = await this.createShortUrl.execute({ url: body.url });
    return ShortUrlPresenter.toResponse(result);
  }

  @Get('shorten/:shortCode')
  @Throttle(THROTTLE_CONFIG)
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
    @Param('shortCode', ShortCodeParamPipe) shortCode: string,
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
  @Throttle(THROTTLE_CONFIG)
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
    status: 409,
    type: ApiErrorResponse,
    description: 'Conflict - URL ja encurtada por outro shortCode',
  })
  @ApiResponse({
    status: 500,
    type: ApiErrorResponse,
    description: 'Internal Server Error - falha inesperada',
  })
  async update(
    @Param('shortCode', ShortCodeParamPipe) shortCode: string,
    @Body() body: UpdateShortUrlRequest,
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
      if (result.error instanceof UrlAlreadyShortenedError) {
        throw new ConflictException({
          code: 'URL_ALREADY_SHORTENED',
          message: result.error.message,
        });
      }
      throw result.error as Error;
    }

    return ShortUrlPresenter.toResponse(result.value);
  }

  @Delete('shorten/:shortCode')
  @Throttle(THROTTLE_CONFIG)
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
    @Param('shortCode', ShortCodeParamPipe) shortCode: string,
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
  @Throttle(THROTTLE_CONFIG)
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
    @Param('shortCode', ShortCodeParamPipe) shortCode: string,
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
