import { MailerModule } from '@nestjs-modules/mailer';
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirstmallDbModule } from '@project-lc/firstmall-db';
import { CacheConfig, CsrfTokenMiddleware, mailerConfig } from '@project-lc/nest-core';
import { AdminModule } from '@project-lc/nest-modules-admin';
import { AuthModule, SocialModule } from '@project-lc/nest-modules-auth';
import { BroadcasterModule } from '@project-lc/nest-modules-broadcaster';
import { CipherModule } from '@project-lc/nest-modules-cipher';
import { GoodsModule } from '@project-lc/nest-modules-goods';
import { InquiryModule } from '@project-lc/nest-modules-inquiry';
import { JwtHelperModule } from '@project-lc/nest-modules-jwt-helper';
import { LiveShoppingModule } from '@project-lc/nest-modules-liveshopping';
import { NoticeModule } from '@project-lc/nest-modules-notice';
import { NotificationModule } from '@project-lc/nest-modules-notification';
import { OrderCancelModule } from '@project-lc/nest-modules-order-cancel';
import { PolicyModule } from '@project-lc/nest-modules-policy';
import { SellerModule } from '@project-lc/nest-modules-seller';
import { ShippingGroupModule } from '@project-lc/nest-modules-shipping-group';
import { PrismaModule } from '@project-lc/prisma-orm';
import { validationSchema } from '../settings/config.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    CacheModule.registerAsync({ isGlobal: true, useClass: CacheConfig }),
    MailerModule.forRoot(mailerConfig),
    FirstmallDbModule,
    PrismaModule,
    AuthModule,
    SocialModule,
    AdminModule,
    ShippingGroupModule,
    NoticeModule,
    OrderCancelModule,
    NotificationModule,
    InquiryModule,
    CipherModule,
    JwtHelperModule,
    SellerModule.withControllers(),
    GoodsModule.withControllers(),
    LiveShoppingModule.withControllers(),
    BroadcasterModule.withControllers(),
    PolicyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CsrfTokenMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
