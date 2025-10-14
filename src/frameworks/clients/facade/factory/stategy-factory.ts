import { Sites, SupportedSites } from 'src/core/entity/site';
import {
  AaveGetDailyInformationStrategy,
  GetDailyInformationStrategy,
  JupiterGetDailyInformationStrategy,
} from '../strategy/get-data-strategy';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StrategyFactory {
  constructor(
    private aaveStrategy: AaveGetDailyInformationStrategy,
    private jupiterStrategy: JupiterGetDailyInformationStrategy,
  ) {}
  create(site: SupportedSites): GetDailyInformationStrategy {
    switch (site) {
      case Sites.AAVE:
        return this.aaveStrategy;
      case Sites.JUPITER:
        return this.jupiterStrategy;
      default:
        throw new Error(`Unsupported site: ${site}`);
    }
  }
}
