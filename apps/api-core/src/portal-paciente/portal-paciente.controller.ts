import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PortalPacienteService } from './portal-paciente.service';

@Controller('portal-paciente')
@UseGuards(AuthGuard('jwt'))
export class PortalPacienteController {
  constructor(private readonly service: PortalPacienteService) {}

  private ensurePatient(req: any) {
    if (req.user?.role !== 'patient') throw new ForbiddenException('Acesso restrito a beneficiários.');
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
}
