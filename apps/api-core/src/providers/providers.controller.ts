import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query,
  UseGuards, Req, ForbiddenException, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { ProvidersService } from './providers.service';

const uploadStorage = diskStorage({
  destination: path.join(process.cwd(), 'uploads', 'providers'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

@Controller('providers')
@UseGuards(AuthGuard('jwt'))
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  private async assertTenant(req: any, providerId: string) {
    if (req.user.role === 'super_admin') return;
    const provider = await this.providersService.findOne(providerId);
    if (provider && provider.unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

  private async assertServiceTenant(req: any, serviceId: string) {
    if (req.user.role === 'super_admin') return;
    const unitId = await this.providersService.getServiceUnit(serviceId);
    if (!unitId || unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

  private async assertRewardTenant(req: any, rewardId: string) {
    if (req.user.role === 'super_admin') return;
    const unitId = await this.providersService.getRewardUnit(rewardId);
    if (!unitId || unitId !== req.user.unitId) {
      throw new ForbiddenException('Acesso negado.');
    }
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('unitId') unitId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.findAll(effectiveUnitId, category, search, Number(page) || 1, Number(limit) || 50, { city, sortBy });
  }

  @Get('cities')
  listCities(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.listCities(effectiveUnitId ?? '');
  }

  @Get('categories')
  listCategories(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.listCategories(effectiveUnitId ?? '');
  }

  // ─── Self-service do credenciado (role=provider) ───────────────────────────

  private assertProviderSelf(req: any): string {
    if (req.user.role !== 'provider' || !req.user.providerId) {
      throw new ForbiddenException('Apenas credenciados podem acessar esta rota.');
    }
    return req.user.providerId as string;
  }

  @Get('me')
  async findMe(@Req() req: any) {
    const providerId = this.assertProviderSelf(req);
    return this.providersService.findOne(providerId);
  }

  @Put('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    const providerId = this.assertProviderSelf(req);
    const allowed = [
      'professionalName', 'clinicName', 'registration',
      'specialty', 'address', 'city', 'phone', 'whatsapp',
      'email', 'bio', 'businessHours',
    ];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.providersService.update(providerId, data);
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: uploadStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new BadRequestException('Formato inválido. Use JPG, PNG ou WebP.'), false);
    },
  }))
  async uploadMyPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const providerId = this.assertProviderSelf(req);
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const photoUrl = `/uploads/providers/${file.filename}`;
    await this.providersService.update(providerId, { photoUrl });
    return { photoUrl };
  }

  @Post(':id/click')
  async trackClick(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { channel?: string },
  ) {
    const channel = (body?.channel ?? '').toString().slice(0, 20);
    const allowed = new Set(['whatsapp', 'phone', 'maps', 'email', 'details']);
    if (!allowed.has(channel)) throw new BadRequestException('channel inválido');
    await this.providersService.trackClick(id, {
      userId: req.user.userId ?? null,
      channel,
      ip: req.ip ?? null,
      userAgent: (req.headers?.['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  @Get('ranking')
  ranking(@Req() req: any, @Query('unitId') unitId: string, @Query('limit') limit?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : (req.user.unitId ?? unitId);
    return this.providersService.ranking(effectiveUnitId, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const data = {
      unitId: req.user.unitId ?? body.unitId,
      name: body.name,
      professionalName: body.professionalName,
      clinicName: body.clinicName,
      registration: body.registration,
      cpfCnpj: body.cpfCnpj,
      category: body.category,
      specialty: body.specialty,
      address: body.address,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      bio: body.bio,
    };
    return this.providersService.create(data);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
    const allowed = ['professionalName', 'clinicName', 'registration', 'cpfCnpj', 'category', 'specialty', 'address', 'city', 'phone', 'whatsapp', 'email', 'bio', 'businessHours', 'photoUrl', 'status'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.providersService.update(id, data);
  }

  @Patch(':id/status')
  async toggleStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: boolean }) {
    await this.assertTenant(req, id);
    return this.providersService.update(id, { status: body.status });
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.remove(id);
  }

  // ─── Upload foto/logo ──────────────────────────────────────────────────────

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: uploadStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (_req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new BadRequestException('Formato inválido. Use JPG, PNG ou WebP.'), false);
    },
  }))
  async uploadPhoto(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    await this.assertTenant(req, id);
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const photoUrl = `/uploads/providers/${file.filename}`;
    await this.providersService.update(id, { photoUrl });
    return { photoUrl };
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  @Get(':id/services')
  async getServices(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.getServices(id);
  }

  @Post(':id/services')
  async createService(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
    const data = {
      description: body.description,
      originalPrice: body.originalPrice,
      discountMinPercent: body.discountMinPercent,
      discountMaxPercent: body.discountMaxPercent,
      insurancePrice: body.insurancePrice,
      discountedPrice: body.discountedPrice,
      discountType: body.discountType,
      discountValue: body.discountValue,
    };
    return this.providersService.createService(id, data);
  }

  @Put('services/:serviceId')
  async updateService(@Req() req: any, @Param('serviceId') serviceId: string, @Body() body: any) {
    await this.assertServiceTenant(req, serviceId);
    const data = {
      description: body.description,
      originalPrice: body.originalPrice,
      discountMinPercent: body.discountMinPercent,
      discountMaxPercent: body.discountMaxPercent,
      insurancePrice: body.insurancePrice,
      discountedPrice: body.discountedPrice,
      discountType: body.discountType,
      discountValue: body.discountValue,
    };
    return this.providersService.updateService(serviceId, data);
  }

  @Delete('services/:serviceId')
  async deleteService(@Req() req: any, @Param('serviceId') serviceId: string) {
    await this.assertServiceTenant(req, serviceId);
    return this.providersService.deleteService(serviceId);
  }

  // ─── Rewards ────────────────────────────────────────────────────────────────

  @Get('rewards/by-unit')
  getRewardsByUnit(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId) throw new ForbiddenException('Tenant não identificado.');
    return this.providersService.getRewardsByUnit(effectiveUnitId);
  }

  @Get(':id/rewards')
  async getRewardsByProvider(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.getRewardsByProvider(id);
  }

  @Post(':id/rewards')
  async createReward(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertTenant(req, id);
    return this.providersService.createReward(id, body);
  }

  @Put('rewards/:rewardId')
  async updateReward(@Req() req: any, @Param('rewardId') rewardId: string, @Body() body: any) {
    await this.assertRewardTenant(req, rewardId);
    return this.providersService.updateReward(rewardId, body);
  }

  @Delete('rewards/:rewardId')
  async deleteReward(@Req() req: any, @Param('rewardId') rewardId: string) {
    await this.assertRewardTenant(req, rewardId);
    return this.providersService.deleteReward(rewardId);
  }
}
