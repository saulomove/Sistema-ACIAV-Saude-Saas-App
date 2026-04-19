import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CATEGORIES: Array<{ name: string; slug: string; color: string; order: number }> = [
  { name: 'Consultas', slug: 'consultas', color: 'bg-blue-50 text-blue-700', order: 1 },
  { name: 'Exames', slug: 'exames', color: 'bg-purple-50 text-purple-700', order: 2 },
  { name: 'Odontologia', slug: 'odontologia', color: 'bg-cyan-50 text-cyan-700', order: 3 },
  { name: 'Estética', slug: 'estetica', color: 'bg-pink-50 text-pink-700', order: 4 },
  { name: 'Fisioterapia', slug: 'fisioterapia', color: 'bg-emerald-50 text-emerald-700', order: 5 },
];

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private async ensureSeed(unitId: string) {
    const count = await this.prisma.category.count({ where: { unitId } });
    if (count > 0) return;
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, unitId })),
      skipDuplicates: true,
    });
  }

  async findAll(unitId: string) {
    await this.ensureSeed(unitId);
    return this.prisma.category.findMany({
      where: { unitId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async create(unitId: string, data: { name: string; color?: string; order?: number }) {
    const name = (data.name || '').trim();
    if (name.length < 2) throw new BadRequestException('Nome da categoria é obrigatório (mínimo 2 caracteres).');
    const slug = slugify(name);
    if (!slug) throw new BadRequestException('Nome inválido.');

    const existing = await this.prisma.category.findUnique({ where: { unitId_slug: { unitId, slug } } });
    if (existing) throw new ConflictException('Já existe uma categoria com esse nome.');

    const max = await this.prisma.category.aggregate({ where: { unitId }, _max: { order: true } });
    const nextOrder = data.order ?? ((max._max.order ?? 0) + 1);

    return this.prisma.category.create({
      data: {
        unitId,
        name,
        slug,
        color: data.color?.trim() || null,
        order: nextOrder,
      },
    });
  }

  async update(
    unitId: string,
    id: string,
    data: { name?: string; color?: string; order?: number; status?: boolean },
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Categoria não encontrada.');
    if (existing.unitId !== unitId) throw new ForbiddenException('Acesso negado.');

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 2) throw new BadRequestException('Nome inválido.');
      const slug = slugify(name);
      if (!slug) throw new BadRequestException('Nome inválido.');
      if (slug !== existing.slug) {
        const dupe = await this.prisma.category.findUnique({ where: { unitId_slug: { unitId, slug } } });
        if (dupe && dupe.id !== id) throw new ConflictException('Já existe uma categoria com esse nome.');
      }

      if (name !== existing.name) {
        await this.prisma.provider.updateMany({
          where: { unitId, category: existing.name },
          data: { category: name },
        });
      }
      updateData.name = name;
      updateData.slug = slug;
    }
    if (data.color !== undefined) updateData.color = data.color?.trim() || null;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  async remove(unitId: string, id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Categoria não encontrada.');
    if (existing.unitId !== unitId) throw new ForbiddenException('Acesso negado.');

    const inUse = await this.prisma.provider.count({
      where: { unitId, category: existing.name, status: true },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Não é possível excluir: existem ${inUse} credenciado(s) ativo(s) usando esta categoria.`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
