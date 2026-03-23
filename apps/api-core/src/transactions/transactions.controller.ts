import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  create(@Body() body: { userId: string; providerId: string; serviceId: string; amountSaved?: number }) {
    return this.transactionsService.create({
      userId: body.userId,
      providerId: body.providerId,
      serviceId: body.serviceId,
      amountSaved: body.amountSaved || 0,
    });
  }

  @Get('by-provider')
  findByProvider(
    @Query('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findByProvider(providerId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('by-user')
  findByUser(@Query('userId') userId: string) {
    return this.transactionsService.findByUser(userId);
  }

  @Get('by-unit')
  findByUnit(
    @Query('unitId') unitId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findByUnit(unitId, Number(page) || 1, Number(limit) || 50);
  }
}
