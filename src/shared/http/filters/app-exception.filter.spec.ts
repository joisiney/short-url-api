import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import { AppExceptionFilter } from './app-exception.filter';

function createArgumentsHostMock(partial: {
  statusCode?: number;
  responseBody?: unknown;
  requestId?: string;
  correlationId?: string;
}) {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });

  const response = {
    status,
  };

  const request = {
    requestId: partial.requestId ?? 'req-123',
    correlationId: partial.correlationId ?? 'corr-456',
  };

  const switchToHttp = () => ({
    getResponse: () => response,
    getRequest: () => request,
  });

  return {
    switchToHttp,
    response,
    status,
    json,
  } as unknown as ArgumentsHost & {
    response: typeof response;
    status: typeof status;
    json: typeof json;
  };
}

describe('AppExceptionFilter', () => {
  it('deve mapear HttpException com corpo customizado preservando code, message e details', () => {
    const filter = new AppExceptionFilter();
    const exception = new HttpException(
      {
        code: 'SHORT_URL_NOT_FOUND',
        message: 'Short URL não encontrada',
        details: [{ field: 'shortCode', message: 'inválido' }],
      },
      HttpStatus.NOT_FOUND,
    );

    const host = createArgumentsHostMock({});

    filter.catch(exception, host);

    expect(host.response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const payload = (
      host.response.status as jest.Mock
    ).mock.calls[0][0] as number;
    expect(payload).toBe(HttpStatus.NOT_FOUND);

    const firstResult = (host.response.status as jest.Mock).mock.results[0];
    const jsonArg = (firstResult?.value.json ?? jest.fn()) as jest.Mock;
    const body = (jsonArg.mock.calls[0]?.[0] ?? {
      error: {},
    }) as { error: Record<string, unknown> };

    expect(body.error.code).toBe('SHORT_URL_NOT_FOUND');
    expect(body.error.message).toBe('Short URL não encontrada');
    expect(body.error).toHaveProperty('timestamp');
    expect(body.error).toHaveProperty('requestId');
    expect(body.error).toHaveProperty('correlationId');
    expect(body.error).toHaveProperty('details');
  });

  it('deve mapear HttpException simples usando STATUS_CODE_MAP quando sem code explícito', () => {
    const filter = new AppExceptionFilter();
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    const host = createArgumentsHostMock({});

    filter.catch(exception, host);

    const firstResult = (host.response.status as jest.Mock).mock.results[0];
    const jsonArg = (firstResult?.value.json ?? jest.fn()) as jest.Mock;
    const body = (jsonArg.mock.calls[0]?.[0] ?? {
      error: {},
    }) as { error: Record<string, unknown> };

    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Bad request');
  });
});

