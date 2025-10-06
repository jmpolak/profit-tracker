import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExcelFileService implements IExcelFileServicePort {
  async generateFile<T, H, S>(
    data: T[],
    header?: H,
    footer?: S,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    const keys = Object.keys(data.at(0) ?? {});
    if (keys.length === 0) {
      throw new Error('Data objects have no keys.');
    }

    if (header && Object.keys(header ?? {}).length > 0) {
      Object.entries(header ?? {}).forEach((val, index) => {
        worksheet.addRow([val.join(' : ')]);
      });
      worksheet.addRow([]);
    }

    worksheet.columns = keys.map((key) => ({
      key,
      width: 30,
    }));
    const headerRow = worksheet.addRow(
      keys.map((key) => key.charAt(0).toUpperCase() + key.slice(1)),
    );
    // headerRow.font = { bold: true };
    data.forEach((rowData, index) => {
      Object.keys(rowData ?? {}).forEach((key) => {
        if (rowData[key] instanceof Date)
          rowData[key] = this.formatDateTime(rowData[key]);
        if (Array.isArray(rowData[key])) rowData[key] = rowData[key].join(', ');
      });
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.text.length >= 29 ? (cell.note = cell.text) : undefined;
        cell.alignment = { wrapText: false };
        row.number % 2 === 0
          ? (() =>
              (cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' }, // Light grey
              }))()
          : undefined;
      });
    });

    if (footer && Object.keys(footer ?? {}).length > 0) {
      worksheet.addRow([]);

      Object.entries(footer ?? {}).forEach((val, index) => {
        worksheet.addRow([val.join(' : ')]);
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
