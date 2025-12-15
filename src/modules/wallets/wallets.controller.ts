import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletIdParam } from './common/decorators/wallet-id.decorator';
import { CreateDepositDto } from './dtos/create-deposit.dto';
import { CreateTransferDto } from './dtos/create-transfer.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(200)
  createWallet() {
    return this.walletsService.createWallet();
  }

  @Get(':walletId')
  getWalletDetails(
    @WalletIdParam()
    walletId: string,
  ) {
    return this.walletsService.getWalletDetails(walletId);
  }

  @Post(':walletId/deposits')
  @HttpCode(200)
  createDeposit(
    @WalletIdParam()
    walletId: string,
    @Body() createDepositDto: CreateDepositDto,
  ) {
    return this.walletsService.createDeposit(walletId, createDepositDto);
  }

  @Post(':walletId/transfers')
  @HttpCode(200)
  createTransfer(
    @WalletIdParam()
    walletId: string,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.walletsService.createTransfer(walletId, createTransferDto);
  }
}
