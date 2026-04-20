import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { userId: string; providerId: string; serviceId: string; amountSaved?: number },
  ) {
    // Credenciado só pode registrar atendimentos na própria unidade
    const providerUnitId = req.user.unitId;
    const result = await this.transactionsService.createWithUnitValidation({
      userId: body.userId,
      providerId: body.providerId,
      serviceId: body.serviceId,
      amountSaved: body.amountSaved || 0,
      providerUnitId,
    });
    return result;
  }

  @Get('by-provider')
  findByProvider(
    @Req() req: any,
    @Query('providerId') providerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let effectiveProviderId = providerId;
    if (req.user.role === 'provider') {
      if (!req.user.providerId) throw new ForbiddenException('Credenciado não identificado.');
      effectiveProviderId = req.user.providerId;
    }
    return this.transactionsService.findByProvider(
      effectiveProviderId,
      Number(page) || 1,
      Number(limit) || 20,
      { startDate, endDate },
    );
  }

  @Get('by-user')
  async findByUser(@Req() req: any, @Query('userId') userId: string) {
    if (req.user.role === 'patient' && req.user.userId !== userId) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.transactionsService.findByUser(userId);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.confirm(id, req.user.userId);
  }

  @Patch(':id/rating')
  rate(@Param('id') id: string, @Req() req: any, @Body() body: { rating: number }) {
    return this.transactionsService.rate(id, req.user.userId, body.rating);
  }

  @Get('by-unit')
  findByUnit(
    @Req() req: any,
    @Query('unitId') unitId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId) throw new ForbiddenException('Tenant não identificado.');
    return this.transactionsService.findByUnit(effectiveUnitId, Number(page) || 1, Number(limit) || 50);
  }
}
