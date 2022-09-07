import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { KkshowBcList, KkshowShoppingTabCategory } from '@prisma/client';
import { CacheClearKeys, HttpCacheInterceptor } from '@project-lc/nest-core';
import { AdminGuard, JwtAuthGuard } from '@project-lc/nest-modules-authguard';
import {
  KkshowBcListService,
  KkshowMainService,
  KkshowShoppingCategoryService,
  KkshowShoppingService,
} from '@project-lc/nest-modules-kkshow-main';
import {
  CreateKkshowBcListDto,
  DeleteKkshowBcListDto,
  KkshowMainDto,
  KkshowMainResData,
  KkshowShoppingDto,
  KkshowShoppingTabCategoryDto,
  KkshowShoppingTabResData,
} from '@project-lc/shared-types';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminKkshowMainController {
  constructor(
    private readonly kkshowMainService: KkshowMainService,
    private readonly kkshowShoppingService: KkshowShoppingService,
    private readonly kkshowShoppingCategoryService: KkshowShoppingCategoryService,
    private readonly kkshowBcListService: KkshowBcListService,
  ) {}

  /** ================================= */
  // 크크쇼메인페이지 관리
  /** ================================= */
  @Get('kkshow-main')
  async getMainPageData(): Promise<KkshowMainResData | null> {
    return this.kkshowMainService.read();
  }

  @Post('kkshow-main')
  async upsertMainPageData(@Body() data: KkshowMainDto): Promise<KkshowMainResData> {
    return this.kkshowMainService.upsert(data);
  }

  /** ================================= */
  // 크크쇼 쇼핑페이지 관리
  /** ================================= */
  @Get('kkshow-shopping')
  async getShoppingPageData(): Promise<KkshowShoppingTabResData | null> {
    return this.kkshowShoppingService.read();
  }

  @Put('kkshow-shopping')
  async upsertShoppingPageData(
    @Body() data: KkshowShoppingDto,
  ): Promise<KkshowShoppingTabResData> {
    return this.kkshowShoppingService.upsert(data);
  }

  // 쇼핑페이지 카테고리 목록 요소 추가
  @UseInterceptors(HttpCacheInterceptor)
  @CacheClearKeys('goods-category', 'goods')
  @Post('kkshow-shopping/category')
  async addCategory(
    @Body(new ValidationPipe({ transform: true })) dto: KkshowShoppingTabCategoryDto,
  ): Promise<KkshowShoppingTabCategory> {
    return this.kkshowShoppingCategoryService.add(dto.categoryCode);
  }

  // 쇼핑페이지 카테고리 목록 요소 제거
  @UseInterceptors(HttpCacheInterceptor)
  @CacheClearKeys('goods-category', 'goods')
  @Delete('kkshow-shopping/category/:categoryCode')
  async removeCategory(
    @Param(new ValidationPipe({ transform: true })) dto: KkshowShoppingTabCategoryDto,
  ): Promise<boolean> {
    return this.kkshowShoppingCategoryService.remove(dto.categoryCode);
  }

  /** ===================== */
  /** 크크쇼 방송인 목록 관리 */
  /** ===================== */
  @UseInterceptors(HttpCacheInterceptor)
  @Get('kkshow-bc-list')
  public async getKkshowBcList(): Promise<KkshowBcList[]> {
    return this.kkshowBcListService.findAll();
  }

  @UseInterceptors(HttpCacheInterceptor)
  @CacheClearKeys('kkshow-bc-list')
  @Post('kkshow-bc-list')
  public async createKkshowBcList(
    @Body(new ValidationPipe({ transform: true })) dto: CreateKkshowBcListDto,
  ): Promise<KkshowBcList> {
    return this.kkshowBcListService.create(dto);
  }

  @UseInterceptors(HttpCacheInterceptor)
  @CacheClearKeys('kkshow-bc-list')
  @Delete('kkshow-bc-list/:id')
  public async deleteKkshowBcList(
    @Param(new ValidationPipe({ transform: true })) dto: DeleteKkshowBcListDto,
  ): Promise<KkshowBcList> {
    return this.kkshowBcListService.delete(dto.id);
  }
}
