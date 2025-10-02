import {
  SuppliedToken,
  Wallet,
} from 'src/frameworks/database/model/wallet.model';

export abstract class WalletTokenSupplied {
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
