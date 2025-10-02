import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IAaveRestClientRepository } from 'src/core/abstract/aave-rest-client/aave-rest-client-repository';
import { SuppliedTokensBalance } from 'src/core/entity/supply';
import {
  HistoricalData,
  SuppliedChain,
  SuppliedSite,
  SuppliedToken,
  Wallet,
} from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { WalletFilterUtils } from 'src/application/services/wallet-filter/wallet-filter-utils';
import { WalletWithFilters } from 'src/core/entity/wallet';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import { UserTransaction } from 'src/core/entity/transaction';
import { WalletTokenSupplied } from 'src/application/services/wallet/token-supplied';

@Injectable()
export class WalletUseCase {
  constructor(
    private aaveRestClient: IAaveRestClientRepository,
    private databaseRepository: IDataBaseRepository,
    private logger: LoggerPort,
  ) {}

  //@ToDo: remove it
  async test() {
    const test = await this.aaveRestClient.getMarkets();
    return test;
  }

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
        sitesSupplied: [],
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
      sitesSupplied: w.sitesSupplied,
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
      // Get current flat balance map from external source
      const currentSuppliedPositions =
        await this.aaveRestClient.getCurrentBalance(userAddress);

      // Fetch wallet with nested tokens from DB with recent update and currentBalance !== '0'
      const walletWithRecentUpdatedTokenSupplies =
        await this.databaseRepository.walletDataBaseRepository.getAllRecentUpdatedTokenSuppliedByWalletAddressWithBalance(
          userAddress,
        );

      // Defensive: Check for sitesSupplied and iterate nested tokens
      if (walletWithRecentUpdatedTokenSupplies?.sitesSupplied?.length) {
        for (const site of walletWithRecentUpdatedTokenSupplies.sitesSupplied) {
          for (const chain of site.suppliedChains ?? []) {
            for (const token of chain.tokens ?? []) {
              // If token currency is missing from currentSuppliedPositions, add zero balances
              if (
                !currentSuppliedPositions.find(
                  (csp) =>
                    csp.market.poolAddress.equalsIgnore(chain.poolAddress) &&
                    csp.market.marketName.equalsIgnore(chain.marketName),
                )
              ) {
                currentSuppliedPositions.push({
                  market: {
                    poolAddress: chain.poolAddress,
                    chainName: chain.chainName,
                    marketName: chain.marketName,
                  },
                  site: site.name,
                  balance: '0',
                  balanceInUsd: '0',
                  tokenSymbol: token.currency,
                });
              }
            }
          }
        }
      }

