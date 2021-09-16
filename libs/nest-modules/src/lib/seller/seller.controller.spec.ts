import { MailerModule } from '@nestjs-modules/mailer';
import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '@project-lc/prisma-orm';
import request from 'supertest';
import { FindSellerRes } from '@project-lc/shared-types';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SellerSettlementService } from './seller-settlement.service';
import { MailVerificationService } from '../auth/mailVerification.service';
import { mailerConfig } from '../_nest-units/settings/mailer.config';
import { SellerShopService } from './seller-shop.service';

describe('SellerController', () => {
  let app: NestApplication;
  let controller: SellerController;
  let service: SellerService;
  const user: FindSellerRes = {
    id: 1,
    name: 'tester',
    email: 'test@test.com',
    password: 'test',
    shopName: null,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, MailerModule.forRoot(mailerConfig)],
      controllers: [SellerController],
      providers: [
        SellerService,
        MailVerificationService,
        SellerSettlementService,
        SellerShopService,
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    service = module.get<SellerService>(SellerService);

    jest.spyOn(service, 'signUp').mockImplementation(async () => user);
    jest.spyOn(service, 'findOne').mockImplementation(async () => user);

    app = module.createNestApplication();
    app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /seller :: findOne', () => {
    it('should return 200', (done) => {
      request(app.getHttpServer())
        .get('/seller?email=test@test.com')
        .expect(200)
        .expect(user, done);
    });

    it('should return 400', () => {
      request(app.getHttpServer()).get('/seller').expect(400);
    });
  });
});
