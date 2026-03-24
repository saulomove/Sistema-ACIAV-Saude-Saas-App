import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnitsService } from './units.service';

@Controller('units')
@UseGuards(AuthGuard('jwt'))
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

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
}
