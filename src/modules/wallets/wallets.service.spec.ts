import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { DatabaseService } from '../../core/database/database.service';
import { Decimal } from '@prisma/client/runtime/library';

import { v4 as uuid } from 'uuid';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let sendingWallet: string;
  let receivingWallet: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService, DatabaseService],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Successful transaction flow', () => {
    it('it should create the wallet', async () => {
      const res = await service.createWallet();
      const receiver = await service.createWallet();

      expect(receiver.id).toBeDefined();
      expect(receiver.balance).toStrictEqual(Decimal(0));

      expect(res.id).toBeDefined();
      expect(res.balance).toStrictEqual(Decimal(0));

      sendingWallet = res.id;
      receivingWallet = receiver.id;
    });

    it('it should create a deposit in the wallet', async () => {
      const res = await service.createDeposit(sendingWallet, {
        amount: 500,
        idempotencyKey: uuid(),
      });

      expect(res.message).toBeDefined();
      expect(res.message).toBe('success');
    });

    it('it should successfully transfer money to receiver', async () => {
      const res = await service.createTransfer(sendingWallet, {
        amount: 200,
        idempotencyKey: uuid(),
        receivingWalletId: receivingWallet,
      });

      expect(res.message).toBe('success');
    });

    it('it should contain the accurate wallet balance', async () => {
      const senderDetails = await service.getWalletDetails(sendingWallet);
      const receiverDetails = await service.getWalletDetails(receivingWallet);

      expect(senderDetails.balance).toStrictEqual(Decimal(300));
      expect(senderDetails.transactions).toHaveLength(2);

      expect(receiverDetails.balance).toStrictEqual(Decimal(200));
      expect(receiverDetails.transactions).toHaveLength(1);
    });
  });

  describe('Error cases', () => {
    it('should throw a not found exception since the wallet does not exist', async () => {
      await expect(service.getWalletDetails(uuid())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw a not found exception since the wallet to deposit to does not exist', async () => {
      await expect(
        service.createDeposit(uuid(), {
          amount: 800,
          idempotencyKey: uuid(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle not transfer the money to self', async () => {
      await expect(
        service.createTransfer(sendingWallet, {
          amount: 800,
          idempotencyKey: uuid(),
          receivingWalletId: sendingWallet,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle insufficient balance during transfer', async () => {
      await expect(
        service.createTransfer(sendingWallet, {
          amount: 800,
          idempotencyKey: uuid(),
          receivingWalletId: receivingWallet,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle not transfer the money since receiving wallet does not exist', async () => {
      await expect(
        service.createTransfer(sendingWallet, {
          amount: 100,
          idempotencyKey: uuid(),
          receivingWalletId: uuid(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
