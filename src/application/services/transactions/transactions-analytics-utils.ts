import { TransactionType, UserTransaction } from 'src/core/entity/transaction';
import { BigNumber } from 'bignumber.js';
import { HistoricalData } from 'src/frameworks/database/model/wallet.model';
export abstract class TransactionsAnalyticUtils {
  static getOverallProfit(fileData: HistoricalData[]) {
    const sumOfProfit = fileData.reduce((sum, i) => {
      return sum.plus(new BigNumber(i.dailyProfit));
    }, new BigNumber(0));
    return sumOfProfit.toString();
  }

  static filterTransactionsFromTodayAndByTokenSymbol(
    transactions: UserTransaction[],
    tokenSymbol: string,
    poolAddress: string,
    marketName: string,
  ) {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp); // attention: tx.timestamp is UTC but we use local time
      return (
        txDate.getFullYear() === todayYear &&
        txDate.getMonth() === todayMonth &&
        txDate.getDate() === todayDate &&
        tx.tokenSymbol.equalsIgnore(tokenSymbol) &&
        tx.poolAddress.equalsIgnore(poolAddress) &&
        tx.marketName.equalsIgnore(marketName)
      );
    });
  }

  static getDailyProfit(
    balanceToday: string,
    lastBalance: string | undefined,
    netDepositsWithdrawals: string,
    onWalletCreation: boolean = false,
  ) {
    if (onWalletCreation || lastBalance === undefined) {
      return {
        dailyProfit: '0',
        dailyProfitInPercentage: '0%',
      };
    }
    const balanceTodayBN = new BigNumber(balanceToday);
    const lastBalanceBN = new BigNumber(lastBalance);
    const netDepositsWithdrawalsBN = new BigNumber(netDepositsWithdrawals);
    const dailyProfit = lastBalanceBN.isZero()
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
      : balanceTodayBN.minus(lastBalanceBN).minus(netDepositsWithdrawalsBN);
    const dailyProfitInPercentage = lastBalanceBN.isZero()
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
      : dailyProfit.dividedBy(lastBalanceBN).multipliedBy(100);

    return {
      dailyProfit: dailyProfit.toString(),
      dailyProfitInPercentage: dailyProfitInPercentage.toString() + '%',
    };
  }

  static getTransactionsBalance(transactions: UserTransaction[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  static getTransactionsBalanceInUsd(transactions: UserTransaction[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.usdValue)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx.usdValue)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  private static groupByTransactionsType(transactions: UserTransaction[]) {
    return transactions.reduce(
      (acc, tx) => {
        const type = tx.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(tx);
        return acc;
      },
      {} as Record<TransactionType, UserTransaction[]>,
    );
  }
}
