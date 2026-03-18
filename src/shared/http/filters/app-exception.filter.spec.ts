import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import { AppExceptionFilter } from './app-exception.filter';

type MockHost = ArgumentsHost & {
  response: { status: jest.Mock };
  status: jest.Mock;
  json: jest.Mock;
};

function createArgumentsHostMock(): MockHost {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });

  const response = { status };

  const request = {
    requestId: 'req-123',
    correlationId: 'corr-456',
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
  } as unknown as MockHost;
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

    const host = createArgumentsHostMock();

    filter.catch(exception, host);

    expect(host.response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

    const statusReturn = host.response.status.mock.results[0]?.value as
      | { json: jest.Mock }
      | undefined;
    const jsonCalls = statusReturn?.json?.mock?.calls as
      | [Record<string, unknown>][]
      | undefined;
    const body = (jsonCalls?.[0]?.[0] ?? {
      error: {},
    }) as { error: Record<string, unknown> };

    expect(body.error.code).toBe('SHORT_URL_NOT_FOUND');
    expect(body.error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(body.error.message).toBe('Short URL não encontrada');
    expect(body.error).toHaveProperty('timestamp');
    expect(body.error).toHaveProperty('requestId');
    expect(body.error).toHaveProperty('correlationId');
    expect(body.error).toHaveProperty('details');
  });

  it('deve mapear HttpException simples usando STATUS_CODE_MAP quando sem code explícito', () => {
    const filter = new AppExceptionFilter();
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    const host = createArgumentsHostMock();

    filter.catch(exception, host);

    const statusReturn = host.response.status.mock.results[0]?.value as
      | { json: jest.Mock }
      | undefined;
    const jsonCalls = statusReturn?.json?.mock?.calls as
      | [Record<string, unknown>][]
      | undefined;
    const body = (jsonCalls?.[0]?.[0] ?? {
      error: {},
    }) as { error: Record<string, unknown> };

    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.error.message).toBe('Bad request');
  });
});
