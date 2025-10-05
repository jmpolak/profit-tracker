import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as crypto from 'crypto';
import { UnhandledHttpExceptionsFilter } from './interface/exception-filters/unhandled-http-exceptions-filter';

declare global {
  interface String {
    equalsIgnore(str: string): boolean;
  }
}

String.prototype.equalsIgnore = function (str: string): boolean {
  return this.toLowerCase() === str.toLowerCase();
};

const hbs = require('hbs');
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setViewEngine('hbs');

  hbs.registerHelper('formatDate', function (date) {
    if (!date) return '';

    const d = new Date(date);
    // if (isNaN(d)) return '';

    const pad = (n) => n.toString().padStart(2, '0');

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1); // months are 0-indexed
    const year = d.getFullYear();

    const hours = d.getHours();
    const minutes = d.getMinutes();

    return `${day}-${month}-${year} ${hours}:${pad(minutes)}`;
  });
  hbs.registerHelper('toFixed', function (number) {
    const parsed = parseFloat(number);
    if (isNaN(parsed)) return number;
    return parsed.toFixed(4);
  });
  hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });
  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper(
    'and',
    (a, b, c, d) => a && b && (c ?? true) && (d ?? true),
  );
  app.useGlobalFilters(app.get(UnhandledHttpExceptionsFilter));
  app.setBaseViewsDir(join(__dirname, 'views'));
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
  // console.log(`Started on http://localhost:${PORT}`);
}
bootstrap();
