import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoPriceApi {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = configService.get<string>('CRYPTO-API') ?? '';
    this.apiKey = configService.get<string>('CRYPTO-API-KEY') ?? '';

    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Missing CoinMarketCap API configuration in .env');
    }
  }

  /**
   * Fetch USD prices for multiple cryptocurrencies in one call
   * @param symbols Array like ['BTC', 'ETH', 'SOL']
   * @returns Object like { BTC: 68123.42, ETH: 2451.67 }
   */
  async getUsdPrices(symbols: string[]): Promise<Map<string, number>> {
    if (!this.apiKey) {
      throw new HttpException(
        'Missing CoinMarketCap API key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = `${this.baseUrl}?symbol=${symbols.join(',')}&convert=USD`;

    try {
      const res = await fetch(url, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new HttpException(
          `CoinMarketCap API error: ${res.statusText}`,
          res.status,
        );
      }

      const json = await res.json();

      if (!json?.data) {
        throw new HttpException(
          'Invalid response from CoinMarketCap',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const prices: Map<string, number> = new Map();
      for (const symbol of symbols) {
        const price = json.data[symbol]?.quote?.USD?.price;
        if (price !== undefined) {
          prices.set(symbol, price);
        }
      }

      return prices;
    } catch (err: any) {
      console.error('CoinMarketCap fetch error:', err.message);
      throw new HttpException(
        'Failed to fetch prices from CoinMarketCap',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
