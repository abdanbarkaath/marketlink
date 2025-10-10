// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sample = [
    {
      email: "contact@windycitygrowth.com",
      businessName: "Windy City Growth",
      slug: "windy-city-growth",
      tagline: "Meta + Google Ads for local",
      city: "Chicago",
      state: "IL",
      rating: 4.7,
      verified: true,
      logo: "https://placehold.co/80x80",
      services: ["seo", "ads", "social"],
    },
    {
      email: "hello@napervilledigitalboost.com",
      businessName: "Naperville Digital Boost",
      slug: "naperville-digital-boost",
      tagline: "SEO & content that compounds",
      city: "Naperville",
      state: "IL",
      rating: 4.5,
      verified: false,
      logo: "https://placehold.co/80x80",
      services: ["seo"],
    },
    {
      email: "team@evanstonsociallab.com",
      businessName: "Evanston Social Lab",
      slug: "evanston-social-lab",
      tagline: "Short-form video + socials",
      city: "Evanston",
      state: "IL",
      rating: 4.2,
      verified: true,
      logo: "https://placehold.co/80x80",
      services: ["social", "video"],
    },
    {
      email: "print@oakparkprintco.com",
      businessName: "Oak Park Print Co.",
      slug: "oak-park-print-co",
      tagline: "Flyers, menus, window wraps",
      city: "Oak Park",
      state: "IL",
      rating: 4.0,
      verified: false,
      logo: "https://placehold.co/80x80",
      services: ["print"],
    },
  ];

  for (const p of sample) {
    await prisma.provider.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log(`✅ Seeded ${sample.length} providers`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
