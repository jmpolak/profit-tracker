import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import { FileUseCase } from 'src/application/use-cases/file/file-use-case';
import { Response } from 'express';
import { WalletUseCase } from 'src/application/use-cases/wallet/wallet-use-case';
import { WalletDto } from 'src/core/dto/wallet.dto';
import { UppercasePipe } from '../pipes/uppercase-pipe';

@Controller()
export class BasicController {
  constructor(
    private walletUseCase: WalletUseCase,
    private fileUseCase: FileUseCase,
  ) {}

  @Get('test')
  async test() {
    return await this.walletUseCase.test();
  }

  @Get()
  @Render('index')
  async getDailyProfitData() {
    const wallets = await this.walletUseCase.getWalletsDataWithFilters();
    return { wallets };
  }

  @Post('add-wallet')
  async addWallet(@Body() walletDto: WalletDto) {
    return await this.walletUseCase.createWallet(walletDto.address);
  }

  @Delete('remove-wallet/:walletaddress')
  async removeFile(@Param('walletaddress') walletAddress: string) {
    return await this.walletUseCase.removeWallet(walletAddress);
  }

  @Get('get-file/:walletaddress/:site/:marketName/:poolAddress/:token')
  async getDailyProfitCsv(
    @Param('walletaddress') walletAddress: string,
    @Param('poolAddress') poolAddress: string,
    @Param('marketName') marketName: string,
    @Param('token', UppercasePipe) token: string,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const { bufferFile, fileName } = await this.fileUseCase.generateExcelReport(
      walletAddress,
      marketName,
      poolAddress,
      token,
      { year, month },
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': bufferFile.length,
    });
    return res.send(bufferFile);
  }
}
