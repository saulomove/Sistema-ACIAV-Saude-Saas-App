import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PortalPacienteService } from './portal-paciente.service';

@Controller('portal-paciente')
@UseGuards(AuthGuard('jwt'))
export class PortalPacienteController {
  constructor(private readonly service: PortalPacienteService) {}

  private ensurePatient(req: any) {
    if (req.user?.role !== 'patient') throw new ForbiddenException('Acesso restrito a beneficiários.');
  }

  private buildActor(req: any) {
    return {
      authUserId: req.user.sub,
      userId: req.user.userId ?? null,
      name: req.user.name ?? null,
      unitId: req.user.unitId ?? null,
      ip: (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0] ?? req.ip ?? null,
      userAgent: (req.headers?.['user-agent'] as string | undefined) ?? null,
    };
  }

  @Get('summary')
  summary(@Req() req: any) {
    this.ensurePatient(req);
    return this.service.getSummary(req.user.userId);
  }

  @Get('first-access')
  firstAccessState(@Req() req: any) {
    this.ensurePatient(req);
    return this.service.getFirstAccessState(req.user.sub, req.user.userId ?? null);
  }

  @Post('first-access')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  firstAccess(
    @Req() req: any,
    @Body() body: { fullName?: string; email: string; whatsapp: string; birthDate?: string; newPassword: string },
  ) {
    this.ensurePatient(req);
    const payload = {
      fullName: body.fullName,
      email: body.email,
      whatsapp: body.whatsapp,
      birthDate: body.birthDate,
      newPassword: body.newPassword,
    };
    return this.service.firstAccess(req.user.sub, req.user.userId ?? null, payload);
  }

  @Get('me')
  me(@Req() req: any) {
    this.ensurePatient(req);
    return this.service.getMe(req.user.userId ?? null);
  }

  @Patch('me')
  updateMe(
    @Req() req: any,
    @Body() body: { fullName?: string; whatsapp?: string; email?: string; birthDate?: string; phone?: string; gender?: string },
  ) {
    this.ensurePatient(req);
    return this.service.updateMe(this.buildActor(req), {
      fullName: body.fullName,
      whatsapp: body.whatsapp,
      email: body.email,
      birthDate: body.birthDate,
      phone: body.phone,
      gender: body.gender,
    });
  }

  @Patch('me/notifications')
  updateNotifications(
    @Req() req: any,
    @Body() body: { email?: boolean; whatsapp?: boolean; newProviders?: boolean },
  ) {
    this.ensurePatient(req);
    return this.service.updateNotifications(this.buildActor(req), {
      email: body.email,
      whatsapp: body.whatsapp,
      newProviders: body.newProviders,
    });
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    this.ensurePatient(req);
    return this.service.changePassword(this.buildActor(req), {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }

  @Get('me/export')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async exportMe(@Req() req: any, @Res() res: Response) {
    this.ensurePatient(req);
    const buffer = await this.service.exportMyData(req.user.userId ?? null);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="meus-dados-${stamp}.xlsx"`);
    res.send(buffer);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 2 } })
  requestDeletion(
    @Req() req: any,
    @Query('reason') reasonQuery?: string,
    @Body() body?: { reason?: string },
  ) {
    this.ensurePatient(req);
    const reason = (body?.reason ?? reasonQuery ?? '').toString();
    return this.service.requestDeletion(this.buildActor(req), reason);
  }
}
