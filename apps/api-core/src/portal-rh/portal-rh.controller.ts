import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PortalRhService } from './portal-rh.service';

@Controller('portal-rh')
@UseGuards(AuthGuard('jwt'))
export class PortalRhController {
  constructor(private readonly service: PortalRhService) {}

  private ensureRh(req: any) {
    if (req.user?.role !== 'rh') throw new ForbiddenException('Acesso restrito ao RH.');
  }

  private ctx(req: any) {
    return {
      companyId: req.user?.companyId as string | undefined,
      unitId: req.user?.unitId as string,
    };
  }

  @Get('summary')
  summary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.ensureRh(req);
    const { companyId } = this.ctx(req);
    return this.service.getSummary(companyId, { startDate, endDate });
  }

  @Get('dependentes')
  listDependents(@Req() req: any) {
    this.ensureRh(req);
    const { companyId } = this.ctx(req);
    return this.service.listDependents(companyId);
  }

  @Get('titulares')
  listTitulares(@Req() req: any) {
    this.ensureRh(req);
    const { companyId } = this.ctx(req);
    return this.service.listTitulares(companyId);
  }

  @Post('dependentes')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  createDependent(
    @Req() req: any,
    @Body() body: {
      parentId: string;
      fullName: string;
      cpf: string;
      birthDate?: string;
      kinship?: string;
      gender?: string;
      phone?: string;
    },
  ) {
    this.ensureRh(req);
    const { companyId, unitId } = this.ctx(req);
    return this.service.createDependent(companyId, unitId, body);
  }

  @Put('dependentes/:id')
  updateDependent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      fullName?: string;
      kinship?: string;
      gender?: string;
      phone?: string;
      birthDate?: string;
    },
  ) {
    this.ensureRh(req);
    const { companyId, unitId } = this.ctx(req);
    return this.service.updateDependent(companyId, unitId, id, body);
  }

  @Patch('dependentes/:id/inativar')
  inactivateDependent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    this.ensureRh(req);
    const { companyId, unitId } = this.ctx(req);
    return this.service.inactivateMember(companyId, unitId, id, body?.reason ?? '');
  }

  @Patch('colaboradores/:id/inativar')
  inactivateColaborador(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    this.ensureRh(req);
    const { companyId, unitId } = this.ctx(req);
    return this.service.inactivateMember(companyId, unitId, id, body?.reason ?? '');
  }

  @Get('credenciados')
  listProviders(
    @Req() req: any,
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    this.ensureRh(req);
    const { unitId } = this.ctx(req);
    return this.service.listProviders(unitId, { city, category });
  }

  @Get('credenciados/cidades')
  listProviderCities(@Req() req: any) {
    this.ensureRh(req);
    const { unitId } = this.ctx(req);
    return this.service.listProviderCities(unitId);
  }

  @Get('colaboradores')
  listColaboradores(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.ensureRh(req);
    const { companyId } = this.ctx(req);
    return this.service.listCompanyColaboradores(companyId, { startDate, endDate });
  }
}
