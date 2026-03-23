import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.unit.findMany({
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, companies: true, providers: true } },
      },
    });
  }

  async create(data: { name: string; subdomain: string; settings?: string }) {
    return this.prisma.unit.create({ data });
  }

  async update(id: string, data: { name?: string; subdomain?: string; settings?: string; status?: boolean }) {
    return this.prisma.unit.update({ where: { id }, data });
  }
}
