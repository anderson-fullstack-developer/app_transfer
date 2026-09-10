import { z } from 'zod';
import Decimal from 'decimal.js';
import { Money, convert, percentOf } from '../money/money.js';
import { type PublicStudentView } from './student.js';

/** Entrada para criar uma quote. `amount` em EUR, como string ("100" ou "100.50"). */
export const createQuoteSchema = z.object({
  studentUsername: z.string().min(1),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,7}([.,]\d{1,2})?$/, 'Valor invalido.')
    .transform((v) => v.replace(',', '.')),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

/** Parametros de cotacao expostos pela API (para preview no browser). */
export interface QuoteRateInfo {
  sourceCurrency: 'EUR';
  destinationCurrency: 'MAD';
  /** MAD por 1 EUR, como string decimal. */
  exchangeRate: string;
  /** Percentagem da fee sobre o montante enviado. */
  feePercent: string;
  /** Fee fixa adicional, em minor units de EUR (cents). */
  fixedFeeMinor: number;
  minSourceMinor: number;
  maxSourceMinor: number;
}

export interface QuoteBreakdown {
  /** Montante que o remetente indicou (e que e convertido), em cents de EUR. */
  sourceAmountMinor: string;
  /** Fee cobrada, em cents de EUR. */
  feeAmountMinor: string;
  /** Total debitado ao remetente = source + fee, em cents de EUR. */
  totalChargedMinor: string;
  /** Montante que o estudante recebe, em minor units de MAD (centimos). */
  destinationAmountMinor: string;
  exchangeRate: string;
}

/**
 * Calculo da cotacao. Puro e determinista: corre igual no browser (preview) e
 * no backend (quote real), garantindo que os numeros batem certo.
 *
 * Regras (doc, seccao 8 + 44): fee arredonda PARA CIMA, valor do estudante
 * arredonda PARA BAIXO. A fee e cobrada por cima do montante enviado.
 */
export function computeQuoteBreakdown(
  sourceEurAmount: string,
  rate: string,
  feePercent: string,
  fixedFeeMinor: number,
): QuoteBreakdown {
  const source = Money.fromMajor('EUR', sourceEurAmount);
  const percentFee = percentOf(source, feePercent, 'ceil');
  const fee = percentFee.add(Money.fromMinor('EUR', fixedFeeMinor));
  const total = source.add(fee);
  const { destination, rate: appliedRate } = convert(source, 'MAD', new Decimal(rate), 'floor');

  return {
    sourceAmountMinor: source.toMinorString(),
    feeAmountMinor: fee.toMinorString(),
    totalChargedMinor: total.toMinorString(),
    destinationAmountMinor: destination.toMinorString(),
    exchangeRate: appliedRate.toString(),
  };
}

export const QUOTE_STATUS = ['ACTIVE', 'EXPIRED', 'CONSUMED'] as const;
export type QuoteStatusValue = (typeof QUOTE_STATUS)[number];

export interface QuoteView {
  id: string;
  reference: string;
  student: PublicStudentView;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmountMinor: string;
  feeAmountMinor: string;
  totalChargedMinor: string;
  destinationAmountMinor: string;
  exchangeRate: string;
  provider: string;
  status: QuoteStatusValue;
  expiresAt: string;
  createdAt: string;
}
