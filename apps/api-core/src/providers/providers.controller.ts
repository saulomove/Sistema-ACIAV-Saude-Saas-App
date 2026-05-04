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
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { ProvidersService, ENTITY_TYPES, type EntityType } from './providers.service';

const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const PHOTO_OUTPUT_SIZE = 400;
const PHOTO_QUALITY = 85;
const PROVIDERS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'providers');

const uploadStorage = diskStorage({
  destination: PROVIDERS_UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext || '.bin'}`);
  },
});

const photoFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new BadRequestException('Formato inválido. Use JPG, PNG, WebP ou HEIC.'), false);
};

/**
 * Recebe o arquivo cru salvo pelo multer, roda pelo sharp para padronizar
 * 400x400 cover + WebP q=85, deleta o arquivo intermediário e retorna a URL
 * relativa final.
 */
async function processUploadedPhoto(file: Express.Multer.File): Promise<string> {
  const inputPath = file.path;
  const filename = `${crypto.randomBytes(16).toString('hex')}.webp`;
  const outputPath = path.join(PROVIDERS_UPLOAD_DIR, filename);
  try {
    await sharp(inputPath)
      .rotate() // respeita EXIF
      .resize(PHOTO_OUTPUT_SIZE, PHOTO_OUTPUT_SIZE, { fit: 'cover' })
      .webp({ quality: PHOTO_QUALITY })
      .toFile(outputPath);
  } catch (err) {
    await fs.unlink(inputPath).catch(() => undefined);
    throw new BadRequestException('Não foi possível processar a imagem. Tente outro arquivo.');
  }
  await fs.unlink(inputPath).catch(() => undefined);
  return `/uploads/providers/${filename}`;
}

/**
 * Apaga foto antiga em disco (best-effort). Não bloqueia se falhar.
 */
async function deleteOldPhotoFile(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl || !photoUrl.startsWith('/uploads/providers/')) return;
  const filename = path.basename(photoUrl);
  if (!filename || filename.includes('..') || filename.includes('/')) return;
  const fullPath = path.join(PROVIDERS_UPLOAD_DIR, filename);
  await fs.unlink(fullPath).catch(() => undefined);
}

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
    @Query('type') typeCsv?: string,
    @Query('discountMin') discountMin?: string,
  ) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
    const allowedTypes = new Set<string>(ENTITY_TYPES);
    const types = typeCsv
      ? typeCsv.split(',').map((s) => s.trim()).filter((s) => allowedTypes.has(s))
      : undefined;
    const discMin = discountMin ? Number(discountMin) : undefined;
    return this.providersService.findAll(
      effectiveUnitId,
      category,
      search,
      Number(page) || 1,
      Number(limit) || 50,
      { city, sortBy, types: types as EntityType[] | undefined, discountMin: discMin },
    );
  }

  @Get('cities')
  listCities(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
    return this.providersService.listCities(effectiveUnitId ?? '');
  }

  @Get('categories')
  listCategories(@Req() req: any, @Query('unitId') unitId?: string) {
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Tenant não identificado.');
    }
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
    limits: { fileSize: PHOTO_MAX_SIZE },
    fileFilter: photoFileFilter,
  }))
  async uploadMyPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const providerId = this.assertProviderSelf(req);
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const previous = await this.providersService.findOne(providerId);
    const photoUrl = await processUploadedPhoto(file);
    await this.providersService.update(providerId, { photoUrl });
    await deleteOldPhotoFile(previous?.photoUrl);
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
    const effectiveUnitId = req.user.role === 'super_admin' ? unitId : req.user.unitId;
    if (!effectiveUnitId) throw new ForbiddenException('Tenant não identificado.');
    return this.providersService.ranking(effectiveUnitId, limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertTenant(req, id);
    return this.providersService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const unitId = req.user.role === 'super_admin' ? (body.unitId ?? req.user.unitId) : req.user.unitId;
    if (!unitId) throw new ForbiddenException('Tenant não identificado.');
    const data = {
      unitId,
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
    limits: { fileSize: PHOTO_MAX_SIZE },
    fileFilter: photoFileFilter,
  }))
  async uploadPhoto(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    await this.assertTenant(req, id);
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    const previous = await this.providersService.findOne(id);
    const photoUrl = await processUploadedPhoto(file);
    await this.providersService.update(id, { photoUrl });
    await deleteOldPhotoFile(previous?.photoUrl);
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
