import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Decimal } from '@prisma/client/runtime/library';
import { Currency } from '@prisma/client';

import { v4 as uuid } from 'uuid';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        stopAtFirstError: true,
      }),
    );
    await app.init();
  });

  describe('Wallets Controller', () => {
    let walletId: string;
    let receivingWalletId: string;

    it('/wallets (POST): it should create the sending and receiving wallets', async () => {
      const req = await request(app.getHttpServer()).post('/wallets');
      const receivingWallet = await request(app.getHttpServer()).post(
        '/wallets',
      );

      const body = req.body as unknown as {
        id: string;
        balance: Decimal;
        currency: Currency;
      };
      const receivingBody = receivingWallet.body as unknown as {
        id: string;
        balance: Decimal;
        currency: Currency;
      };

      expect(req.status).toBe(200);
      expect(receivingWallet.status).toBe(200);

      walletId = body.id;
      receivingWalletId = receivingBody.id;
      expect(body.balance).toStrictEqual('0');
      expect(body.id).toBeDefined();
    });

    it('/wallets/:walletId (GET): it should return a 400 because the walletId is invalid', async () => {
      const req = await request(app.getHttpServer()).get('/wallets/123s');

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId (GET): it should return a 404 because the walletId does not exist', async () => {
      const req = await request(app.getHttpServer()).get(`/wallets/${uuid()}`);

      expect(req.status).toBe(404);
    });

    it('/wallets/:walletId (GET): success', async () => {
      const req = await request(app.getHttpServer()).get(
        `/wallets/${walletId}`,
      );

      expect(req.status).toBe(200);
    });

    it('/wallets/:walletId/deposits (POST): it should fail to deposit because the idempotencyKey is invalid', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/deposits`)
        .send({ amount: '22', idempotencyKey: '122' });

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId/deposits (POST): it should fail to deposit because the amount is invalid', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/deposits`)
        .send({ idempotencyKey: uuid(), amount: '-22' });

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId/deposits (POST): it should fail to deposit because the amount is O', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/deposits`)
        .send({ idempotencyKey: uuid(), amount: 0 });

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId/deposits (POST): it should successfully deposit money into the sending account', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/deposits`)
        .send({ idempotencyKey: uuid(), amount: '200' });

      expect(req.status).toBe(200);
    });

    it('/wallets/:walletId/transfers (POST): it should transfer to the receiver', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/transfers`)
        .send({ idempotencyKey: uuid(), amount: '22', receivingWalletId });

      expect(req.status).toBe(200);
    });

    it('/wallets/:walletId/transfers (POST): it should not transfer since sending and receiving id are the same', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/transfers`)
        .send({
          amount: '22',
          idempotencyKey: uuid(),
          receivingWalletId: walletId,
        });

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId/transfers (POST): it should not transfer since sending wallet does not have enough money', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${walletId}/transfers`)
        .send({
          amount: '25000',
          idempotencyKey: uuid(),
          receivingWalletId: walletId,
        });

      expect(req.status).toBe(400);
    });

    it('/wallets/:walletId/transfers (POST): it should not transfer since sending wallet does not exist', async () => {
      const req = await request(app.getHttpServer())
        .post(`/wallets/${uuid()}/transfers`)
        .send({
          amount: '25000',
          idempotencyKey: uuid(),
          receivingWalletId: walletId,
        });

      expect(req.status).toBe(404);
    });
  });
});
