import { randomUUID } from 'node:crypto';
import { type NextFunction, type Request, type Response } from 'express';

/**
 * Atribui um `requestId` a cada pedido (reutiliza `x-request-id` se vier do
 * cliente / proxy). Base para logs estruturados correlacionados (seccao 26).
 *
 * Registado como middleware global do Express em `main.ts` — e uma
 * preocupacao transversal, nao precisa da DI do Nest.
 */
export function requestIdMiddleware(
  req: Request & { id?: string },
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}
