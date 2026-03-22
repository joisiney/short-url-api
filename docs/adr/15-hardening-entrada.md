# ADR 15 — Hardening de entrada para mitigacao de XSS

## Status

Aceito

## Contexto
A API de encurtamento recebe dados externos por `body`, `params`, `query` e `headers`.
Embora ja existam validacoes de contrato por endpoint com Zod, havia risco de entrada de payload textual malicioso em pontos que nao representam regra de dominio, mas sim superficie de ataque de transporte HTTP.

O objetivo e endurecer a borda de entrada com postura intransigente de seguranca para reduzir risco de vetores XSS refletidos/armazenados e falhas de robustez por argumentos hostis.

## Decisao
Implementar um Guard global de seguranca no pipeline HTTP que:

1. inspeciona recursivamente strings em `body`, `params`, `query` e `headers`;
2. detecta padroes suspeitos de XSS/vetores correlatos (por exemplo: `<script`, `javascript:`, handlers inline `on*=` e `srcdoc`);
3. rejeita imediatamente a request com `HTTP 400` e codigo de erro `SECURITY_INPUT_REJECTED`.

Nao sera feito sanitize-and-accept. A politica adotada e detectou padrao suspeito, bloqueou.

**Implementacao:** Guard (NestJS) em vez de middleware Express, pois `req.params` so e populado apos o routing. O Guard executa apos o casamento da rota, garantindo inspecao de params.

## Alternativas Consideradas
1. Sanitizar e aceitar:
   - Pro: maior compatibilidade com clientes legados.
   - Contra: risco de comportamento ambiguo e bypass por normalizacao incompleta.
2. Hibrido (sanitizar em alguns casos e rejeitar em outros):
   - Pro: flexibilidade operacional.
   - Contra: aumenta complexidade e superficie de erro.
3. Apenas validacao por schema:
   - Pro: simplicidade.
   - Contra: cobertura insuficiente para vetores fora do contrato semantico.
4. Middleware Express:
   - Contra: `req.params` vazio quando o middleware executa (antes do routing).

## Consequencias
Positivas:
- Menor superficie de ataque na borda HTTP.
- Comportamento deterministico para entrada suspeita (sempre `400`).
- Integracao simples com a pilha existente (`Helmet`, `Throttler`, `ZodValidationPipe`).
- Inspecao completa de body, params, query e headers.

Negativas:
- Possiveis falsos positivos em strings legitimas com substrings bloqueadas.
- Mudanca comportamental para consumidores que antes enviavam payloads nao higienicos.

## Impacto Operacional
- Clientes devem evitar enviar argumentos com padroes tipicos de XSS.
- Time de API deve manter e revisar periodicamente os padroes de bloqueio para equilibrar seguranca e falso positivo.

## Detalhes de implementacao

Revisoes aplicadas: normalizacao para bypass de encoding XSS (`decodeURIComponent`, entidades HTML); ampliacao do padrao data: URI (`data:text/html`, `text/javascript`, `image/svg+xml`); denylist de headers na inspecao (`authorization`, `content-type`, etc.); padroes SQLi em defesa em profundidade (`union select`, `drop`, `alter`, `or 1=1`).

## Escopo

- Sem alteracao de contrato publico de endpoints.
- Sem novas dependencias de terceiros.
- Hardening focado na camada HTTP de entrada.
