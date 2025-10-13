import { Module } from '@nestjs/common';
import { CryptoPriceApi } from './crypto-price-api';

@Module({
  providers: [CryptoPriceApi],
  exports: [CryptoPriceApi],
})
export class CryptoPriceApiModule {}
