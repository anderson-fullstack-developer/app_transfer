import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

/**
 * Carrega o `.env` para `process.env`. Procura primeiro na pasta da app e
 * depois na raiz do monorepo. Em producao as variaveis vem do ambiente real,
 * por isso nao e erro nao existir ficheiro.
 */
export function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../../../.env'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path });
      return;
    }
  }
}
