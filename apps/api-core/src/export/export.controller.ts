import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Controller('export')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private actor(req: any) {
    return {
      authUserId: req.user.sub,
      role: req.user.role,
      name: req.user.email ?? null,
      ip: (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0] ?? req.ip ?? null,
      userAgent: (req.headers?.['user-agent'] as string | undefined) ?? null,
    };
  }

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

  @Get('providers-services')
  async exportProvidersServices(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('status') status?: string,
  ) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    const buffer = await this.exportService.exportProvidersServices({
      unitId: scope,
      category,
      city,
      status,
    });
    this.send(res, buffer, `catalogo-servicos-${this.stamp()}.xlsx`);
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

  @Get('rede-credenciada')
  async exportRedeCredenciada(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    const buffer = await this.exportService.exportRedeCredenciada({
      unitId: scope,
      city,
      category,
      status,
    });
    this.send(res, buffer, `rede-credenciada-${this.stamp()}.xlsx`);
  }

  // ===== Exportação Financeiro (Cobrança) + de-para de cidades + histórico =====

  @Get('financeiro')
  async exportFinanceiro(
    @Req() req: any,
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    if (!scope) throw new ForbiddenException('Selecione uma unidade.');
    await this.assertCompanyInUnit(companyId, scope, req.user.role);
    const { buffer, rowCount, excludedCount } =
      await this.exportService.exportFinanceiro({ unitId: scope, status, companyId });
    const a = this.actor(req);
    await this.prisma.exportLog.create({
      data: {
        unitId: scope,
        type: 'financeiro',
        actorName: a.name,
        actorRole: a.role,
        filters: JSON.stringify({ status: status ?? 'active', companyId: companyId ?? null }),
        rowCount,
        excludedCount,
      },
    });
    this.audit.log({
      unitId: scope,
      actorAuthUserId: a.authUserId,
      actorName: a.name,
      actorRole: a.role,
      entity: 'export',
      action: 'export_financeiro',
      diffAfter: { rowCount, excludedCount, status: status ?? 'active' },
      ip: a.ip,
      userAgent: a.userAgent,
    });
    this.send(res, buffer, `export-financeiro-${this.stamp()}.xlsx`);
  }

  @SkipThrottle()
  @Get('financeiro/cities')
  async getFinanceiroCities(@Req() req: any, @Query('unitId') unitId?: string) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    if (!scope) return { cities: [] };
    return this.exportService.getCityCodes(scope);
  }

  @Put('financeiro/cities')
  async saveFinanceiroCities(
    @Req() req: any,
    @Body() body: { unitId?: string; codes?: Record<string, unknown> },
  ) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, body?.unitId);
    if (!scope) throw new ForbiddenException('Selecione uma unidade.');
    await this.exportService.saveCityCodes(scope, body?.codes ?? {});
    const a = this.actor(req);
    this.audit.log({
      unitId: scope,
      actorAuthUserId: a.authUserId,
      actorName: a.name,
      actorRole: a.role,
      entity: 'export',
      action: 'update_city_codes',
      diffAfter: (body?.codes ?? {}) as Record<string, unknown>,
      ip: a.ip,
      userAgent: a.userAgent,
    });
    return { ok: true };
  }

  @SkipThrottle()
  @Get('financeiro/pending')
  async getFinanceiroPending(@Req() req: any, @Query('unitId') unitId?: string) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    if (!scope) return null;
    return this.exportService.getFinanceiroPending(scope);
  }

  @SkipThrottle()
  @Get('history')
  async exportHistory(@Req() req: any, @Query('unitId') unitId?: string) {
    this.assertAdmin(req);
    const scope = this.unitScope(req, unitId);
    if (!scope) return [];
    return this.prisma.exportLog.findMany({
      where: { unitId: scope },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
