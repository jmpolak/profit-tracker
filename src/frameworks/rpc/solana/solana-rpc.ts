import { Injectable, Scope } from '@nestjs/common';
import {
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { SupportedSites } from 'src/core/entity/site';
import { TransactionType, UserTransaction } from 'src/core/entity/transaction';
import { ConfigService } from '@nestjs/config';
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
  public parseRpcTransaction(
    // to utils
    tx: ParsedTransactionWithMeta,
    underlyingAsset: string, // usdc, sol
    metadata: {
      poolAddress: string;
      marketName: string;
      tokenSymbol: string;
      tokenPriceUsd: number;
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

            // calculate USD value if price known

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
}
