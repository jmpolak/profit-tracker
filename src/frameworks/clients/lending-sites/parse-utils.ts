import { BigNumber } from 'bignumber.js';
export abstract class ParseUtil {
  static divideTokenAmount(shares: string, decimals: number): string {
    // to utils
    const len = shares.length;
    if (decimals === 0) return shares;

    const whole = len > decimals ? shares.slice(0, len - decimals) : '0';
    let fraction =
      len > decimals
        ? shares.slice(len - decimals)
        : shares.padStart(decimals, '0');

    // trim trailing zeros
    fraction = fraction.replace(/0+$/, '');

    return fraction ? `${whole}.${fraction}` : whole;
  }

  static getUsdValue(tokenValue: string, usdPerTokenValue: string): string {
    return BigNumber(tokenValue)
      .multipliedBy(BigNumber(usdPerTokenValue))
      .toString();
  }

  static unwrapSymbolWhenCoinWrapped(currencyFullName: string, symbol: string) {
    if (/wrapped/i.test(currencyFullName) && /^[Ww]/.test(symbol)) {
      return symbol.substring(1);
    }
    return symbol;
  }
}
