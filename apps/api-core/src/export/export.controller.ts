import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private assertAdmin(req: any) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
  }

  private unitScope(req: any, unitIdQuery?: string): string | undefined {
    return req.user.role === 'super_admin' ? unitIdQuery : req.user.unitId;
  }

  private send(res: Response, buffer: Buffer, filename: string) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  private stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  @Get('users')
  async exportUsers(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('companyId') companyId?: string,
  ) {
    this.assertAdmin(req);
    const buffer = await this.exportService.exportUsers({
      unitId: this.unitScope(req, unitId),
      companyId,
    });
    this.send(res, buffer, `beneficiarios-${this.stamp()}.xlsx`);
  }

  @Get('companies')
  async exportCompanies(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
  ) {
    this.assertAdmin(req);
    const buffer = await this.exportService.exportCompanies({
      unitId: this.unitScope(req, unitId),
    });
    this.send(res, buffer, `empresas-${this.stamp()}.xlsx`);
  }

  @Get('transactions')
  async exportTransactions(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('companyId') companyId?: string,
    @Query('providerId') providerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.assertAdmin(req);
    const buffer = await this.exportService.exportTransactions({
      unitId: this.unitScope(req, unitId),
      companyId,
      providerId,
      startDate,
      endDate,
    });
    this.send(res, buffer, `transacoes-${this.stamp()}.xlsx`);
  }

  @Get('providers')
  async exportProviders(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
  ) {
    this.assertAdmin(req);
    const buffer = await this.exportService.exportProviders({
      unitId: this.unitScope(req, unitId),
    });
    this.send(res, buffer, `credenciados-${this.stamp()}.xlsx`);
  }
}
