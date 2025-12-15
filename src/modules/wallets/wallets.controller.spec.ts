import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

import { v4 as uuid } from 'uuid';
import { DatabaseModule } from '../../core/database/database.module';

describe('WalletsController', () => {
  let controller: WalletsController;
  let sendingWalletId: string;
  let receivingWalletId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [WalletsService],
      imports: [DatabaseModule],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Successful requests', () => {
    test('it should create the wallet', async () => {
      const req = await controller.createWallet();
      const receiverWallet = await controller.createWallet();

      expect(req.id).toBeDefined();
      expect(receiverWallet.id).toBeDefined();
      sendingWalletId = req.id;
      receivingWalletId = receiverWallet.id;
    });

    test('it should create the deposit', async () => {
      const req = await controller.createDeposit(sendingWalletId, {
        amount: 1000,
        idempotencyKey: uuid(),
      });

      expect(req.message).toBe('success');
    });

    test('it should credit the receiver', async () => {
      const req = await controller.createTransfer(sendingWalletId, {
        amount: 200,
        idempotencyKey: uuid(),
        receivingWalletId,
      });

      expect(req.message).toBe('success');
    });
  });
});
