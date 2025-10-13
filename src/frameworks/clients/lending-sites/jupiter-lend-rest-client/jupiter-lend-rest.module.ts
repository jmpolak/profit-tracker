import { Module } from '@nestjs/common';
import { JupiterLendRestClient } from './jupiter-lend-rest-client';
import { SolanaRpcModule } from '../../../rpc/solana/solana-rpc.module';
import { CryptoPriceApiModule } from '../../external-api/crypto-price-api/crypto-price-api.module';

@Module({
  imports: [SolanaRpcModule, CryptoPriceApiModule],
  providers: [JupiterLendRestClient],
  exports: [JupiterLendRestClient],
})
export class JupiterLendRestModule {}
