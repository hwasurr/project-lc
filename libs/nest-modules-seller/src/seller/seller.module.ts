import { Module } from '@nestjs/common';
import { MailModule } from '@project-lc/nest-modules-mail';
import { S3Module } from '@project-lc/nest-modules-s3';
import { LiveShoppingModule } from '@project-lc/nest-modules-liveshopping';
import { SellerContactsController } from './seller-contacts.controller';
import { SellerContactsService } from './seller-contacts.service';
import { SellerSettlementService } from './seller-settlement.service';
import { SellerProductPromotionService } from './seller-product-promotion.service';
import { SellerShopService } from './seller-shop.service';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';

@Module({
  imports: [S3Module, MailModule, LiveShoppingModule.withoutControllers()],
  controllers: [SellerController, SellerContactsController],
  providers: [
    SellerService,
    SellerSettlementService,
    SellerShopService,
    SellerProductPromotionService,
    SellerContactsService,
  ],
  exports: [SellerService, SellerSettlementService],
})
export class SellerModule {}
