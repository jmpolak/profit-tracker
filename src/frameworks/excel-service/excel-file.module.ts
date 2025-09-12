import { Module } from '@nestjs/common';
import { IExcelFileServicePort } from 'src/core/abstract/excel-file-service/excel-file-service-port';
import { ExcelFileService } from './excel-file-service';

@Module({
  controllers: [],
  providers: [
    {
      provide: IExcelFileServicePort,
      useClass: ExcelFileService,
    },
  ],
  exports: [IExcelFileServicePort],
})
export class ExcelFileModule {}
