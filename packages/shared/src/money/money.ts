import Decimal from 'decimal.js';
import { AppError, ErrorCode } from '../errors/index.js';
import { type CurrencyCode, getCurrency } from './currency.js';

/**
 * REGRA FINANCEIRA FUNDAMENTAL (seccao 44 da doc):
 * dinheiro NUNCA e representado com `number` (float). Usamos:
 *   - `bigint` para minor units inteiros (o valor canonico, ex.: 10000 = 100,00 EUR);
 *   - `Decimal` (decimal.js) apenas para taxas de cambio e calculos intermedios.
 *
 * Um `Money` e imutavel: cada operacao devolve uma nova instancia.
 */
export class Money {
  private constructor(
    readonly currency: CurrencyCode,
    /** Valor em minor units (ex.: cents). Sempre inteiro. */
    readonly minor: bigint,
  ) {}

  // --- Construtores -----------------------------------------------------------

  /** A partir de minor units inteiros (a forma canonica de armazenamento). */
  static fromMinor(currency: CurrencyCode, minor: bigint | number | string): Money {
    if (typeof minor === 'number' && !Number.isInteger(minor)) {
      throw new AppError(ErrorCode.INVALID_AMOUNT, 'minor units tem de ser inteiro');
    }
    let value: bigint;
    try {
      value = typeof minor === 'bigint' ? minor : BigInt(String(minor).trim());
    } catch {
      throw new AppError(ErrorCode.INVALID_AMOUNT, `minor units invalido: ${String(minor)}`);
    }
    return new Money(currency, value);
  }

  /**
   * A partir de uma string de valor "maior" (ex.: "100.50" EUR).
   * Rejeita valores com mais casas decimais do que a moeda suporta.
   */
  static fromMajor(currency: CurrencyCode, major: string | number): Money {
    const { scale } = getCurrency(currency);
    let dec: Decimal;
    try {
      dec = new Decimal(typeof major === 'number' ? major.toString() : major.trim());
    } catch {
      throw new AppError(ErrorCode.INVALID_AMOUNT, `valor monetario invalido: ${String(major)}`);
    }
    if (dec.decimalPlaces() > scale) {
      throw new AppError(
        ErrorCode.INVALID_AMOUNT,
        `${currency} suporta no maximo ${scale} casas decimais`,
      );
    }
    const minor = dec.times(new Decimal(10).pow(scale));
    if (!minor.isInteger()) {
      throw new AppError(ErrorCode.INVALID_AMOUNT, 'valor monetario nao converte para inteiro');
    }
    return new Money(currency, BigInt(minor.toFixed(0)));
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(currency, 0n);
  }

  // --- Operacoes -------------------------------------------------------------

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new AppError(
        ErrorCode.INVALID_AMOUNT,
        `moedas incompativeis: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.currency, this.minor + other.minor);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.currency, this.minor - other.minor);
  }

  isNegative(): boolean {
    return this.minor < 0n;
  }

  isZero(): boolean {
    return this.minor === 0n;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor < other.minor;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor > other.minor;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minor === other.minor;
  }

  // --- Serializacao --------------------------------------------------------

  /** Minor units como string (seguro para JSON — evita perda de precisao com bigint). */
  toMinorString(): string {
    return this.minor.toString();
  }

  /** Valor "maior" como string, ex.: "100.50". Para apresentacao/calculo, nunca storage. */
  toMajorString(): string {
    const { scale } = getCurrency(this.currency);
    return new Decimal(this.minor.toString()).dividedBy(new Decimal(10).pow(scale)).toFixed(scale);
  }

  toDecimalMajor(): Decimal {
    const { scale } = getCurrency(this.currency);
    return new Decimal(this.minor.toString()).dividedBy(new Decimal(10).pow(scale));
  }

  toJSON(): { currency: CurrencyCode; minor: string } {
    return { currency: this.currency, minor: this.toMinorString() };
  }
}

export type RoundingMode = 'floor' | 'ceil' | 'half-up';

function roundDecimalToBigInt(value: Decimal, mode: RoundingMode): bigint {
  const rounded =
    mode === 'floor'
      ? value.toDecimalPlaces(0, Decimal.ROUND_FLOOR)
      : mode === 'ceil'
        ? value.toDecimalPlaces(0, Decimal.ROUND_CEIL)
        : value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  return BigInt(rounded.toFixed(0));
}

/**
 * Aplica uma percentagem a um `Money` (ex.: fee de 2%). Devolve minor units.
 * `mode` controla o arredondamento — por omissao arredonda para cima (a favor
 * da plataforma, nunca cobramos menos do que devido).
 */
export function percentOf(
  base: Money,
  percent: Decimal | string | number,
  mode: RoundingMode = 'ceil',
): Money {
  const pct = percent instanceof Decimal ? percent : new Decimal(percent);
  const result = new Decimal(base.minor.toString()).times(pct).dividedBy(100);
  return Money.fromMinor(base.currency, roundDecimalToBigInt(result, mode));
}

export interface ConversionResult {
  destination: Money;
  /** Taxa efetivamente aplicada (para auditoria e para gravar na Quote). */
  rate: Decimal;
}

/**
 * Converte um montante de uma moeda para outra usando uma taxa `Decimal`.
 * O montante do destinatario e arredondado PARA BAIXO por omissao: nunca
 * prometemos ao estudante mais do que conseguimos garantir.
 */
export function convert(
  source: Money,
  destinationCurrency: CurrencyCode,
  rate: Decimal | string | number,
  mode: RoundingMode = 'floor',
): ConversionResult {
  const rateDec = rate instanceof Decimal ? rate : new Decimal(rate);
  if (rateDec.lessThanOrEqualTo(0)) {
    throw new AppError(ErrorCode.INVALID_AMOUNT, 'taxa de cambio tem de ser positiva');
  }
  const srcScale = getCurrency(source.currency).scale;
  const dstScale = getCurrency(destinationCurrency).scale;
  const scaleFactor = new Decimal(10).pow(dstScale - srcScale);
  const destMinor = new Decimal(source.minor.toString()).times(rateDec).times(scaleFactor);
  return {
    destination: Money.fromMinor(destinationCurrency, roundDecimalToBigInt(destMinor, mode)),
    rate: rateDec,
  };
}
