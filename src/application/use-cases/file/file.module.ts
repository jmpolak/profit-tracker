import { Module } from '@nestjs/common';
import { FileUseCase } from './file-use-case';
import { ExcelFileModule } from 'src/frameworks/excel-service/excel-file.module';
import { DatabaseServiceModule } from 'src/frameworks/database-repository/database-repository.module';

@Module({
  imports: [ExcelFileModule, DatabaseServiceModule],
  controllers: [],
  providers: [FileUseCase],
  exports: [FileUseCase],
})
export class FileModule {}
