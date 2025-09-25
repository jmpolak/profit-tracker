import { Err, UserTransactionItem } from '@aave/client';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IAaveRestClientRepository } from 'src/core/abstract/aave-rest-client/aave-rest-client-repository';
import { SuppliedPositions } from 'src/core/entity/transaction';
import { FileData, Wallet } from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { WalletFilterUtils } from 'src/application/services/wallet-filter/wallet-filter-utils';
import { WalletWithFilters } from 'src/core/entity/wallet';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';

@Injectable()
export class WalletUseCase {
  constructor(
    private aaveRestClient: IAaveRestClientRepository,
    private databaseRepository: IDataBaseRepository,
    private logger: LoggerPort,
  ) {}

  async removeWallet(walletAddress: string) {
    return await this.databaseRepository.walletDataBaseRepository.delete(
      walletAddress,
    );
  }

  async createWallet(walletAddress: string) {
    await WalletValidator.assertValid(walletAddress, this.databaseRepository);
    try {
      await this.databaseRepository.walletDataBaseRepository.createOrUpdate({
        address: walletAddress,
        tokenSupplied: [],
      });
      await this.updateWallet(walletAddress, true);
      return true;
    } catch (err) {
      this.logger.error(
        err?.message ?? `Error in creating wallet for ${walletAddress}`,
      );
      throw new InternalServerErrorException(
        err?.message ?? `Error in creating wallet for ${walletAddress}`,
      );
    }
  }

  async getWalletsDataWithFilters(): Promise<WalletWithFilters[]> {
    return (await this.getWalletsData()).map((w) => ({
      address: w.address,
      tokenSupplied: w.tokenSupplied,
      filters: WalletFilterUtils.getAvailableYearsAndMonthsFromWallet(w),
    }));
  }

  async getWalletsData(): Promise<Wallet[]> {
    try {
      return await this.databaseRepository.walletDataBaseRepository.findAll();
    } catch (err) {
      this.logger.error(err?.message ?? `Error getting all wallets`);
      throw new InternalServerErrorException(
        err?.message ?? `Error getting all wallets`,
      );
    }
  }

  async updateWallets() {
    try {
      const allWallets =
        await this.databaseRepository.walletDataBaseRepository.findAll();
      await Promise.allSettled(
        allWallets.map(async (wallet) => {
          return this.updateWallet(wallet.address);
        }),
      );
    } catch (err) {
      this.logger.error(err?.message ?? `Error updating all wallets`);
      throw new Error(err?.message ?? `Error updating all wallets`);
    }
  }

  private async getWalletData(userAddress: string): Promise<Wallet | null> {
    try {
      const wallet =
        await this.databaseRepository.walletDataBaseRepository.findByAddress(
          userAddress,
        );
      return wallet;
    } catch (err) {
      this.logger.error(err?.message ?? `Error getting wallet: ${userAddress}`);
      throw new Error(err?.message ?? `Error getting wallet: ${userAddress}`);
    }
  }

  private async updateWallet(userAddress: string, onWalletCreation?: boolean) {
    try {
      const currentSuppliedPositions =
        await this.aaveRestClient.getCurrentBalance(userAddress);
      const walletWithRecentUpdatedTokenSupplies =
        await this.databaseRepository.walletDataBaseRepository.getAllRecentUpdatedTokenSuppliedByWalletAddress(
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
              balance: '0',
              balanceInUsd: '0',
            };
          }
        });
      }
      const transactions =
        await this.aaveRestClient.getTransactions(userAddress);

      await this.handleWalletEntry(
        userAddress,
        currentSuppliedPositions,
        transactions,
        onWalletCreation,
      );
    } catch (err) {
      this.logger.error(
        err?.message ?? `Error updating wallet: ${userAddress}`,
      );
      throw new Error(err?.message ?? `Error updating wallet: ${userAddress}`);
    }
  }

  private async handleWalletEntry(
    // only in cron job we should make db updates
    userAddress: string,
    currentSuppliedPositions: SuppliedPositions,
    transactions: UserTransactionItem[],
    onWalletCreation?: boolean,
  ) {
    try {
      for (const key of Object.keys(currentSuppliedPositions)) {
        // make it as one call to db
        const wallet =
          await this.databaseRepository.walletDataBaseRepository.findByAddress(
            userAddress,
          );

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
        if (currentDayTransactionsByToken.length > 0) {
          currentDayTransactionsByToken.forEach((tx) =>
            this.logger.log(
              `Transaction: ${tx.txHash}, Time: ${tx.timestamp} will be handled`,
            ),
          );
        }
        const { dailyProfitInPercentage, dailyProfit } =
          TransactionsAnalyticUtils.getDailyProfit(
            position.balance ?? 0,
            wallet?.tokenSupplied
              .find((t) => t.currency === key)
              ?.fileData.at(0)?.balance ?? '0',
            // get last inserted fileData - its getting inserted on start of array
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
              transactions: currentDayTransactionsByToken.map(
                (tx) => tx.txHash,
              ),
              transactionBalance:
                currentDayTransactionBalanceByToken.toString(),
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
              transactions: currentDayTransactionsByToken.map(
                (tx) => tx.txHash,
              ),
              transactionBalance:
                currentDayTransactionBalanceByToken.toString(),
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
          await this.databaseRepository.walletDataBaseRepository.createOrUpdate(
            wallet,
          );
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
          await this.databaseRepository.walletDataBaseRepository.createOrUpdate(
            newWallet,
          );
        }
      }
    } catch (err) {
      throw new Error(
        err?.message ?? `Error handling wallet entry for ${userAddress}`,
      );
    }
  }
}
