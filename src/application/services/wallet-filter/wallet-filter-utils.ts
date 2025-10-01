import { SupportedSites } from 'src/core/entity/site';
import { Wallet } from 'src/frameworks/database/model/wallet.model';

export abstract class WalletFilterUtils {
  static getAvailableYearsAndMonthsFromWallet(wallet: Wallet): {
    site: string;
    chain: string;
    token: string;
    filters: { year: number; months: number[] }[];
  }[] {
    const result: {
      site: SupportedSites;
      marketName: string;
      chain: string;
      token: string;
      filters: { year: number; months: number[] }[];
    }[] = [];

    for (const site of wallet.sitesSupplied || []) {
      for (const chain of site.suppliedChains || []) {
        for (const token of chain.tokens || []) {
          const yearMonthMap = new Map<number, Set<number>>();

          for (const history of token.historicalData || []) {
            if (!history.date) continue;

            const date = new Date(history.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            if (!yearMonthMap.has(year)) {
              yearMonthMap.set(year, new Set());
            }

            yearMonthMap.get(year)!.add(month);
          }

          const filters = Array.from(yearMonthMap.entries())
            .map(([year, monthsSet]) => ({
              year,
              months: Array.from(monthsSet).sort((a, b) => a - b),
            }))
            .sort((a, b) => a.year - b.year);

          result.push({
            site: site.name,
            chain: chain.chainName,
            marketName: chain.marketName,
            token: token.currency,
            filters,
          });
        }
      }
    }

    return result;
  }
}
