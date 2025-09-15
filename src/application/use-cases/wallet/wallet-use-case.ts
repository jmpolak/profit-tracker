import { UserTransactionItem } from '@aave/client';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IAaveRestClientRepository } from 'src/core/abstract/aave-rest-client/aave-rest-client-repository';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { SuppliedPositions } from 'src/core/entity/transaction';
import { FileData, Wallet } from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';

@Injectable()
export class WalletUseCase {
  private readonly logger = new Logger(WalletUseCase.name);
  constructor(
    private aaveRestClient: IAaveRestClientRepository,
    private databaseRepository: IDatabaseRepository<Wallet>,
  ) {}
  async createWallet(walletAddress: string) {
    try {
      await WalletValidator.assertValid(walletAddress, this.databaseRepository);
      await this.databaseRepository.createOrUpdate({
        address: walletAddress,
        tokenSupplied: [],
      });
      await this.updateWallet(walletAddress, true);
      return true;
    } catch (err) {
      throw new InternalServerErrorException(
        err?.message ?? 'Error in creating wallet',
      );
    }
  }

  async getWalletsData(): Promise<(Wallet | null)[]> {
    const allWallets = await this.databaseRepository.findAll();
    const results = await Promise.all(
      allWallets.map(async (wallet) => {
        return this.getWalletData(wallet.address);
      }),
    );
    return results;
  }

  async getWalletData(userAddress: string): Promise<Wallet | null> {
    const wallet = await this.databaseRepository.findByAddress(userAddress);
    return wallet;
  }

  public async updateWallets() {
    const allWallets = await this.databaseRepository.findAll();
    await Promise.all(
      allWallets.map(async (wallet) => {
        return this.updateWallet(wallet.address);
      }),
    );
  }

  public async updateWallet(userAddress: string, onWalletCreation?: boolean) {
    const currentSuppliedPositions =
      await this.aaveRestClient.getCurrentBalance(userAddress);
    const walletWithRecentUpdatedTokenSupplies =
      await this.databaseRepository.getAllRecentUpdatedTokenSuppliedByWalletAddress(
        userAddress,
      );
    // if user withdraw all his funds, currentSuppliedPositions will be empty but we want to keep the last known balance in db
    if (
      walletWithRecentUpdatedTokenSupplies?.tokenSupplied &&
      walletWithRecentUpdatedTokenSupplies.tokenSupplied?.length > 0
    ) {
      walletWithRecentUpdatedTokenSupplies.tokenSupplied.forEach((token) => {
        if (!currentSuppliedPositions[token.currency]) {
          currentSuppliedPositions[token.currency] = {
            balance: token?.currentBalance,
            balanceInUsd: token?.currentBalanceInUsd,
          };
        }
      });
    }
    const transactions = await this.aaveRestClient.getTransactions(userAddress);

    await this.handleWalletEntry(
      userAddress,
      currentSuppliedPositions,
      transactions,
      onWalletCreation,
    );
  }

