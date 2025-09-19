import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import { FileData, Wallet } from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';
import { LoggerPort } from 'src/core/abstract/logger-port/logger-port';

@Injectable()
export class FileUseCase {
  constructor(
    private readonly excelFileService: IExcelFileServicePort,
    private readonly db: IDatabaseRepository<Wallet>,
    private logger: LoggerPort,
  ) {}

  async generateExcelReport(
    wallet: string,
    token: string,
    filters?: { year?: string; month?: string },
  ): Promise<{ bufferFile: Buffer; fileName: string }> {
    await WalletValidator.walletValidForFileGeneration(wallet, this.db);
    try {
      type ExcelData = Omit<FileData, 'createdByCreateWalletEvent'>;
      const dbWallet = await this.db.findByAddress(wallet);
      let tokenData: ExcelData[] =
        dbWallet?.tokenSupplied
          .find((t) => t.currency === token)
          ?.fileData.map(({ createdByCreateWalletEvent, ...rest }) => rest) ??
        [];

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
      interface FoterType {
        totalProfit: string;
      }
      const footer: FoterType = {
        totalProfit: TransactionsAnalyticUtils.getOverallProfit(tokenData),
      };
      if (tokenData.length === 0) {
        throw new Error(
          `No data provided to generate the Excel file for wallet ${wallet} for currency ${token} with filter ${JSON.stringify(filters)}`,
        );
      }
      return {
        bufferFile: await this.excelFileService.generateFile<
          ExcelData,
          FoterType
        >(tokenData, footer),
        fileName: `${wallet}-${token}-${filters?.year ? filters.year + (filters?.month ? '-' + filters.month : '') : this.getTodayDate()}.xlsx`,
      };
    } catch (err) {
      this.logger.error(err?.message ?? 'Error generating file');
      throw new InternalServerErrorException(
        err?.message ?? 'Error generating file',
      );
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
