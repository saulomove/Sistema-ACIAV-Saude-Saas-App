import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Unit (ACIAV)
    const unit = await prisma.unit.upsert({
        where: { subdomain: 'videira.aciavsaude.com.br' },
        update: {},
        create: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Required by mobile app dummy token
            name: 'ACIAV Videira',
            subdomain: 'videira.aciavsaude.com.br',
            status: true,
        },
    });
    console.log('✅ Unit created:', unit.name);

    // Create Company (Karikal)
    const company = await prisma.company.upsert({
        where: { cnpj: '00.000.000/0001-00' },
        update: {},
        create: {
            unitId: unit.id,
            corporateName: 'Karikal Comercio e Industria',
            cnpj: '00.000.000/0001-00',
            adminEmail: 'rh@karikal.com.br',
            status: true,
        },
    });
    console.log('✅ Company created:', company.corporateName);

    // Create Provider (Saúde Clinic)
    const provider = await prisma.provider.create({
        data: {
            unitId: unit.id,
            name: 'Clínica Saúde Total',
            category: 'Odontologia',
            rankingScore: 4.8,
        },
    });
    console.log('✅ Provider created:', provider.name);

    // Create User (Saulo Machado)
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
    console.log('✅ User created:', user.fullName);

    console.log('🌱 Database seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