  private async handleWalletEntry(
    // only in cron job we should make db updates
    userAddress: string,
    currentSuppliedPositions: SuppliedPositions,
    transactions: UserTransactionItem[],
    onWalletCreation?: boolean,
  ) {
    for (const key of Object.keys(currentSuppliedPositions)) {
      // make it as one call to db
      const wallet = await this.databaseRepository.findByAddress(userAddress);

      const checkIfLastUpdateWasToday = (date: Date): boolean => {
        const today = new Date();
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      };

      if (wallet) {
        const tokenSupplied = wallet.tokenSupplied.find(
          (t) => t.currency === key,
        );
        if (tokenSupplied) {
          const lastFileData = tokenSupplied.fileData.at(-1);
          if (lastFileData && !lastFileData.createdByCreateWalletEvent) {
            const wasToday = checkIfLastUpdateWasToday(
              tokenSupplied.lastUpdate,
            );
            if (wasToday) {
              this.logger.warn(
                `Wallet entry for address ${userAddress} and token ${key} was already updated today. Skipping update to avoid duplicates.`,
              );
              continue; // Skip to the next token if already updated today
            }
          }
        }
      }
      const position = currentSuppliedPositions[key];
      const currentDayTransactionsByToken =
        TransactionsAnalyticUtils.filterTransactionsFromTodayAndByTokenSymbol(
          transactions,
          key,
        );
      const currentDayTransactionBalanceByToken =
        TransactionsAnalyticUtils.getTransactionsBalance(
          currentDayTransactionsByToken,
        );

      const currentDayTransactionsBalanceByTokenInUsd =
        TransactionsAnalyticUtils.getTransactionsBalanceInUsd(
          currentDayTransactionsByToken,
        );

      const { dailyProfitInPercentage, dailyProfit } =
        TransactionsAnalyticUtils.getDailyProfit(
          position.balance ?? 0,
          wallet?.tokenSupplied
            .find((t) => t.currency === key)
            ?.fileData.find(
              (c) =>
                // get entry from yesterday
                new Date(c.date).getDate() ===
                new Date(
                  new Date().setDate(new Date().getDate() - 1),
                ).getDate(),
            )?.balance ?? '0',

          currentDayTransactionBalanceByToken,
        );
      const dateForInsert = new Date();
      // const dateForInsert = new Date(
      //   new Date().setDate(new Date().getDate() - 1),
      // );
      if (wallet) {
        const tokenSuppliedIndex = wallet.tokenSupplied.findIndex(
          (t) => t.currency === key,
        );
        if (tokenSuppliedIndex > -1) {
          // update
          const fileDataEntry: FileData = {
            transactions: currentDayTransactionsByToken.map((tx) => tx.txHash),
            transactionBalance: currentDayTransactionBalanceByToken.toString(),
            transactionBalanceInUsd:
              currentDayTransactionsBalanceByTokenInUsd.toString(),
            balance: position.balance,
            dailyProfit,
            dailyProfitInPercentage,
            date: dateForInsert,
            ...(onWalletCreation
              ? { createdByCreateWalletEvent: true }
              : undefined),
          };
          wallet.tokenSupplied[tokenSuppliedIndex].currentBalance =
            position.balance;
          wallet.tokenSupplied[tokenSuppliedIndex].currentBalanceInUsd =
            position.balanceInUsd;
          wallet.tokenSupplied[tokenSuppliedIndex].lastUpdate = dateForInsert;
          wallet.tokenSupplied[tokenSuppliedIndex].fileData.unshift(
            fileDataEntry,
          );
        } else {
          // push
          const fileDataEntry: FileData = {
            transactions: currentDayTransactionsByToken.map((tx) => tx.txHash),
            transactionBalance: currentDayTransactionBalanceByToken.toString(),
            transactionBalanceInUsd:
              currentDayTransactionsBalanceByTokenInUsd.toString(),
            balance: position.balance,
            dailyProfit,
            dailyProfitInPercentage,
            date: dateForInsert,
            ...(onWalletCreation
              ? { createdByCreateWalletEvent: true }
              : undefined),
          };
          wallet.tokenSupplied.push({
            currency: key,
            currentBalance: position.balance,
            currentBalanceInUsd: position.balanceInUsd,
            lastUpdate: dateForInsert,
            fileData: [fileDataEntry],
          });
        }
        await this.databaseRepository.createOrUpdate(wallet);
      } else {
        // create new wallet
        const fileDataEntry: FileData = {
          transactions: currentDayTransactionsByToken.map((tx) => tx.txHash),
          transactionBalance: currentDayTransactionBalanceByToken.toString(),
          transactionBalanceInUsd:
            currentDayTransactionsBalanceByTokenInUsd.toString(),
          balance: position.balance,
          dailyProfit,
          dailyProfitInPercentage,
          date: dateForInsert,
          ...(onWalletCreation
            ? { createdByCreateWalletEvent: true }
            : undefined),
        };
        const newWallet: Wallet = {
          address: userAddress,
          tokenSupplied: [
            {
              currency: key,
              currentBalance: position.balance,
              currentBalanceInUsd: position.balanceInUsd,
              lastUpdate: dateForInsert,
              fileData: [fileDataEntry],
            },
          ],
        };
        await this.databaseRepository.createOrUpdate(newWallet);
      }
    }
  }
}
