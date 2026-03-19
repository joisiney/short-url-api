import { BadRequestException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { Request } from 'express';

import { SecurityInputGuard } from './security-input.guard';

function createContext(request: Partial<Request>): ExecutionContext {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...request,
  } as Request;

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('SecurityInputGuard', () => {
  const guard = new SecurityInputGuard();

  describe('caso feliz - permite request limpo', () => {
    it('deve permitir quando request vazio', () => {
      const ctx = createContext({});

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando body com URL valida', () => {
      const ctx = createContext({
        body: { url: 'https://example.com/path?foo=bar' },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando params com shortCode valido', () => {
      const ctx = createContext({
        params: { shortCode: 'WK2s' },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando query com parametros limpos', () => {
      const ctx = createContext({
        query: { page: '1', limit: '10' },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando headers padrao', () => {
      const ctx = createContext({
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando header Authorization com JWT', () => {
      const ctx = createContext({
        headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando string com "1 or 2" em contexto nao-SQLi', () => {
      const ctx = createContext({
        body: { search: '1 or 2', description: 'item A or B' },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando objeto aninhado com strings limpas', () => {
      const ctx = createContext({
        body: {
          url: 'https://example.com',
          meta: { source: 'api', version: '1.0' },
        },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando array com strings limpas', () => {
      const ctx = createContext({
        body: { tags: ['foo', 'bar', 'baz'] },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('casos de borda', () => {
    it('deve permitir quando body undefined', () => {
      const ctx = createContext({ body: undefined });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando params e query vazios', () => {
      const ctx = createContext({
        params: {},
        query: {},
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('deve permitir quando string com caracteres especiais validos', () => {
      const ctx = createContext({
        body: { url: 'https://example.com/path?x=1&y=2' },
      });

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('rejeicao - body com payload suspeito', () => {
    it('deve rejeitar quando body contem script tag', () => {
      const ctx = createContext({
        body: { url: 'https://x.com/<script>alert(1)</script>' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem javascript protocol', () => {
      const ctx = createContext({
        body: { url: 'javascript:alert(1)' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem handler inline', () => {
      const ctx = createContext({
        body: { data: 'x onclick=evil()' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem data:text/html', () => {
      const ctx = createContext({
        body: { url: 'data:text/html,<h1>hi</h1>' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem iframe tag', () => {
      const ctx = createContext({
        body: { html: '<iframe src="evil"></iframe>' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem srcdoc', () => {
      const ctx = createContext({
        body: { attr: 'srcdoc="<script>x</script>"' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem script tag URL-encoded', () => {
      const ctx = createContext({
        body: { url: 'https://x.com/%3Cscript%3Ealert(1)%3C/script%3E' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem data:text/javascript', () => {
      const ctx = createContext({
        body: { url: 'data:text/javascript,alert(1)' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem union select', () => {
      const ctx = createContext({
        body: { input: "' UNION SELECT username, password FROM users--" },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando body contem OR 1=1', () => {
      const ctx = createContext({
        body: { url: 'https://site.com/test OR 1=1' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('rejeicao - params e query com payload suspeito', () => {
    it('deve rejeitar quando params contem payload suspeito', () => {
      const ctx = createContext({
        params: { shortCode: 'WK2s<script>' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando query contem payload suspeito', () => {
      const ctx = createContext({
        query: { redirect: 'javascript:void(0)' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('rejeicao - headers com payload suspeito', () => {
    it('deve rejeitar quando header customizado contem payload suspeito', () => {
      const ctx = createContext({
        headers: { 'x-custom': '<script>alert(1)</script>' },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('rejeicao - estrutura aninhada com payload suspeito', () => {
    it('deve rejeitar quando objeto aninhado contem payload suspeito', () => {
      const ctx = createContext({
        body: {
          url: 'https://ok.com',
          meta: { description: 'safe', extra: '<script>x</script>' },
        },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });

    it('deve rejeitar quando array contem payload suspeito', () => {
      const ctx = createContext({
        body: { items: ['a', 'b', 'javascript:alert(1)'] },
      });

      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('erro esperado - formato da excecao', () => {
    it('deve lancar BadRequestException com codigo SECURITY_INPUT_REJECTED', () => {
      const ctx = createContext({
        body: { url: '<script>x</script>' },
      });

      try {
        guard.canActivate(ctx);
        fail('Esperava BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          code: string;
          message: string;
          details: Array<{ location: string; path: string; reason: string }>;
        };

        expect(response.code).toBe('SECURITY_INPUT_REJECTED');
        expect(response.message).toBe(
          'Request rejected by security input filter',
        );
        expect(response.details).toHaveLength(1);
        const firstDetail = response.details[0]!;
        expect(firstDetail.location).toBe('body');
        expect(firstDetail.path).toContain('url');
        expect(firstDetail.reason).toBe('script_tag_detected');
      }
    });

    it('deve incluir status 400 na excecao', () => {
      const ctx = createContext({
        body: { x: 'javascript:void(0)' },
      });

      try {
        guard.canActivate(ctx);
        fail('Esperava BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getStatus()).toBe(400);
      }
    });
  });
});
