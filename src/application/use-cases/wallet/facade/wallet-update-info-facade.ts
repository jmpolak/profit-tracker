import { Injectable } from '@nestjs/common';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletTokenSupplied } from 'src/application/services/wallet/token-supplied';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import {
  DailyPositionsInformation,
  DailyPositionInformationForOnePosition,
} from 'src/core/entity/daily-position-information';
import { Wallet } from 'src/frameworks/database/model/wallet.model';
import { IDailyInfoFetcherFacade } from 'src/core/abstract/daily-info-facade/daily-info-facade';
import { ProfitUtils } from 'src/application/services/profit/profit-utils';
import { ImmutableDate } from 'src/core/entity/immutable-date';
import { DateUtil } from 'src/shared/utils/date';
@Injectable()
export class WalletUpdateDailyInformationFacade {
  constructor(
    private databaseRepository: IDataBaseRepository,
    private dailyInfoFetcher: IDailyInfoFetcherFacade,
  ) {}
  async getDailySupplyInformation(
    wallet: Wallet,
    onWalletCreation: boolean,
    date: ImmutableDate,
  ): Promise<DailyPositionInformationForOnePosition[]> {
    const result: DailyPositionInformationForOnePosition[] = [];

    const suppliedSitesWithRecentUpdatedTokens =
      await this.databaseRepository.walletDataBaseRepository.getSitesRecentUpdatedTokensByWalletAddress(
        wallet.address,
        date,
      );
    // needed for solana rpc - filter for transactions with involved addresses
    // if wallet withdrawed everything we will not get transactions for it
    const poolAddresses =
      suppliedSitesWithRecentUpdatedTokens?.flatMap((site) =>
        site.suppliedChains?.map((chain) => chain.poolAddress),
      ) ?? [];

    const dailyInformation = (
      await this.dailyInfoFetcher.execute(wallet.address, poolAddresses)
    ).reduce(
      (acc, obj) => ({
        supply: [...acc.supply, ...obj.supply],
        userTransactions: [...acc.userTransactions, ...obj.userTransactions],
      }),
      { supply: [], userTransactions: [] } as DailyPositionsInformation,
    );

    let { supply, userTransactions } = dailyInformation;

    if (onWalletCreation) {
      userTransactions = []; // track transactions from the creation event date
    }

    for (const site of suppliedSitesWithRecentUpdatedTokens) {
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
        TransactionsAnalyticUtils.filterTransactionsByDate(
          TransactionsAnalyticUtils.filterTransactionsByToken(
            userTransactions,
            stb.tokenSymbol,
            stb.market.poolAddress,
            stb.market.marketName,
          ),
          date,
          // if update was made today (by create event, only get todays trx after the creation time)
          ...(tokenSupplied &&
          tokenSupplied.historicalData?.at(0)?.createdByCreateWalletEvent
            ? [tokenSupplied.lastUpdate]
            : [undefined]),
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
        ProfitUtils.getDailyProfit(
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
