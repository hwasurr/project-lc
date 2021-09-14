import { Module } from '@nestjs/common';
import { PrismaModule } from '@project-lc/prisma-orm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
