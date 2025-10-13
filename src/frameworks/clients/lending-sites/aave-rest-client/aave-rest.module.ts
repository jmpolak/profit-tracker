import { Module } from '@nestjs/common';

import { AaveRestClient } from './aave-rest-client';

@Module({
  providers: [AaveRestClient],
  exports: [AaveRestClient],
})
export class AaveRestModule {}
