import { Injectable, Scope } from '@nestjs/common';
import {
  ConfirmedSignatureInfo,
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { SupportedSites } from 'src/core/entity/site';
import { TransactionType, UserTransaction } from 'src/core/entity/transaction';
import { ConfigService } from '@nestjs/config';
import { TimeUtil } from 'src/shared/utils/time';
import { ImmutableDate } from 'src/core/entity/immutable-date';
@Injectable({ scope: Scope.TRANSIENT })
export class SolanaRpc extends Connection {
  constructor(private readonly configService: ConfigService) {
    const rpcUrl = configService.get<string>(
      'SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY',
    );

    if (!rpcUrl) {
      throw new Error(
        'Missing SOLANA-RPC-URL-WITH-OR-WITHOUT-KEY in environment variables',
      );
    }

    super(rpcUrl);
  }

  public async getTransactionsFromRpc(
    userAddress: string,
    underlyingAssetAddress: string,
    metadata: {
      poolAddress: string;
      marketName: string;
      tokenSymbol: string;
      tokenPriceUsd: string;
      siteName: SupportedSites;
    },
    date: ImmutableDate,
  ): Promise<UserTransaction[]> {
    const BATCH_SIZE = 5;
    const result: UserTransaction[] = [];
    const sigInfosUnFiltered = await this.getSignaturesForAddress(
      new PublicKey(userAddress),
      { limit: 1000 },
    );

    const sigInfos = this.filterTrxByDate(sigInfosUnFiltered, date);

    for (let i = 0; i < sigInfos.length; i += BATCH_SIZE) {
      const batch = sigInfos.slice(i, i + BATCH_SIZE);
      const signatures = batch.map((s) => s.signature);

      for (const signature of signatures) {
        const t = await this.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (t) {
          const resultTrx = this.parseRpcTransaction(
            t,
            underlyingAssetAddress,
            metadata,
            metadata.siteName,
          );
          resultTrx ? result.push(resultTrx) : undefined;
        }
        await TimeUtil.delay(500);
      }

      await TimeUtil.delay(500); // throttle
    }

    return result;
  }

  private parseRpcTransaction(
    tx: ParsedTransactionWithMeta,
    underlyingAsset: string, // usdc, sol
    metadata: {
      poolAddress: string;
      marketName: string;
      tokenSymbol: string;
      tokenPriceUsd: string;
    },
    siteName: SupportedSites,
  ): UserTransaction | null {
    const result: UserTransaction = {
      site: siteName,
      poolAddress: metadata.poolAddress,
      marketName: metadata.marketName,
      type: TransactionType.UNKNOWN,
      txHash: tx.transaction.signatures[0],
      tokenSymbol: metadata.tokenSymbol,
      value: '0',
      usdValue: '0',
      timestamp: new Date((tx.blockTime ?? 0) * 1000),
    };

    // --- 1. Detect Deposit or Withdraw from logs ---
    const logs = tx.meta?.logMessages || [];
    if (logs.some((l) => l.includes('Instruction: Deposit'))) {
      result.type = TransactionType.SUPPLY;
    } else if (logs.some((l) => l.includes('Instruction: Withdraw'))) {
      result.type = TransactionType.WITHDRAW;
    }

    const innerIx = tx.meta?.innerInstructions ?? [];

    const poolInvolved = innerIx.some((group) =>
      (group.instructions ?? []).some((ix) => {
        // check in accounts list or parsed info if available
        if (
          'accounts' in ix &&
          ix.accounts?.includes(new PublicKey(metadata.poolAddress))
        ) {
          return true;
        }
        if ('parsed' in ix && ix.parsed?.info) {
          const info = ix.parsed.info;
          return (
            info.source === metadata.poolAddress ||
            info.destination === metadata.poolAddress ||
            info.mint === metadata.poolAddress
          );
        }
        return false;
      }),
    );

    if (!poolInvolved) {
      return null; // this tx doesn’t touch the jL pool
    }

    for (const group of innerIx) {
      for (const ix of group.instructions ?? []) {
        if (
          'program' in ix &&
          ix.program === 'spl-token' &&
          ix.parsed?.type === 'transferChecked'
        ) {
          const info = ix.parsed.info;
          if (info.mint === underlyingAsset) {
            // value as string
            result.value = info.tokenAmount.uiAmountString;
            const amountNum = BigNumber(info.tokenAmount.uiAmountString);
            result.usdValue = amountNum
              .multipliedBy(BigNumber(metadata.tokenPriceUsd))
              .toString();

            return result;
          }
        }
      }
    }

    return result;
  }

  private filterTrxByDate(
    trx: ConfirmedSignatureInfo[],
    targetDate: ImmutableDate,
  ): ConfirmedSignatureInfo[] {
    const start = new Date(targetDate.getTime());
    const end = new Date(targetDate.getTime());
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const startTimestamp = Math.floor(start.getTime() / 1000);
    const endTimestamp = Math.floor(end.getTime() / 1000);
    return trx.filter(
      (tx) =>
        tx.blockTime &&
        tx.blockTime >= startTimestamp &&
        tx.blockTime <= endTimestamp,
    );
  }
}
