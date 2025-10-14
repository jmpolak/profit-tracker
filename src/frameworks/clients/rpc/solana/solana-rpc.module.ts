import { Module } from '@nestjs/common';
import { SolanaRpc } from './solana-rpc';

@Module({
  providers: [SolanaRpc],
  exports: [SolanaRpc],
})
export class SolanaRpcModule {}
