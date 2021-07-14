import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('users')
  async getUsers() {
    const result = await this.appService.getUserData({ id: 1 });
    return result;
  }

  @Post('users')
  async createUser(@Body() body: Prisma.UserCreateInput) {
    return this.appService.createUser(body);
  }

  @Delete('users')
  signOut(@Query('id') id: number, @Query('email') email: string) {
    return this.appService.deleteUser({ id, email });
  }
}
