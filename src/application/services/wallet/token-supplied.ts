import {
  SuppliedSite,
  SuppliedToken,
  Wallet,
} from 'src/frameworks/database/model/wallet.model';
import { BigNumber } from 'bignumber.js';

export abstract class WalletTokenSupplied {
  static hasSuppliedTokenBalance(tokenSupplied: SuppliedToken) {
    return BigNumber(tokenSupplied.currentBalance).isGreaterThan(
      new BigNumber(0),
    );
  }

  static filterSuppliedSitesForBalanceGTZero(suppliedSites: SuppliedSite[]) {
    return suppliedSites
      .map((site) => ({
        ...site,
        suppliedChains: site.suppliedChains
          .map((chain) => ({
            ...chain,
            tokens: chain.tokens.filter((token) =>
              WalletTokenSupplied.hasSuppliedTokenBalance(token),
            ),
          }))
          .filter((chain) => chain.tokens.length > 0), // remove chains with no tokens
      }))
      .filter((site) => site.suppliedChains.length > 0); // remove sites with no chains;
  }

  static getTokenSuppliedTokenFromWallet(
    wallet: Wallet,
    market: {
      marketName: string;
      poolAddress: string;
    },
    tokenSymbol: string,
    site?: string,
  ): SuppliedToken | undefined {
    const siteForSearch = site
      ? [wallet.sitesSupplied.find((ss) => ss.name.equalsIgnore(site))]
      : wallet.sitesSupplied.flat();

    return siteForSearch.reduce((foundToken: SuppliedToken, site) => {
      const found = site?.suppliedChains
        .find(
          (sc) =>
            sc.marketName.equalsIgnore(market.marketName) &&
            sc.poolAddress.equalsIgnore(market.poolAddress),
        )
        ?.tokens.find((t) => t.currency.equalsIgnore(tokenSymbol));
      if (found) {
        foundToken = found;
      }
      return foundToken;
    }, undefined);
  }
}
