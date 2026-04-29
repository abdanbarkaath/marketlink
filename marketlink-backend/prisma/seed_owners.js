// prisma/seed_owners.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const experts = await prisma.expert.findMany();
  console.log(`Found ${experts.length} experts to link...`);

  let linked = 0;

  for (const expert of experts) {
    const user = await prisma.user.upsert({
      where: { email: expert.email },
      update: {},
      create: {
        email: expert.email,
        role: 'provider',
      },
    });

    await prisma.expert.update({
      where: { id: expert.id },
      data: { userId: user.id },
    });

    linked++;
  }

  console.log(`Linked ${linked} expert(s) to user accounts`);
}

main()
  .catch((e) => {
    console.error('Seed owners failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
