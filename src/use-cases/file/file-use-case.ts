import { Injectable } from '@nestjs/common';
import { IDatabaseRepository } from 'src/core/abstract/database-client.ts/database-repository';
import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import { FileData, Wallet } from 'src/frameworks/database/model/wallet.model';
import { TransactionsFilterUtils } from 'src/utils/transactions-filter-utils';

@Injectable()
export class FileUseCase {
  constructor(
    private readonly excelFileService: IExcelFileServicePort,
    private readonly db: IDatabaseRepository<Wallet>,
    private readonly transactionFiler: TransactionsFilterUtils,
  ) {}

  async generateExcelReport(wallet: string, token: string): Promise<string> {
    const dbWallet = await this.db.findByAddress(wallet);
    if (!dbWallet) {
      throw new Error('Wallet not found');
    }
    if (!dbWallet.tokenSupplied) {
      throw new Error('No token supplied data found for this wallet');
    }
    const tokenData = dbWallet.tokenSupplied.find(
      (t) => t.currency === token,
    )?.fileData;
    if (!tokenData) {
      throw new Error('Token not found in wallet');
    }
    const footer = [{ sum: this.transactionFiler.getOverallProfit(tokenData) }];
    const filePath = await this.excelFileService.generateFile<
      FileData,
      { sum: string }
    >(
      tokenData,
      `files/${wallet}/${token}`,
      `${wallet}-${token}-${this.getTodayDate()}.xlsx`,
      footer,
    );
    return filePath;
  }

  private getTodayDate(): string {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
}
