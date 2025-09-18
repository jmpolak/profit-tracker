import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as crypto from 'crypto';
import { UnhandledHttpExceptionsFilter } from './interface/exception-filters/unhandled-http-exceptions-filter';

const hbs = require('hbs');
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setViewEngine('hbs');
  hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });
  app.useGlobalFilters(app.get(UnhandledHttpExceptionsFilter));
  app.setBaseViewsDir(join(__dirname, 'views'));
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
  // console.log(`Started on http://localhost:${PORT}`);
}
bootstrap();
