import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExcelFileService implements IExcelFileServicePort {
  async generateFile<T, S>(
    data: T[],
    filePath: string,
    fileName: string,
    footer?: S[],
  ): Promise<string> {
    if (data.length === 0) {
      throw new Error('No data provided to generate the Excel file.');
    }
    // Implementation for generating Excel file
    const wholePath = path.join(filePath, fileName);
    if (fs.existsSync(wholePath)) {
      console.log(`File ${wholePath} already exists`);
      return wholePath;
    }
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
      Object.keys(rowData ?? {}).forEach((key) =>
        rowData[key] instanceof Date
          ? (rowData[key] = this.formatDateTime(rowData[key]))
          : rowData[key],
      );
      const row = worksheet.addRow(rowData);
      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
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
        worksheet.addRow(rowData);
      });
    }
    // Ensure directory exists
    const outputDir = path.join(process.cwd(), filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(path.join(outputDir, fileName));

    return wholePath;
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
