import { Module } from '@nestjs/common';
import { AaveRestClient } from './aave-rest-client/aave-rest-client';
import { JupiterLendRestClient } from './jupiter-lend-rest-client/jupiter-lend-rest-client';
import { ILendingRestClient } from 'src/frameworks/clients/lending-sites/lending-rest-client';
export const LENDING_REST_CLIENTS = 'LENDING_REST_CLIENT';
@Module({
  imports: [],
  providers: [
    AaveRestClient,
    JupiterLendRestClient,
    {
      provide: LENDING_REST_CLIENTS,
      useFactory: (
        jupiter: JupiterLendRestClient,
        aave: AaveRestClient,
      ): ILendingRestClient[] => [jupiter, aave],
      inject: [JupiterLendRestClient, AaveRestClient],
    },
  ],
  exports: [LENDING_REST_CLIENTS, AaveRestClient, JupiterLendRestClient],
})
export class LendingRestClientModule {}