      const transactions =
        await this.aaveRestClient.getTransactionsOnAllChains(userAddress);

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
    currentSuppliedPositions: SuppliedTokensBalance[],
    transactions: UserTransaction[],
    onWalletCreation?: boolean,
  ) {
    try {
      let wallet =
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
      if (!wallet) {
        // should not happen, because in order to download suppliedTokens wallet should be in db
        wallet =
          await this.databaseRepository.walletDataBaseRepository.createOrUpdate(
            {
              address: userAddress,
              sitesSupplied: [],
            },
          );
      }

      // check if token on a site was already updated today
      for (const currentSuppliedPosition of currentSuppliedPositions) {
        const tokenSupplied =
          WalletTokenSupplied.getTokenSuppliedTokenFromWallet(
            wallet,
            {
              marketName: currentSuppliedPosition.market.marketName,
              poolAddress: currentSuppliedPosition.market.poolAddress,
            },
            currentSuppliedPosition.tokenSymbol,
            currentSuppliedPosition.site,
          );
        if (tokenSupplied) {
          const lastFileData = tokenSupplied.historicalData.at(-1);
          if (lastFileData && !lastFileData.createdByCreateWalletEvent) {
            const wasToday = checkIfLastUpdateWasToday(
              tokenSupplied.lastUpdate,
            );
            if (wasToday) {
              this.logger.warn(
                `Wallet entry for address ${userAddress} and token ${tokenSupplied.currency} was already updated today. Skipping update to avoid duplicates.`,
              );
              continue; // Skip to the next token if already updated today
            }
          }
        }

        // get transaction for one token
        const currentDayTransactionsByToken =
          TransactionsAnalyticUtils.filterTransactionsFromTodayAndByTokenSymbol(
            transactions,
            currentSuppliedPosition.tokenSymbol,
            currentSuppliedPosition.market.poolAddress,
            currentSuppliedPosition.market.marketName,
          );

        const currentDayTransactionBalanceByToken =
          TransactionsAnalyticUtils.getTransactionsBalance(
            currentDayTransactionsByToken,
          );

        const currentDayTransactionsBalanceByTokenInUsd =
          TransactionsAnalyticUtils.getTransactionsBalanceInUsd(
            currentDayTransactionsByToken,
          );

        currentDayTransactionsByToken.forEach((tx) =>
          this.logger.log(
            `Transaction: ${tx.txHash}, Time: ${tx.timestamp} will be handled`,
          ),
        );
        const { dailyProfitInPercentage, dailyProfit } =
          TransactionsAnalyticUtils.getDailyProfit(
            currentSuppliedPosition?.balance ?? '0',
            tokenSupplied?.currentBalance ?? '0',
            currentDayTransactionBalanceByToken,
          );
        const dateForInsert = new Date();
        // const dateForInsert = new Date(
        //   new Date().setDate(new Date().getDate() - 1),
        // );

        const createToken = () => ({
          currency: currentSuppliedPosition.tokenSymbol,
          currentBalance: currentSuppliedPosition.balance,
          currentBalanceInUsd: currentSuppliedPosition.balanceInUsd,
          lastUpdate: dateForInsert,
          historicalData: [
            {
              transactions: currentDayTransactionsByToken.map((t) => t.txHash),
              transactionBalance: currentDayTransactionBalanceByToken,
              transactionBalanceInUsd:
                currentDayTransactionsBalanceByTokenInUsd,
              balance: currentSuppliedPosition.balance,
              dailyProfit,
              dailyProfitInPercentage,
              ...(onWalletCreation
                ? { createdByCreateWalletEvent: true }
                : undefined),
              date: dateForInsert,
            },
          ],
        });

        const createChain = () => ({
          marketName: currentSuppliedPosition.market.marketName,
          chainName: currentSuppliedPosition.market.chainName,
          poolAddress: currentSuppliedPosition.market.poolAddress,
          tokens: [createToken()], // create token from above
        });

        const createSite = () => ({
          name: currentSuppliedPosition.site,
          suppliedChains: [createChain()], // create chain from above
        });

        const suppliedSite = wallet.sitesSupplied.find((ss) =>
          ss.name.equalsIgnore(currentSuppliedPosition.site),
        );
        if (suppliedSite) {
          const suppliedChain = suppliedSite.suppliedChains.find(
            (sc) =>
              sc.poolAddress.equalsIgnore(
                currentSuppliedPosition.market.poolAddress,
              ) &&
              sc.marketName.equalsIgnore(
                currentSuppliedPosition.market.marketName,
              ),
          );
          if (suppliedChain) {
            const suppliedToken = suppliedChain.tokens.find((t) =>
              t.currency.equalsIgnore(currentSuppliedPosition.tokenSymbol),
            );
            if (suppliedToken) {
              // update token
              suppliedToken.currentBalance = currentSuppliedPosition.balance;
              suppliedToken.currentBalanceInUsd =
                currentSuppliedPosition.balanceInUsd;
              suppliedToken.lastUpdate = dateForInsert;
              suppliedToken.historicalData.unshift({
                transactions: currentDayTransactionsByToken.map(
                  (t) => t.txHash,
                ),
                transactionBalance: currentDayTransactionBalanceByToken,
                transactionBalanceInUsd:
                  currentDayTransactionsBalanceByTokenInUsd,
                balance: currentSuppliedPosition.balance,
                dailyProfit,
                dailyProfitInPercentage,
                ...(onWalletCreation
                  ? { createdByCreateWalletEvent: true }
                  : undefined),
                date: dateForInsert,
              });
            } else {
              // create token in chain
              suppliedChain.tokens.push(createToken());
            }
          } else {
            // create chain & token in site
            suppliedSite.suppliedChains.push(createChain());
          }
        } else {
          // create site with chain & token in wallet
          wallet.sitesSupplied.push(createSite());
        }
      }
      await this.databaseRepository.walletDataBaseRepository.createOrUpdate(
        wallet,
      );
    } catch (err) {
      throw new Error(
        err?.message ?? `Error handling wallet entry for ${userAddress}`,
      );
    }
  }
}
