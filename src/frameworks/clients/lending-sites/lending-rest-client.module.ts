import { Module } from '@nestjs/common';
import { AaveRestClient } from './aave-rest-client/aave-rest-client';
import { JupiterLendRestClient } from './jupiter-lend-rest-client/jupiter-lend-rest-client';
import { ILendingRestClient } from 'src/core/abstract/lending-rest-client/lending-rest-client';
import { JupiterLendRestModule } from './jupiter-lend-rest-client/jupiter-lend-rest.module';
import { AaveRestModule } from './aave-rest-client/aave-rest.module';
export const LENDING_REST_CLIENTS = 'LENDING_REST_CLIENT';
@Module({
  imports: [JupiterLendRestModule, AaveRestModule],
  providers: [
    {
      provide: LENDING_REST_CLIENTS,
      useFactory: (
        aave: AaveRestClient,
        jupiter: JupiterLendRestClient,
      ): ILendingRestClient[] => [aave, jupiter],
      inject: [AaveRestClient, JupiterLendRestClient],
    },
  ],
  exports: [LENDING_REST_CLIENTS],
})
export class LendingRestClientModule {}
