import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoingeckoPriceApi {
  private readonly baseUrl: string =
    'https://api.coingecko.com/api/v3/simple/price';

  constructor() {}

  /**
   * Fetch USD prices for multiple cryptocurrencies in one call
   * @param symbols Array like ['BTC', 'ETH', 'SOL']
   * @returns Object like { BTC: 68123.42, ETH: 2451.67 }
   */
  async getUsdPrices(coinGeckoIds: string[]): Promise<Map<string, number>> {
    const url =
      this.baseUrl + `?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`;

    // Fetch price data
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
    }
    const data: Record<string, { usd: number }> = await res.json();

    // Create Map of token -> USD price
    const priceMap = new Map<string, number>(
      Object.entries(data).map(([key, value]) => [key, value.usd]),
    );

    return priceMap;
  }
}
