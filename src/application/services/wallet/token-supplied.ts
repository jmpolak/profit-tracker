import { SuppliedTokensBalance } from 'src/core/entity/supply';
import { Wallet } from 'src/frameworks/database/model/wallet.model';

export abstract class WalletTokenSupplied {
  static getTokenSuppliedTokenFromWallet(
    wallet: Wallet,
    stb: SuppliedTokensBalance,
  ) {
    return wallet.sitesSupplied
      .find((ss) => ss.name === stb.site)
      ?.suppliedChains.find(
        (sc) =>
          sc.marketName === stb.market.marketName && // @ToDo we should put it into func -> this is a way to differemtiate markets
          sc.poolAddress === stb.market.poolAddress,
      )
      ?.tokens.find((t) => t.currency === stb.tokenSymbol);
  }
}
