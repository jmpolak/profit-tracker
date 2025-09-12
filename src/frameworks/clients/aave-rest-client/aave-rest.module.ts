import { Module } from '@nestjs/common';
import { IAaveRestClientRepository } from 'src/core/abstract/aave-rest-client/aave-rest-client-repository';
import { AaveRestClient } from './aave-rest-client';

@Module({
  providers: [
    {
      provide: IAaveRestClientRepository,
      useClass: AaveRestClient,
    },
  ],
  exports: [IAaveRestClientRepository],
})
export class AaveRestModule {}
