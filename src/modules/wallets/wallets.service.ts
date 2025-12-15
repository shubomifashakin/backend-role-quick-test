import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { CreateDepositDto } from './dtos/create-deposit.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createWallet() {
    const wallet = await this.databaseService.wallet.create({
      data: {},
      select: {
        id: true,
        balance: true,
        currency: true,
      },
    });

    return wallet;
  }

  async getWalletDetails(walletId: string) {
    const wallet = await this.databaseService.wallet.findUnique({
      where: { id: walletId },
      select: {
        id: true,
        balance: true,
        currency: true,
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet does not exist');
    }

    return wallet;
  }

  async createDeposit(walletId: string, depositDto: CreateDepositDto) {
    const deposit = await this.databaseService.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
        });

        if (!wallet) {
          throw new NotFoundException('Wallet does not exist');
        }

        const transactionExists = await tx.transactions.findUnique({
          where: { idempotencyKey: depositDto.idempotencyKey },
        });

        if (transactionExists) {
          return { message: 'success' };
        }

        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance: {
              increment: depositDto.amount,
            },
          },
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        });

        await tx.transactions.create({
          data: {
            type: 'DEPOSIT',
            walletId: walletId,
            amount: depositDto.amount,
            idempotencyKey: depositDto.idempotencyKey,
          },
        });

        return { message: 'success' };
      },
      { isolationLevel: 'RepeatableRead' },
    );

    return deposit;
  }

  async createTransfer(
    sendingWalletId: string,
    transferDto: CreateTransferDto,
  ) {
    const res = await this.databaseService.$transaction(
      async (tx) => {
        if (sendingWalletId === transferDto.receivingWalletId) {
          throw new BadRequestException('Cannot transfer money to self');
        }

        const transferExists = await tx.transfers.findUnique({
          where: {
            idempotencyKey: transferDto.idempotencyKey,
          },
        });

        if (transferExists) {
          return { message: 'success' };
        }

        const sendingWalletReq = tx.wallet.findUnique({
          where: { id: sendingWalletId },
          select: { id: true, balance: true, currency: true },
        });

        const receivingWalletReq = tx.wallet.findUnique({
          where: { id: transferDto.receivingWalletId },
        });

        const [sendingWallet, receivingWallet] = await Promise.all([
          sendingWalletReq,
          receivingWalletReq,
        ]);

        if (!sendingWallet) {
          throw new NotFoundException('Sending Wallet does not exist');
        }

        if (sendingWallet.balance.toNumber() < transferDto.amount) {
          throw new BadRequestException('Insufficient balance');
        }

        if (!receivingWallet) {
          throw new NotFoundException('Receiving wallet does not exist');
        }

        await tx.wallet.update({
          where: { id: sendingWalletId },
          data: {
            balance: {
              decrement: transferDto.amount,
            },
          },
        });

        await tx.wallet.update({
          where: { id: transferDto.receivingWalletId },
          data: {
            balance: {
              increment: transferDto.amount,
            },
          },
        });

        await tx.transfers.create({
          data: {
            amount: transferDto.amount,
            idempotencyKey: transferDto.idempotencyKey,
            sendingWalletId: sendingWalletId,
            receivingWalletId: transferDto.receivingWalletId,
          },
        });

        await tx.transactions.create({
          data: {
            type: 'TRANSF_IN',
            amount: transferDto.amount,
            walletId: transferDto.receivingWalletId,
          },
        });

        await tx.transactions.create({
          data: {
            type: 'TRANS_OUT',
            amount: transferDto.amount,
            walletId: sendingWalletId,
          },
        });

        return { message: 'success' };
      },
      { isolationLevel: 'RepeatableRead' },
    );

    return res;
  }
}
