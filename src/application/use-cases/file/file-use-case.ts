import { Injectable } from '@nestjs/common';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import { FileData, Wallet } from 'src/frameworks/database/model/wallet.model';
import { TransactionsAnalyticUtils } from 'src/application/services/transactions/transactions-analytics-utils';
import { WalletValidator } from 'src/application/validators/wallet-validator/wallet-validator';

@Injectable()
export class FileUseCase {
  constructor(
    private readonly excelFileService: IExcelFileServicePort,
    private readonly db: IDatabaseRepository<Wallet>,
  ) {}

  async generateExcelReport(
    wallet: string,
    token: string,
  ): Promise<{ bufferFile: Buffer; fileName: string }> {
    await WalletValidator.walletValidForFileGeneration(wallet, this.db);
    type ExcelData = Omit<FileData, 'createdByCreateWalletEvent'>;
    const dbWallet = await this.db.findByAddress(wallet);
    const tokenData: ExcelData[] =
      dbWallet?.tokenSupplied
        .find((t) => t.currency === token)
        ?.fileData.map(({ createdByCreateWalletEvent, ...rest }) => rest) ?? [];

    const footer = [
      { sum: TransactionsAnalyticUtils.getOverallProfit(tokenData) },
    ];
    return {
      bufferFile: await this.excelFileService.generateFile<
        ExcelData,
        { sum: string }
      >(tokenData, footer),
      fileName: `${wallet}-${token}-${this.getTodayDate()}.xlsx`,
    };
  }

  private getTodayDate(): string {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
}
