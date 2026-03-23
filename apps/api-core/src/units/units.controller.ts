import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== 'super_admin') {
      throw new ForbiddenException('Acesso restrito ao Super Admin.');
    }
    return this.unitsService.remove(id);
  }
}
