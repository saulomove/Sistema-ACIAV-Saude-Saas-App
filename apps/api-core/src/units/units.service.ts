import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SENSITIVE_EMAIL_KEYS = ['resendApiKey', 'smtpPass'] as const;

function maskSecret(val?: string): string {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 6) return '•'.repeat(val.length);
  return `${val.slice(0, 3)}••••${val.slice(-3)}`;
}

function sanitizeSettings(raw?: string | null): string | null {
  if (!raw) return raw ?? null;
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const integrations = parsed.integrations as Record<string, any> | undefined;
    if (integrations?.email && typeof integrations.email === 'object') {
      const e = { ...(integrations.email as Record<string, any>) };
      if (e.resendApiKey) {
        e.resendApiKeyMask = maskSecret(e.resendApiKey);
        delete e.resendApiKey;
      }
      if (e.smtpPass) {
        e.smtpPassMask = maskSecret(e.smtpPass);
        delete e.smtpPass;
      }
      integrations.email = e;
      parsed.integrations = integrations;
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function mergeSettingsSecrets(prevRaw: string | null | undefined, nextRaw: string): string {
  try {
    const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, any>) : {};
    const next = JSON.parse(nextRaw) as Record<string, any>;
    const prevEmail = prev?.integrations?.email ?? {};
    const nextEmail = next?.integrations?.email;
    if (nextEmail && typeof nextEmail === 'object') {
      for (const key of SENSITIVE_EMAIL_KEYS) {
        if (!nextEmail[key] || nextEmail[key] === '') {
          if (prevEmail[key]) nextEmail[key] = prevEmail[key];
          else delete nextEmail[key];
        }
      }
      delete nextEmail.resendApiKeyMask;
      delete nextEmail.smtpPassMask;
      next.integrations = { ...(next.integrations ?? {}), email: nextEmail };
    }
    return JSON.stringify(next);
  } catch {
    return nextRaw;
  }
}

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const units = await this.prisma.unit.findMany({
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return units.map((u) => ({ ...u, settings: sanitizeSettings(u.settings) }));
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
    });
    if (!unit) return unit;
    return { ...unit, settings: sanitizeSettings(unit.settings) };
  }

  // Retorno enxuto p/ o app do paciente (Ouvidoria): só o que é seguro expor,
  // sem o objeto Unit inteiro (settings/policies).
  async getSupportInfo(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
      select: { name: true, supportWhatsapp: true },
    });
  }

  async create(data: {
    name: string;
    subdomain: string;
    settings?: string;
    supportWhatsapp?: string | null;
    cityName?: string | null;
    state?: string | null;
    ibgeCode?: string | null;
  }) {
    const clean: {
      name: string;
      subdomain: string;
      settings?: string;
      supportWhatsapp?: string | null;
      cityName?: string | null;
      state?: string | null;
      ibgeCode?: string | null;
    } = {
      name: data.name,
      subdomain: data.subdomain,
    };
    if (data.settings !== undefined) clean.settings = data.settings;
    if (data.supportWhatsapp !== undefined) {
      const raw = typeof data.supportWhatsapp === 'string' ? data.supportWhatsapp.replace(/\D/g, '') : null;
      clean.supportWhatsapp = raw ? raw : null;
    }
    if (data.cityName !== undefined) clean.cityName = data.cityName?.trim() || null;
    if (data.state !== undefined) clean.state = (data.state ?? '').trim().toUpperCase().slice(0, 2) || null;
    if (data.ibgeCode !== undefined) clean.ibgeCode = (typeof data.ibgeCode === 'string' ? data.ibgeCode.replace(/\D/g, '') : '') || null;
    return this.prisma.unit.create({ data: clean });
  }

  async update(id: string, data: {
    name?: string;
    subdomain?: string;
    settings?: string;
    status?: boolean;
    supportWhatsapp?: string | null;
    cityName?: string | null;
    state?: string | null;
    ibgeCode?: string | null;
    featuresRewards?: boolean;
  }) {
    const allowed: any = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.subdomain !== undefined) allowed.subdomain = data.subdomain;
    if (data.settings !== undefined) {
      const existing = await this.prisma.unit.findUnique({ where: { id }, select: { settings: true } });
      allowed.settings = mergeSettingsSecrets(existing?.settings ?? null, data.settings);
    }
    if (data.status !== undefined) allowed.status = data.status;
    if (data.supportWhatsapp !== undefined) {
      const raw = typeof data.supportWhatsapp === 'string' ? data.supportWhatsapp.replace(/\D/g, '') : null;
      allowed.supportWhatsapp = raw ? raw : null;
    }
    if (data.cityName !== undefined) allowed.cityName = data.cityName?.trim() || null;
    if (data.state !== undefined) allowed.state = (data.state ?? '').trim().toUpperCase().slice(0, 2) || null;
    if (data.ibgeCode !== undefined) allowed.ibgeCode = (typeof data.ibgeCode === 'string' ? data.ibgeCode.replace(/\D/g, '') : '') || null;
    if (data.featuresRewards !== undefined) allowed.featuresRewards = !!data.featuresRewards;
    const updated = await this.prisma.unit.update({ where: { id }, data: allowed });
    return { ...updated, settings: sanitizeSettings(updated.settings) };
  }

  async remove(id: string) {
    return this.prisma.unit.update({ where: { id }, data: { status: false } });
  }

  async getRawSettings(id: string): Promise<string | null> {
    const unit = await this.prisma.unit.findUnique({ where: { id }, select: { settings: true } });
    return unit?.settings ?? null;
  }
}
