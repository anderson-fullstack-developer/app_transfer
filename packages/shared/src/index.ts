/**
 * @app/shared — codigo de dominio partilhado entre `apps/api` e `apps/web`.
 * Sem dependencias de framework. Fonte unica de verdade para enums, erros,
 * matematica monetaria, regras de username e a state machine de transferencias.
 */
export * from './domain/index.js';
export * from './errors/index.js';
export * from './money/index.js';
export * from './username/index.js';
export * from './transfer/index.js';
export * from './reference/index.js';
export * from './contracts/index.js';
