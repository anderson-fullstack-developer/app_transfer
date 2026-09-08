/**
 * Definicao das moedas suportadas. `scale` = numero de casas decimais
 * (minor units). EUR e MAD usam 2 (cents / centimos).
 */
export interface CurrencyDef {
  code: string;
  scale: number;
  symbol: string;
}

export const CURRENCIES = {
  EUR: { code: 'EUR', scale: 2, symbol: '€' },
  MAD: { code: 'MAD', scale: 2, symbol: 'MAD' },
} as const satisfies Record<string, CurrencyDef>;

export type CurrencyCode = keyof typeof CURRENCIES;

export function getCurrency(code: CurrencyCode): CurrencyDef {
  return CURRENCIES[code];
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}
