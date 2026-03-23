import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Unidade ACIAV Videira
  const unit = await prisma.unit.upsert({
    where: { subdomain: 'videira.aciavsaude.com.br' },
    update: {},
    create: {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'ACIAV Videira',
      subdomain: 'videira.aciavsaude.com.br',
      settings: JSON.stringify({
        primaryColor: '#007178',
        secondaryColor: '#E65100',
        logoUrl: null,
      }),
      status: true,
    },
  });
  console.log(`✅ Unidade: ${unit.name}`);

  // 2. Empresa de exemplo
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      unitId: unit.id,
      corporateName: 'Karikal Comércio e Indústria',
      cnpj: '00.000.000/0001-00',
      adminEmail: 'rh@karikal.com.br',
      status: true,
    },
  });
  console.log(`✅ Empresa: ${company.corporateName}`);

  // 3. Credenciado de exemplo
  const provider = await prisma.provider.upsert({
    where: { id: 'prov-0001-0001-0001-000000000001' },
    update: {},
    create: {
      id: 'prov-0001-0001-0001-000000000001',
      unitId: unit.id,
      name: 'Clínica Saúde Total',
      category: 'Odontologia',
      address: JSON.stringify({
        street: 'Rua das Flores, 123',
        city: 'Videira',
        state: 'SC',
        lat: -27.0067,
        lng: -51.1513,
      }),
      bio: 'Clínica odontológica com mais de 10 anos de atendimento.',
      rankingScore: 4.8,
    },
  });
  console.log(`✅ Credenciado: ${provider.name}`);

  // 4. Serviço do credenciado
  const existing = await prisma.service.findFirst({ where: { providerId: provider.id } });
  if (!existing) {
    await prisma.service.create({
      data: {
        providerId: provider.id,
        description: 'Consulta Odontológica',
        originalPrice: 200.0,
        discountedPrice: 140.0,
      },
    });
    console.log(`✅ Serviço criado para ${provider.name}`);
  }

  // 5. Usuário titular de exemplo
  const user = await prisma.user.upsert({
    where: { cpf: '123.456.789-00' },
    update: {},
    create: {
      unitId: unit.id,
      companyId: company.id,
      fullName: 'Saulo Machado',
      cpf: '123.456.789-00',
      type: 'titular',
      pointsBalance: 150,
      status: true,
    },
  });
  console.log(`✅ Usuário beneficiário: ${user.fullName}`);

  // 6. AuthUsers
  const superAdminHash = await bcrypt.hash('Admin@2026!', 10);
  await prisma.authUser.upsert({
    where: { email: 'admin@aciavsaude.com.br' },
    update: {},
    create: {
      email: 'admin@aciavsaude.com.br',
      passwordHash: superAdminHash,
      role: 'super_admin',
      unitId: unit.id,
      status: true,
    },
  });
  console.log(`✅ Super Admin: admin@aciavsaude.com.br`);

  const adminUnitHash = await bcrypt.hash('AdminUnit@2026!', 10);
  await prisma.authUser.upsert({
    where: { email: 'gestao@aciavsaude.com.br' },
    update: {},
    create: {
      email: 'gestao@aciavsaude.com.br',
      passwordHash: adminUnitHash,
      role: 'admin_unit',
      unitId: unit.id,
      status: true,
    },
  });
  console.log(`✅ Admin Unidade: gestao@aciavsaude.com.br`);

  const rhHash = await bcrypt.hash('RH@2026!', 10);
  await prisma.authUser.upsert({
    where: { email: 'rh@karikal.com.br' },
    update: {},
    create: {
      email: 'rh@karikal.com.br',
      passwordHash: rhHash,
      role: 'rh',
      unitId: unit.id,
      companyId: company.id,
      status: true,
    },
  });
  console.log(`✅ RH: rh@karikal.com.br`);

  const providerHash = await bcrypt.hash('Cred@2026!', 10);
  await prisma.authUser.upsert({
    where: { email: 'atendimento@saudetotal.com.br' },
    update: {},
    create: {
      email: 'atendimento@saudetotal.com.br',
      passwordHash: providerHash,
      role: 'provider',
      unitId: unit.id,
      providerId: provider.id,
      status: true,
    },
  });
  console.log(`✅ Credenciado: atendimento@saudetotal.com.br`);

  const patientHash = await bcrypt.hash('Paciente@2026!', 10);
  await prisma.authUser.upsert({
    where: { email: 'saulo@karikal.com.br' },
    update: {},
    create: {
      email: 'saulo@karikal.com.br',
      passwordHash: patientHash,
      role: 'patient',
      unitId: unit.id,
      companyId: company.id,
      userId: user.id,
      status: true,
    },
  });
  console.log(`✅ Paciente: saulo@karikal.com.br`);

  console.log('\n🎉 Seed concluído!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('   Super Admin:   admin@aciavsaude.com.br     / Admin@2026!');
  console.log('   Admin Unidade: gestao@aciavsaude.com.br    / AdminUnit@2026!');
  console.log('   RH:            rh@karikal.com.br           / RH@2026!');
  console.log('   Credenciado:   atendimento@saudetotal.com.br / Cred@2026!');
  console.log('   Paciente:      saulo@karikal.com.br        / Paciente@2026!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
