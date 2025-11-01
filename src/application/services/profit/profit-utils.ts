import { HistoricalData } from 'src/frameworks/database/model/wallet.model';
import { BigNumber } from 'bignumber.js';
export abstract class ProfitUtils {
  static getOverallProfit(fileData: HistoricalData[]) {
    const sumOfProfit = fileData.reduce((sum, i) => {
      return sum.plus(new BigNumber(i.dailyProfit));
    }, new BigNumber(0));
    return sumOfProfit.toString();
  }

  static getDailyProfit(
    balanceToday: string,
    lastBalance: string | undefined,
    netDepositsWithdrawals: string,
    onWalletCreation: boolean = false,
  ) {
    if (onWalletCreation) {
      return {
        dailyProfit: '0',
        dailyProfitInPercentage: '0%',
      };
    }
    const balanceTodayBN = new BigNumber(balanceToday);
    const netDepositsWithdrawalsBN = new BigNumber(netDepositsWithdrawals);
    const dailyProfit =
      lastBalance === undefined
        ? (() => {
            if (netDepositsWithdrawalsBN.isZero()) {
              return new BigNumber(0);
            }
            const dailyProfitTemp = balanceTodayBN.minus(
              netDepositsWithdrawalsBN,
            );
            return dailyProfitTemp.isGreaterThan(new BigNumber(0))
              ? dailyProfitTemp
              : new BigNumber(0);
          })()
        : balanceTodayBN
            .minus(new BigNumber(lastBalance))
            .minus(netDepositsWithdrawalsBN);
    const dailyProfitInPercentage =
      lastBalance === undefined || new BigNumber(lastBalance).isZero()
        ? (() => {
            if (netDepositsWithdrawalsBN.isZero()) {
              return new BigNumber(0);
            }
            const dailyProfitTemp = dailyProfit
              .dividedBy(netDepositsWithdrawalsBN)
              .multipliedBy(100);
            return dailyProfitTemp.isGreaterThan(0)
              ? dailyProfitTemp
              : new BigNumber(0);
          })()
        : dailyProfit.dividedBy(new BigNumber(lastBalance)).multipliedBy(100);

    return {
      dailyProfit: dailyProfit.toString(),
      dailyProfitInPercentage: dailyProfitInPercentage.toString() + '%',
    };
  }
}
