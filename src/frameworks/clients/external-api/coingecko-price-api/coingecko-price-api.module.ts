import { Module } from '@nestjs/common';
import { CoingeckoPriceApi } from './coingecko-price-api';

@Module({
  providers: [CoingeckoPriceApi],
  exports: [CoingeckoPriceApi],
})
export class CoingeckoPriceApiModule {}
