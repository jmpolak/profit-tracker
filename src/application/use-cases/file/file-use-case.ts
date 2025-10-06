import { BadRequestException, Injectable } from '@nestjs/common';
import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import {
  HistoricalData,
  Wallet,
} from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';
import { IDataBaseRepository } from 'src/core/abstract/database-repository.ts/database-repository';
import { WalletTokenSupplied } from 'src/application/services/wallet/token-supplied';

@Injectable()
export class FileUseCase {
  constructor(
    private readonly excelFileService: IExcelFileServicePort,
    private readonly db: IDataBaseRepository,
    private logger: LoggerPort,
  ) {}

  async generateExcelReport(
    wallet: string,
    marketName: string,
    poolAddress: string,
    token: string,
    filters?: { year?: string; month?: string },
  ): Promise<{ bufferFile: Buffer; fileName: string }> {
    try {
      await WalletValidator.walletValidForFileGeneration(wallet, this.db);
      type ExcelData = Omit<HistoricalData, 'createdByCreateWalletEvent'>;

      const dbWallet =
        await this.db.walletDataBaseRepository.findByAddress(wallet);
      if (!dbWallet) {
        throw new Error(`Wallet not found: ${wallet}`);
      }

      // Step 1: Find all matching tokens across all sites and chains
      let tokenData: ExcelData[] = [];

      const suppliedToken = WalletTokenSupplied.getTokenSuppliedTokenFromWallet(
        dbWallet,
        { marketName, poolAddress },
        token,
      );
      const data =
        suppliedToken?.historicalData.map(
          ({ createdByCreateWalletEvent, ...rest }) => rest,
        ) ?? [];
      tokenData.push(...data);

      // Step 2: Apply filters
      if (filters?.year) {
        tokenData = tokenData.filter((data) => {
          const txDate = new Date(data.date);
          return txDate.getFullYear().toString() === filters.year;
        });
      }

      if (filters?.month) {
        tokenData = tokenData.filter((data) => {
          const txDate = new Date(data.date);
          return (
            (txDate.getMonth() + 1).toString().padStart(2, '0') ===
            filters.month
          );
        });
      }

      interface FooterType {
        totalProfit: string;
      }
      interface HeaderType {
        walletAddress: string;
        marketName: string;
        token: string;
      }

      const header: HeaderType = {
        walletAddress: wallet,
        marketName,
        token,
      };

      const footer: FooterType = {
        totalProfit: TransactionsAnalyticUtils.getOverallProfit(tokenData),
      };

      if (tokenData.length === 0) {
        throw new Error(
          `No data provided to generate the Excel file for wallet ${wallet} for currency ${token} with filter ${JSON.stringify(filters)}`,
        );
      }

      // Step 4: Return the file
      return {
        bufferFile: await this.excelFileService.generateFile<
          ExcelData,
          HeaderType,
          FooterType
        >(tokenData, header, footer),
        fileName: `${wallet}-${marketName}-${token}-${filters?.year ? filters.year + (filters?.month ? '-' + filters.month : '') : this.getTodayDate()}.xlsx`,
      };
    } catch (err) {
      this.logger.error(err?.message ?? 'Error generating file');
      throw new BadRequestException(err?.message ?? 'Error generating file');
    }
  }

  private getTodayDate(): string {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
}
