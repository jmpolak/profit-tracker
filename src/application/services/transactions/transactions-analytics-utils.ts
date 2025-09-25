import { UserTransactionItem } from '@aave/client';
import { TransactionType } from 'src/core/entity/transaction';
import { BigNumber } from 'bignumber.js';
import { FileData } from 'src/frameworks/database/model/wallet.model';
export abstract class TransactionsAnalyticUtils {
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
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp); // attention: tx.timestamp is UTC but we use local time
      return (
        txDate.getFullYear() === todayYear &&
        txDate.getMonth() === todayMonth &&
        txDate.getDate() === todayDate &&
        tx['reserve']?.aToken?.symbol === tokenSymbol
      );
    });
  }

  static getDailyProfit(
    balanceToday: string,
    lastBalance: string,
    netDepositsWithdrawals: string,
  ) {
    const balanceTodayBN = new BigNumber(balanceToday);
    const lastBalanceBN = new BigNumber(lastBalance);
    const netDepositsWithdrawalsBN = new BigNumber(netDepositsWithdrawals);
    const dailyProfit = lastBalanceBN.isZero()
      ? new BigNumber(0)
      : balanceTodayBN.minus(lastBalanceBN).minus(netDepositsWithdrawalsBN);
    const dailyProfitInPercentage = lastBalanceBN.isZero()
      ? new BigNumber(0)
      : dailyProfit.dividedBy(lastBalanceBN).multipliedBy(100);

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
