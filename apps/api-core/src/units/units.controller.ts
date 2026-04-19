import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { UnitsService } from './units.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { ExportService } from '../export/export.service';

@Controller('units')
@UseGuards(AuthGuard('jwt'))
export class UnitsController {
  constructor(
    private unitsService: UnitsService,
    private prisma: PrismaService,
    private audit: AuditService,
    private email: EmailService,
    private exportService: ExportService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.unitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: { name: string; subdomain: string; settings?: string }) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.unitsService.create(body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.unitsService.update(id, body);
  }

  // Permite que admin_unit salve as configurações da própria unidade
  @Patch(':id/settings')
  saveSettings(@Req() req: any, @Param('id') id: string, @Body() body: { settings: string }) {
    const isOwner = req.user.unitId === id;
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      throw new ForbiddenException('Você não tem permissão para editar esta unidade.');
    }
    return this.unitsService.update(id, { settings: body.settings });
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.unitsService.remove(id);
  }

  @Post(':id/sessions/purge')
  @HttpCode(HttpStatus.OK)
  async purgeSessions(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const isOwner = user?.unitId === id;
    const isSuperAdmin = user?.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) throw new ForbiddenException();

    const currentToken = (req.headers.authorization ?? '').replace('Bearer ', '');
    const result = await this.prisma.session.deleteMany({
      where: {
        authUser: { unitId: id },
        NOT: { token: currentToken },
      },
    });

    this.audit.log({
      unitId: id,
      actorAuthUserId: user.sub,
      actorName: user.email,
      actorRole: user.role,
      entity: 'unit_security',
      entityId: id,
      action: 'force_logout_all',
      diffAfter: { purged: result.count },
    });

    return { purged: result.count };
  }

  @Post(':id/email/test')
  @HttpCode(HttpStatus.OK)
  async testEmail(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const isOwner = user?.unitId === id;
    const isSuperAdmin = user?.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) throw new ForbiddenException();

    const to = (user.email && user.email.includes('@')) ? user.email : null;
    if (!to) throw new BadRequestException('Conta do administrador não possui e-mail válido para receber o teste.');

    const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif;padding:24px;color:#0f172a;">
      <h2 style="color:#007178;">Teste de envio — ACIAV Saúde</h2>
      <p>Se você recebeu este e-mail, a integração do provedor de e-mail desta unidade está funcionando corretamente.</p>
      <p style="font-size:12px;color:#64748b;">Unit ID: ${id}<br/>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
    </body></html>`;

    const result = await this.email.send({
      to,
      subject: 'Teste de integração de e-mail — ACIAV Saúde',
      html,
      text: `Teste de envio — ACIAV Saúde. Unit: ${id}. Enviado em ${new Date().toISOString()}.`,
      unitId: id,
    });

    this.audit.log({
      unitId: id,
      actorAuthUserId: user.sub,
      actorName: user.email,
      actorRole: user.role,
      entity: 'integration_email',
      entityId: id,
      action: 'test',
      diffAfter: { to, ok: result.ok, error: result.error ?? null },
    });

    if (!result.ok) throw new BadRequestException(`Falha ao enviar teste: ${result.error ?? 'unknown'}`);
    return { ok: true };
  }

  @Get(':id/full-export')
  async fullExport(@Req() req: Request & { user?: any }, @Param('id') id: string, @Res() res: Response) {
    const user = req.user;
    const isOwner = user?.unitId === id;
    const isSuperAdmin = user?.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) throw new ForbiddenException();

    const buffer = await this.exportService.exportFullUnit(id);

    this.audit.log({
      unitId: id,
      actorAuthUserId: user.sub,
      actorName: user.email,
      actorRole: user.role,
      entity: 'unit',
      entityId: id,
      action: 'export',
      diffAfter: { scope: 'full' },
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="aciav-full-export-${id}.xlsx"`);
    res.send(buffer);
  }
}
