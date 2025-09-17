import { Wallet } from 'src/frameworks/database/model/wallet.model';

export abstract class WalletFilterUtils {
  static getAvailableYearsAndMonthsFromWallet(
    wallet: Wallet,
  ): { year: number; months: number[] }[] {
    const yearMonthSet = new Map<number, Set<number>>();

    for (const token of wallet.tokenSupplied || []) {
      for (const file of token.fileData || []) {
        if (!file.date) continue;

        const date = new Date(file.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 0-indexed

        if (!yearMonthSet.has(year)) {
          yearMonthSet.set(year, new Set());
        }

        yearMonthSet.get(year)!.add(month);
      }
    }

    // Convert Map to array of { year, months[] }
    const result: { year: number; months: number[] }[] = [];
    for (const [year, monthsSet] of yearMonthSet.entries()) {
      result.push({
        year,
        months: Array.from(monthsSet).sort((a, b) => a - b),
      });
    }

    // Sort years ascending
    result.sort((a, b) => a.year - b.year);
    return result;
  }
}
