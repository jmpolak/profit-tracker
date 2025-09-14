import { UserTransactionItem } from '@aave/client';
import { TransactionType } from 'src/core/entity/transaction';
import { BigNumber } from 'bignumber.js';
import { FileData } from 'src/frameworks/database/model/wallet.model';
export class TransactionsAnalyticUtils {
  static getOverallProfit(fileData: FileData[]) {
    const sumOfProfit = fileData.reduce((sum, i) => {
      return sum.plus(new BigNumber(i.dailyProfit));
    }, new BigNumber(0));
    return sumOfProfit.toString();
  }

  static filterTransactionsFromTodayAndByTokenSymbol(
    transactions: UserTransactionItem[],
    tokenSymbol: string,
  ) {
    const today = new Date();
    // Get year, month, day of today in UTC or local time (choose one consistently)
    const todayYear = today.getUTCFullYear();
    const todayMonth = today.getUTCMonth();
    const todayDate = today.getUTCDate();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      return (
        txDate.getUTCFullYear() === todayYear &&
        txDate.getUTCMonth() === todayMonth &&
        txDate.getUTCDate() === todayDate &&
        tx['reserve']?.aToken?.symbol === tokenSymbol
      );
    });
  }

  static getDailyProfit(
    balanceToday: string,
    balanceYesterday: string,
    netDepositsWithdrawals: string,
  ) {
    const balanceTodayBN = new BigNumber(balanceToday);
    const balanceYesterdayBN = new BigNumber(balanceYesterday);
    const netDepositsWithdrawalsBN = new BigNumber(netDepositsWithdrawals);
    const dailyProfit = balanceYesterdayBN.isZero()
      ? new BigNumber(0)
      : balanceTodayBN
          .minus(balanceYesterdayBN)
          .minus(netDepositsWithdrawalsBN);
    const dailyProfitInPercentage = balanceYesterdayBN.isZero()
      ? new BigNumber(0)
      : dailyProfit.dividedBy(balanceYesterdayBN).multipliedBy(100);

    return {
      dailyProfit: dailyProfit.toString(),
      dailyProfitInPercentage: dailyProfitInPercentage.toString() + '%',
    };
  }

  static getTransactionsBalance(transactions: UserTransactionItem[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx['amount'].amount.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx['amount'].amount.value)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  static getTransactionsBalanceInUsd(transactions: UserTransactionItem[]) {
    const transactionsByType =
      TransactionsAnalyticUtils.groupByTransactionsType(transactions);
    const totalDeposits = transactionsByType[TransactionType.SUPPLY]
      ? transactionsByType[TransactionType.SUPPLY].reduce(
          (sum, tx) => sum.plus(BigNumber(tx['amount'].usd)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    const totalWithdrawals = transactionsByType[TransactionType.WITHDRAW]
      ? transactionsByType[TransactionType.WITHDRAW].reduce(
          (sum, tx) => sum.plus(BigNumber(tx['amount'].usd)),
          new BigNumber(0),
        )
      : new BigNumber(0);
    return totalDeposits.minus(totalWithdrawals).toString();
  }

  private static groupByTransactionsType(transactions: UserTransactionItem[]) {
    return transactions.reduce(
      (acc, tx) => {
        const type = tx.__typename;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(tx);
        return acc;
      },
      {} as Record<TransactionType, UserTransactionItem[]>,
    );
  }
}
