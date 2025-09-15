import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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

  @Get()
  @Render('index')
  async getDailyProfitData() {
    const wallets = await this.walletUseCase.getWalletsData();
    return { wallets };
  }

  @Post('add-wallet')
  async addWallet(@Body() walletDto: WalletDto) {
    return await this.walletUseCase.createWallet(walletDto.address);
  }

  // remove wallet?

  @Get('get-file/:walletaddress/:token')
  async getDailyProfitCsv(
    @Param('walletaddress') walletAddress: string,
    @Param('token', UppercasePipe) token: string,
    @Res() res: Response,
  ) {
    const filePath = await this.fileUseCase.generateExcelReport(
      walletAddress,
      token,
    );
    return res.download(filePath);
  }
}
