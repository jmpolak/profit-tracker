import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExcelFileService implements IExcelFileServicePort {
  async generateFile<T, S>(data: T[], footer?: S[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    const keys = Object.keys(data.at(0) ?? {});
    if (keys.length === 0) {
      throw new Error('Data objects have no keys.');
    }
    worksheet.columns = keys.map((key) => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      key,
      width: 30,
    }));

    data.forEach((rowData, index) => {
      rowData['transactions'] = [
        '0x9beb4ba22973a69f108f1d7f298f4c2755b42b65e74b90f46f7e030ecde4998f',
        '0x9beb4ba22973a69f108f1d7f298f4c2755b42b65e74b90f46f7e030ecde4998f',
      ];
      Object.keys(rowData ?? {}).forEach((key) => {
        if (rowData[key] instanceof Date)
          rowData[key] = this.formatDateTime(rowData[key]);
        if (Array.isArray(rowData[key]))
          rowData[key] = rowData[key].join(',\n');
      });
      const row = worksheet.addRow(rowData);
      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
          cell.text.length >= 25 ? (cell.note = cell.text) : undefined;
          cell.alignment = { wrapText: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }, // Light grey
          };
        });
      }
    });

    if (footer && footer.length > 0) {
      worksheet.addRow([]);

      footer.forEach((data) => {
        const rowData = Object.entries(data ?? []);
        worksheet.addRow(rowData.map((v) => v.join(' : ')));
      });
    }

    await workbook.xlsx.writeBuffer();

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private formatDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
