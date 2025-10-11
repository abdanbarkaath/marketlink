// prisma/seed_owners.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.provider.findMany();
  console.log(`Found ${providers.length} providers to link…`);

  let linked = 0;

  for (const p of providers) {
    // Create or find a user for this provider's email
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {}, // no updates for now
      create: {
        email: p.email,
        role: 'provider',
      },
    });

    // Link provider to the user (ownership)
    await prisma.provider.update({
      where: { id: p.id },
      data: { userId: user.id },
    });

    linked++;
  }

  console.log(`✅ Linked ${linked} provider(s) to user accounts`);
}

main()
  .catch((e) => {
    console.error('❌ Seed owners failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
