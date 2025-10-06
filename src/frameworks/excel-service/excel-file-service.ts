import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/shared/utils/date';
import { StringUtil } from 'src/shared/utils/convert-string';

@Injectable()
export class ExcelFileService implements IExcelFileServicePort {
  async generateFile<T, H = undefined, S = undefined>(
    data: T[],
    header?: H,
    footer?: S,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    const keys = Object.keys(data.at(0) ?? {});
    const DEFAULT_CELL_WIDTH = 30;
    if (keys.length === 0) {
      throw new Error('Data objects have no keys.');
    }
    let headerMaxLen = 0;
    if (header && Object.keys(header ?? {}).length > 0) {
      Object.entries(header ?? {}).forEach(([key, value], index) => {
        const cellVal = `${StringUtil.addUnderScoreBeforeUpperCaseLetter(key.charAt(0).toUpperCase() + key.slice(1))} : ${value}`;
        worksheet.addRow([cellVal]);
        headerMaxLen =
          cellVal.length > headerMaxLen ? cellVal.length : headerMaxLen;
      });
      worksheet.addRow([]);
    }
    worksheet.columns = keys.map((key, index) => ({
      key,
      width:
        index === 0
          ? headerMaxLen > DEFAULT_CELL_WIDTH
            ? Math.ceil(headerMaxLen / 10) * 10
            : DEFAULT_CELL_WIDTH
          : DEFAULT_CELL_WIDTH,
    }));
    const headerRow = worksheet.addRow(
      keys.map((key) =>
        StringUtil.addUnderScoreBeforeUpperCaseLetter(
          key.charAt(0).toUpperCase() + key.slice(1),
        ),
      ),
    );
    // headerRow.font = { bold: true };
    data.forEach((rowData, index) => {
      Object.keys(rowData ?? {}).forEach((key) => {
        const value = rowData[key];
        if (rowData[key] instanceof Date)
          rowData[key] = DateUtil.formatDateTime(rowData[key]);
        if (Array.isArray(rowData[key]))
          rowData[key] =
            rowData[key].length > 0 ? rowData[key].join(', ') : '-';
      });
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.text.length >= 29 ? (cell.note = cell.text) : undefined;
        cell.alignment = { wrapText: false };
        row.number % 2 === 1
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

      Object.entries(footer ?? {}).forEach(([key, value], index) => {
        const cellText = `${StringUtil.addUnderScoreBeforeUpperCaseLetter(key.charAt(0).toUpperCase() + key.slice(1))} : ${value}`;
        worksheet.addRow([cellText]);
      });
    }

    await workbook.xlsx.writeBuffer();

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
