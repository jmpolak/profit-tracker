import { Sites, SupportedSites } from 'src/core/entity/site';
import {
  AaveGetDailyInformationStrategy,
  GetDailyInformationStrategy,
  JupiterGetDailyInformationStrategy,
} from '../strategy/get-data-strategy';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class StrategyFactory {
  constructor(private readonly moduleRef: ModuleRef) {}
  create(site: SupportedSites): GetDailyInformationStrategy {
    switch (site) {
      case Sites.AAVE:
        return this.moduleRef.get(AaveGetDailyInformationStrategy, {
          strict: true,
        });
      case Sites.JUPITER:
        return this.moduleRef.get(JupiterGetDailyInformationStrategy, {
          strict: true,
        });
      default:
        throw new Error(`Unsupported site: ${site}`);
    }
  }
}
