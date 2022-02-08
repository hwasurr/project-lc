import { DynamicModule, Module } from '@nestjs/common';
import { S3Module } from '@project-lc/nest-modules-s3';
import { GoodsCommonInfoController } from './goods-common-info.controller';
import { GoodsCommonInfoService } from './goods-common-info.service';
import { GoodsController } from './goods.controller';
import { GoodsService } from './goods.service';

@Module({})
export class GoodsModule {
  private static readonly imports = [S3Module];
  private static readonly providers = [GoodsService, GoodsCommonInfoService];
  private static readonly exports = [GoodsService, GoodsCommonInfoService];
  private static readonly controllers = [GoodsController, GoodsCommonInfoController];

  static withoutControllers(): DynamicModule {
    return {
      module: GoodsModule,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
    };
  }

  static withControllers(): DynamicModule {
    return {
      module: GoodsModule,
      controllers: this.controllers,
      imports: this.imports,
      providers: this.providers,
      exports: this.exports,
    };
  }
}
