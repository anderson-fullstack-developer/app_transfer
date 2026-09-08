import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { Money, convert, percentOf } from './money.js';
import { AppError } from '../errors/index.js';

describe('Money.fromMajor', () => {
  it('converte "100" EUR para 10000 minor units', () => {
    expect(Money.fromMajor('EUR', '100').toMinorString()).toBe('10000');
  });

  it('converte "100.50" EUR para 10050 minor units', () => {
    expect(Money.fromMajor('EUR', '100.50').toMinorString()).toBe('10050');
  });

  it('rejeita mais casas decimais do que a moeda suporta', () => {
    expect(() => Money.fromMajor('EUR', '100.505')).toThrow(AppError);
  });

  it('rejeita texto que nao e numero', () => {
    expect(() => Money.fromMajor('EUR', 'abc')).toThrow(AppError);
  });
});

describe('Money aritmetica', () => {
  it('soma e subtrai sem perda de precisao', () => {
    const a = Money.fromMajor('EUR', '0.10');
    const b = Money.fromMajor('EUR', '0.20');
    expect(a.add(b).toMajorString()).toBe('0.30'); // o classico 0.1 + 0.2 !== 0.3 em float
  });

  it('impede operacoes entre moedas diferentes', () => {
    expect(() => Money.fromMajor('EUR', '1').add(Money.fromMajor('MAD', '1'))).toThrow(AppError);
  });

  it('fromMinor rejeita number nao inteiro', () => {
    expect(() => Money.fromMinor('EUR', 10.5)).toThrow(AppError);
  });
});

describe('percentOf', () => {
  it('fee de 2% sobre 100 EUR = 2,00 EUR', () => {
    expect(percentOf(Money.fromMajor('EUR', '100'), 2).toMajorString()).toBe('2.00');
  });

  it('arredonda a fee para cima por omissao', () => {
    // 2% de 10,01 EUR = 0,2002 -> arredonda para 0,21
    expect(percentOf(Money.fromMajor('EUR', '10.01'), 2).toMinorString()).toBe('21');
  });
});

describe('convert', () => {
  it('converte 98 EUR para MAD a 10.85 (arredonda para baixo)', () => {
    const { destination, rate } = convert(Money.fromMajor('EUR', '98'), 'MAD', '10.85');
    // 9800 * 10.85 = 106330 -> 1063,30 MAD
    expect(destination.toMinorString()).toBe('106330');
    expect(rate.equals(new Decimal('10.85'))).toBe(true);
  });

  it('arredonda o montante do destinatario para baixo (floor, nao half-up)', () => {
    // 1 minor EUR * 10.85 = 10.85 minor MAD -> floor -> 10 (half-up daria 11)
    const { destination } = convert(Money.fromMinor('EUR', 1n), 'MAD', '10.85');
    expect(destination.toMinorString()).toBe('10');
  });

  it('rejeita taxa <= 0', () => {
    expect(() => convert(Money.fromMajor('EUR', '10'), 'MAD', '0')).toThrow(AppError);
  });
});
