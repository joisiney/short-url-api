/**
 * Carrega .env.test para testes de integração e HTTP.
 * Executado antes dos testes via setupFiles.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.test') });
process.env.NODE_ENV = 'test';
