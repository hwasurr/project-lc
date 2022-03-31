import { DynamicModule, Module } from '@nestjs/common';
import { GoodsModule } from '@project-lc/nest-modules-goods';
import { LiveShoppingController } from './live-shopping.controller';
import { LiveShoppingService } from './live-shopping.service';
import { PurchaseMessageService } from './purchase-message.service';

@Module({})
export class LiveShoppingModule {
  private static imports = [GoodsModule.withoutControllers()];
  private static providers = [LiveShoppingService, PurchaseMessageService];

  private static controllers = [LiveShoppingController];
  private static exports = [LiveShoppingService, PurchaseMessageService];

  static withoutControllers(): DynamicModule {
    return {
      module: LiveShoppingModule,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
    };
  }

  static withControllers(): DynamicModule {
    return {
      module: LiveShoppingModule,
      controllers: this.controllers,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
    };
  }
}
