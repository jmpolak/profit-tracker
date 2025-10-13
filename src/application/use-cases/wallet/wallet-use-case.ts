import { BadRequestException, Injectable } from '@nestjs/common';
import { Wallet } from 'src/frameworks/database/model/wallet.model';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { WalletFilterUtils } from 'src/application/services/wallet-filter/wallet-filter-utils';
import { WalletWithFilters } from 'src/core/entity/wallet';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import { WalletTokenSupplied } from 'src/application/services/wallet/token-supplied';
import { WalletUpdateDailyInformationFacade } from './facade/wallet-update-info-facade';
import { DailyPositionInformationForOnePosition } from 'src/core/entity/daily-position-information';

@Injectable()
export class WalletUseCase {
  constructor(
    private walletFacade: WalletUpdateDailyInformationFacade,
    private databaseRepository: IDataBaseRepository,
    private logger: LoggerPort,
  ) {}

  //@ToDo: remove it
  async test() {
    // const wallet = await this.getWalletData('BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG')
    const test = await this.walletFacade.getDailyInformation({
      address: 'BAGbqJ9SerqSFeZzkFvKumhnH64G6s2PTW2VWc5MTpYG',
      sitesSupplied: [],
    });
    return test;
  }

  async removeWallet(walletAddress: string) {
    return await this.databaseRepository.walletDataBaseRepository.delete(
      walletAddress,
    );
  }

  async createWallet(walletAddress: string) {
    try {
      await WalletValidator.assertValid(walletAddress, this.databaseRepository);
      const wallet =
        await this.databaseRepository.walletDataBaseRepository.createOrUpdate({
          address: walletAddress,
          sitesSupplied: [],
        });
      await this.updateWallet(wallet, true);
      return true;
    } catch (err) {
      this.logger.error(
        err?.message ?? `Error in creating wallet for ${walletAddress}`,
      );
      throw new BadRequestException(
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
      throw new BadRequestException(
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
          return this.updateWallet(wallet);
        }),
      );
    } catch (err) {
      this.logger.error(err?.message ?? `Error updating all wallets`);
      throw new BadRequestException(
        err?.message ?? `Error updating all wallets`,
      );
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
      throw new BadRequestException(
        err?.message ?? `Error getting wallet: ${userAddress}`,
      );
    }
  }

  private async updateWallet(wallet: Wallet, onWalletCreation?: boolean) {
    try {
      const dailyInfo = await this.walletFacade.getDailyInformation(
        wallet,
        onWalletCreation,
      );

      await this.handleWalletEntry(wallet.address, dailyInfo, onWalletCreation);
    } catch (err) {
      this.logger.error(
        err?.message ?? `Error updating wallet: ${wallet.address}`,
      );
      throw new Error(
        err?.message ?? `Error updating wallet: ${wallet.address}`,
      );
    }
  }
  private async handleWalletEntry(
    // only in cron job we should make db updates
    userAddress: string,
    dailyInfo: DailyPositionInformationForOnePosition[],
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
      for (const info of dailyInfo) {
        const tokenSupplied =
          WalletTokenSupplied.getTokenSuppliedTokenFromWallet(
            wallet,
            {
              marketName: info.supply.market.marketName,
              poolAddress: info.supply.market.poolAddress,
            },
            info.supply.tokenSymbol,
            info.supply.site,
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

        info.userTransactions.forEach((tx) =>
          this.logger.log(
            `Transaction: ${tx.txHash}, Time: ${tx.timestamp} will be handled`,
          ),
        );

        const dateForInsert = new Date();
        // const dateForInsert = new Date(
        //   new Date().setDate(new Date().getDate() - 1),
        // );

        const createToken = () => ({
          currency: info.supply.tokenSymbol,
          currentBalance: info.supply.balance,
          currentBalanceInUsd: info.supply.balanceInUsd,
          lastUpdate: dateForInsert,
          historicalData: [
            {
              transactions: info.userTransactions.map((t) => t.txHash),
              transactionBalance: info.transactionBalance,
              transactionBalanceInUsd: info.transactionBalanceInUsd,
              balance: info.supply.balance,
              dailyProfit: info.dailyProfit,
              dailyProfitInPercentage: info.dailyProfitInPercentage,
              ...(onWalletCreation
                ? { createdByCreateWalletEvent: true }
                : undefined),
              date: dateForInsert,
            },
          ],
        });

        const createChain = () => ({
          marketName: info.supply.market.marketName,
          chainName: info.supply.market.chainName,
          poolAddress: info.supply.market.poolAddress,
          tokens: [createToken()], // create token from above
        });

        const createSite = () => ({
          name: info.supply.site,
          suppliedChains: [createChain()], // create chain from above
        });

        const suppliedSite = wallet.sitesSupplied.find((ss) =>
          ss.name.equalsIgnore(info.supply.site),
        );
        if (suppliedSite) {
          const suppliedChain = suppliedSite.suppliedChains.find(
            (sc) =>
              sc.poolAddress.equalsIgnore(info.supply.market.poolAddress) &&
              sc.marketName.equalsIgnore(info.supply.market.marketName),
          );
          if (suppliedChain) {
            const suppliedToken = suppliedChain.tokens.find((t) =>
              t.currency.equalsIgnore(info.supply.tokenSymbol),
            );
            if (suppliedToken) {
              // update token
              suppliedToken.currentBalance = info.supply.balance;
              suppliedToken.currentBalanceInUsd = info.supply.balanceInUsd;
              suppliedToken.lastUpdate = dateForInsert;
              suppliedToken.historicalData.unshift({
                transactions: info.userTransactions.map((t) => t.txHash),
                transactionBalance: info.transactionBalance,
                transactionBalanceInUsd: info.transactionBalanceInUsd,
                balance: info.supply.balance,
                dailyProfit: info.dailyProfit,
                dailyProfitInPercentage: info.transactionBalanceInUsd,
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
