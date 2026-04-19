import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  private resolveUnitId(req: any): string {
    const unitId = req.user.unitId;
    if (!unitId) throw new ForbiddenException('unitId ausente no token.');
    return unitId;
  }

  @Get()
  findAll(@Req() req: any) {
    const unitId = this.resolveUnitId(req);
    return this.categoriesService.findAll(unitId);
  }

  @Post()
  create(@Req() req: any, @Body() body: { name: string; color?: string; order?: number }) {
    if (!['super_admin', 'admin_unit'].includes(req.user.role)) {
      throw new ForbiddenException('Apenas administradores podem gerenciar categorias.');
    }
    const unitId = this.resolveUnitId(req);
    return this.categoriesService.create(unitId, {
      name: body.name,
      color: body.color,
      order: body.order,
    });
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string; order?: number; status?: boolean },
  ) {
    if (!['super_admin', 'admin_unit'].includes(req.user.role)) {
      throw new ForbiddenException('Apenas administradores podem gerenciar categorias.');
    }
    const unitId = this.resolveUnitId(req);
    return this.categoriesService.update(unitId, id, {
      name: body.name,
      color: body.color,
      order: body.order,
      status: body.status,
    });
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (!['super_admin', 'admin_unit'].includes(req.user.role)) {
      throw new ForbiddenException('Apenas administradores podem gerenciar categorias.');
    }
    const unitId = this.resolveUnitId(req);
    return this.categoriesService.remove(unitId, id);
  }
}
