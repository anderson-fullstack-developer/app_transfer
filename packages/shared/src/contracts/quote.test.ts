import { describe, expect, it } from 'vitest';
import { computeQuoteBreakdown, createQuoteSchema } from './quote.js';

describe('computeQuoteBreakdown', () => {
  it('100 EUR, fee 2%, taxa 10.85', () => {
    const b = computeQuoteBreakdown('100', '10.85', '2', 0);
    expect(b.sourceAmountMinor).toBe('10000'); // 100,00 EUR
    expect(b.feeAmountMinor).toBe('200'); // 2,00 EUR
    expect(b.totalChargedMinor).toBe('10200'); // 102,00 EUR debitado
    expect(b.destinationAmountMinor).toBe('108500'); // 1085,00 MAD (10000 * 10.85)
    expect(b.exchangeRate).toBe('10.85');
  });

  it('fee arredonda para cima', () => {
    // 2% de 10,01 EUR = 0,2002 -> 0,21
    const b = computeQuoteBreakdown('10.01', '10.85', '2', 0);
    expect(b.feeAmountMinor).toBe('21');
  });

  it('inclui a fee fixa', () => {
    const b = computeQuoteBreakdown('50', '10', '1', 50); // 1% de 50 = 0,50 + 0,50 fixa
    expect(b.feeAmountMinor).toBe('100'); // 1,00 EUR
    expect(b.totalChargedMinor).toBe('5100');
  });

  it('valor do estudante arredonda para baixo (floor, nao half-up)', () => {
    // 1 minor EUR * 10.857 = 10.857 minor MAD -> floor -> 10 (half-up daria 11)
    const b = computeQuoteBreakdown('0.01', '10.857', '0', 0);
    expect(b.destinationAmountMinor).toBe('10');
  });
});

describe('createQuoteSchema', () => {
  it('aceita "100" e "100,50"', () => {
    expect(createQuoteSchema.parse({ studentUsername: 'carlos', amount: '100' }).amount).toBe(
      '100',
    );
    expect(createQuoteSchema.parse({ studentUsername: 'carlos', amount: '100,50' }).amount).toBe(
      '100.50',
    );
  });

  it('rejeita valores invalidos', () => {
    expect(() => createQuoteSchema.parse({ studentUsername: 'carlos', amount: 'abc' })).toThrow();
    expect(() =>
      createQuoteSchema.parse({ studentUsername: 'carlos', amount: '10.999' }),
    ).toThrow();
  });
});
