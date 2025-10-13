import { Inject, Injectable } from '@nestjs/common';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletTokenSupplied } from 'src/application/services/wallet/token-supplied';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import { ILendingRestClient } from 'src/core/abstract/lending-rest-client/lending-rest-client';
import {
  DailyPositionsInformation,
  DailyPositionInformationForOnePosition,
} from 'src/core/entity/daily-position-information';
import { LENDING_REST_CLIENTS } from 'src/frameworks/clients/lending-sites/lending-rest-client.module';
import { Wallet } from 'src/frameworks/database/model/wallet.model';
@Injectable()
export class WalletUpdateDailyInformationFacade {
  @Inject(LENDING_REST_CLIENTS)
  private lendingRestClient: ILendingRestClient[];
  constructor(private databaseRepository: IDataBaseRepository) {}
  async getDailyInformation(
    wallet: Wallet,
    onWalletCreation?: boolean,
  ): Promise<DailyPositionInformationForOnePosition[]> {
    const result: DailyPositionInformationForOnePosition[] = [];
    const dailyInformation = (
      await Promise.all(
        this.lendingRestClient
          .filter((lrc) => lrc.isExecutable(wallet.address)) // execute aave only for evm address - jupiter only for solana address
          .map((lrc) => lrc.getDailyPositionInformation(wallet.address)),
      )
    ).reduce(
      (acc, obj) => ({
        supply: [...acc.supply, ...obj.supply],
        userTransactions: [...acc.userTransactions, ...obj.userTransactions],
      }),
      { supply: [], userTransactions: [] } as DailyPositionsInformation,
    );

    const walletWithRecentUpdatedTokenSupplies =
      await this.databaseRepository.walletDataBaseRepository.getAllRecentUpdatedTokenSuppliedByWalletAddress(
        wallet.address,
      );
    const { supply, userTransactions } = dailyInformation;

    if (walletWithRecentUpdatedTokenSupplies?.sitesSupplied?.length) {
      for (const site of walletWithRecentUpdatedTokenSupplies.sitesSupplied) {
        for (const chain of site.suppliedChains ?? []) {
          for (const token of chain.tokens ?? []) {
            // If token currency is missing from supply, add zero balances
            if (
              WalletTokenSupplied.hasSuppliedTokenBalance(token) &&
              !supply.find(
                (csp) =>
                  csp.market.poolAddress.equalsIgnore(chain.poolAddress) &&
                  csp.market.marketName.equalsIgnore(chain.marketName) &&
                  csp.tokenSymbol.equalsIgnore(token.currency),
              )
            ) {
              supply.push({
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
    for (const stb of supply) {
      const tokenSupplied = WalletTokenSupplied.getTokenSuppliedTokenFromWallet(
        wallet,
        {
          marketName: stb.market.marketName,
          poolAddress: stb.market.poolAddress,
        },
        stb.tokenSymbol,
        stb.site,
      );
      const currentDayTransactionsByToken =
        TransactionsAnalyticUtils.filterTransactionsFromTodayAndByTokenSymbol(
          userTransactions,
          stb.tokenSymbol,
          stb.market.poolAddress,
          stb.market.marketName,
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
          stb.balance,
          tokenSupplied?.currentBalance,
          currentDayTransactionBalanceByToken,
          onWalletCreation,
        );
      result.push({
        supply: stb,
        userTransactions: currentDayTransactionsByToken,
        transactionBalance: currentDayTransactionBalanceByToken,
        transactionBalanceInUsd: currentDayTransactionsBalanceByTokenInUsd,
        dailyProfit: dailyProfit,
        dailyProfitInPercentage: dailyProfitInPercentage,
      });
    }
    return result;
  }
}
