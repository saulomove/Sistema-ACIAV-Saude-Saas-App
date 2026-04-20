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
import { PrismaService } from '../prisma/prisma.service';

@Controller('export')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  private assertAdmin(req: any) {
    if (!['super_admin', 'admin_unit'].includes(req.user?.role)) {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
  }

  private unitScope(req: any, unitIdQuery?: string): string | undefined {
    return req.user.role === 'super_admin' ? unitIdQuery : req.user.unitId;
  }

  private async assertCompanyInUnit(companyId: string | undefined, scopedUnitId: string | undefined, role: string) {
    if (!companyId) return;
    if (role === 'super_admin' && !scopedUnitId) return;
    const c = await this.prisma.company.findUnique({ where: { id: companyId }, select: { unitId: true } });
    if (!c || c.unitId !== scopedUnitId) {
      throw new ForbiddenException('Empresa fora do tenant.');
    }
  }

  private async assertProviderInUnit(providerId: string | undefined, scopedUnitId: string | undefined, role: string) {
    if (!providerId) return;
    if (role === 'super_admin' && !scopedUnitId) return;
    const p = await this.prisma.provider.findUnique({ where: { id: providerId }, select: { unitId: true } });
    if (!p || p.unitId !== scopedUnitId) {
      throw new ForbiddenException('Credenciado fora do tenant.');
    }
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
    const scope = this.unitScope(req, unitId);
    await this.assertCompanyInUnit(companyId, scope, req.user.role);
    const buffer = await this.exportService.exportUsers({
      unitId: scope,
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
    const scope = this.unitScope(req, unitId);
    await this.assertCompanyInUnit(companyId, scope, req.user.role);
    await this.assertProviderInUnit(providerId, scope, req.user.role);
    const buffer = await this.exportService.exportTransactions({
      unitId: scope,
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
