import { Module } from '@nestjs/common';
import { FileUseCase } from './file-use-case';
import { ExcelFileModule } from 'src/frameworks/excel-service/excel-file.module';
import { MongodbModule } from 'src/frameworks/database/mongodb.module';

@Module({
  imports: [ExcelFileModule, MongodbModule],
  controllers: [],
  providers: [FileUseCase],
  exports: [FileUseCase],
})
export class FileModule {}
