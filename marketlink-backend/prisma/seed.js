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
      shortDescription: "Performance marketing for local services.",
      overview: "We help local businesses grow with a mix of paid media, SEO, and landing page optimization.",
      websiteUrl: "https://windycitygrowth.com",
      phone: "(312) 555-0188",
      linkedinUrl: "https://linkedin.com/company/windy-city-growth",
      instagramUrl: "https://instagram.com/windycitygrowth",
      facebookUrl: "https://facebook.com/windycitygrowth",
      foundedYear: 2016,
      hourlyRateMin: 85,
      hourlyRateMax: 145,
      minProjectBudget: 5000,
      currencyCode: "USD",
      languages: ["english", "spanish"],
      industries: ["home-services", "healthcare"],
      clientSizes: ["smb", "mid-market"],
      specialties: ["lead gen", "conversion rate"],
      remoteFriendly: true,
      servesNationwide: true,
      responseTimeHours: 24,
      featured: true,
      completionScore: 82,
      projects: [
        {
          title: "Regional clinic paid search rebuild",
          summary: "Rebuilt fragmented Google Ads campaigns into a single conversion-focused account.",
          challenge: "Lead volume was flat and campaign structure made reporting unreliable.",
          solution: "Consolidated campaigns, rewrote landing pages, and introduced call tracking.",
          results: "Qualified leads increased by 38% in 90 days while cost per lead dropped by 21%.",
          services: ["ads", "seo"],
          projectBudget: 18000,
          startedAt: "2025-01-15",
          completedAt: "2025-04-15",
          isFeatured: true,
          coverImageUrl: "https://placehold.co/1200x700?text=Clinic+Growth",
        },
      ],
      clients: [
        {
          name: "Northside Dental Group",
          logoUrl: "https://placehold.co/120x120?text=ND",
          websiteUrl: "https://example.com/northside-dental",
          isFeatured: true,
        },
      ],
      media: [
        {
          type: "cover",
          url: "https://placehold.co/1200x700?text=Windy+City+Growth+Cover",
          altText: "Campaign dashboard overview for Windy City Growth",
        },
        {
          type: "video",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          altText: "Video walkthrough of campaign reporting and lead flow improvements",
        },
        {
          type: "gallery",
          url: "https://windycitygrowth.com",
          altText: "Windy City Growth website preview",
        },
        {
          type: "video",
          url: "https://www.instagram.com/windycitygrowth/",
          altText: "Windy City Growth Instagram profile",
        },
      ],
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
      shortDescription: "SEO and content for long-term growth.",
      overview: "We build sustainable SEO programs focused on content, technical fixes, and local visibility.",
      websiteUrl: "https://napervilledigitalboost.com",
      phone: "(630) 555-0134",
      linkedinUrl: "https://linkedin.com/company/naperville-digital-boost",
      instagramUrl: "https://instagram.com/napervilledigitalboost",
      facebookUrl: "https://facebook.com/napervilledigitalboost",
      foundedYear: 2019,
      hourlyRateMin: 70,
      hourlyRateMax: 120,
      minProjectBudget: 3000,
      currencyCode: "USD",
      languages: ["english"],
      industries: ["retail", "professional-services"],
      clientSizes: ["smb"],
      specialties: ["local seo", "content marketing"],
      remoteFriendly: true,
      servesNationwide: false,
      responseTimeHours: 36,
      featured: false,
      completionScore: 68,
      projects: [
        {
          title: "Local SEO relaunch for suburban retailer",
          summary: "Built a location-led content plan and fixed technical issues blocking map visibility.",
          challenge: "The site had duplicate local pages and weak rankings outside branded searches.",
          solution: "Reworked city pages, improved internal linking, and expanded review capture.",
          results: "Non-branded local clicks grew 52% over two quarters.",
          services: ["seo", "content marketing"],
          projectBudget: 9000,
          startedAt: "2025-02-01",
          completedAt: "2025-07-01",
          isFeatured: true,
          coverImageUrl: "https://placehold.co/1200x700?text=SEO+Relaunch",
        },
      ],
      clients: [
        {
          name: "Downtown Home & Patio",
          logoUrl: "https://placehold.co/120x120?text=DH",
          websiteUrl: "https://example.com/downtown-home-patio",
          isFeatured: true,
        },
      ],
      media: [
        {
          type: "gallery",
          url: "https://placehold.co/1000x700?text=SEO+Content+Hub",
          altText: "SEO content hub design and navigation example",
        },
        {
          type: "video",
          url: "https://www.instagram.com/napervilledigitalboost/",
          altText: "Naperville Digital Boost Instagram profile",
        },
      ],
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
      shortDescription: "Short-form social content that converts.",
      overview: "We plan, shoot, and edit reels plus run paid social to grow your audience.",
      websiteUrl: "https://evanstonsociallab.com",
      phone: "(847) 555-0199",
      linkedinUrl: "https://linkedin.com/company/evanston-social-lab",
      instagramUrl: "https://instagram.com/evanstonsociallab",
      facebookUrl: "https://facebook.com/evanstonsociallab",
      foundedYear: 2018,
      hourlyRateMin: 90,
      hourlyRateMax: 160,
      minProjectBudget: 6000,
      currencyCode: "USD",
      languages: ["english"],
      industries: ["hospitality", "retail"],
      clientSizes: ["smb", "mid-market"],
      specialties: ["video production", "paid social"],
      remoteFriendly: false,
      servesNationwide: true,
      responseTimeHours: 18,
      featured: true,
      completionScore: 77,
      projects: [
        {
          title: "Restaurant reels and paid social sprint",
          summary: "Produced a month-long short-form video campaign around new menu launches.",
          challenge: "The brand had strong walk-in traffic but weak repeat engagement on social.",
          solution: "Delivered weekly reels, creator-style edits, and promotion-based paid social targeting.",
          results: "Follower growth doubled and promoted offers drove a 27% lift in tracked redemptions.",
          services: ["social", "video"],
          projectBudget: 14000,
          startedAt: "2025-03-10",
          completedAt: "2025-05-20",
          isFeatured: true,
          coverImageUrl: "https://placehold.co/1200x700?text=Restaurant+Reels",
        },
      ],
      clients: [
        {
          name: "Lakefront Bistro",
          logoUrl: "https://placehold.co/120x120?text=LB",
          websiteUrl: "https://example.com/lakefront-bistro",
          isFeatured: true,
        },
      ],
      media: [
        {
          type: "video",
          url: "https://www.instagram.com/evanstonsociallab/",
          altText: "Evanston Social Lab Instagram profile",
        },
        {
          type: "gallery",
          url: "https://placehold.co/1000x700?text=Storyboard+Frames",
          altText: "Storyboard frames from a social video shoot",
        },
      ],
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
      shortDescription: "Print design and production for local brands.",
      overview: "We handle design, layout, and fast print turnaround for restaurants and shops.",
      websiteUrl: "https://oakparkprintco.com",
      phone: "(708) 555-0121",
      linkedinUrl: "https://linkedin.com/company/oak-park-print-co",
      instagramUrl: "https://instagram.com/oakparkprintco",
      facebookUrl: "https://facebook.com/oakparkprintco",
      foundedYear: 2012,
      hourlyRateMin: 60,
      hourlyRateMax: 110,
      minProjectBudget: 1500,
      currencyCode: "USD",
      languages: ["english"],
      industries: ["restaurant", "retail"],
      clientSizes: ["smb"],
      specialties: ["print design", "brand collateral"],
      remoteFriendly: false,
      servesNationwide: false,
      responseTimeHours: 48,
      featured: false,
      completionScore: 61,
      projects: [
        {
          title: "Restaurant print collateral refresh",
          summary: "Refreshed menus, storefront posters, and takeout inserts for a neighborhood group.",
          challenge: "Brand materials were inconsistent across locations and seasonal offers were slow to launch.",
          solution: "Created reusable templates and a faster approval workflow for print production.",
          results: "Turnaround time for new promotions dropped from two weeks to four days.",
          services: ["print", "brand collateral"],
          projectBudget: 4500,
          startedAt: "2025-01-05",
          completedAt: "2025-02-14",
          isFeatured: false,
          coverImageUrl: "https://placehold.co/1200x700?text=Print+Collateral",
        },
      ],
      clients: [
        {
          name: "Union Pizza House",
          logoUrl: "https://placehold.co/120x120?text=UP",
          websiteUrl: "https://example.com/union-pizza-house",
          isFeatured: true,
        },
      ],
      media: [
        {
          type: "gallery",
          url: "https://placehold.co/1000x700?text=Menu+Suite",
          altText: "Printed menu suite and window poster set",
        },
        {
          type: "video",
          url: "https://www.instagram.com/oakparkprintco/",
          altText: "Oak Park Print Co. Instagram profile",
        },
      ],
    },
  ];

  for (const p of sample) {
    const { projects = [], clients = [], media = [], ...providerData } = p;

    const provider = await prisma.provider.upsert({
      where: { slug: p.slug },
      update: providerData,
      create: providerData,
    });

    await prisma.providerProject.deleteMany({ where: { providerId: provider.id } });
    await prisma.providerClient.deleteMany({ where: { providerId: provider.id } });
    await prisma.providerMedia.deleteMany({ where: { providerId: provider.id } });

    if (projects.length) {
      await prisma.providerProject.createMany({
        data: projects.map((project, index) => ({
          providerId: provider.id,
          title: project.title,
          summary: project.summary,
          challenge: project.challenge,
          solution: project.solution,
          results: project.results,
          services: project.services || [],
          projectBudget: project.projectBudget ?? null,
          startedAt: project.startedAt ? new Date(project.startedAt) : null,
          completedAt: project.completedAt ? new Date(project.completedAt) : null,
          isFeatured: Boolean(project.isFeatured),
          coverImageUrl: project.coverImageUrl ?? null,
          sortOrder: index,
        })),
      });
    }

    if (clients.length) {
      await prisma.providerClient.createMany({
        data: clients.map((client, index) => ({
          providerId: provider.id,
          name: client.name,
          logoUrl: client.logoUrl ?? null,
          websiteUrl: client.websiteUrl ?? null,
          isFeatured: Boolean(client.isFeatured),
          sortOrder: index,
        })),
      });
    }

    if (media.length) {
      await prisma.providerMedia.createMany({
        data: media.map((item, index) => ({
          providerId: provider.id,
          type: item.type,
          url: item.url,
          altText: item.altText ?? null,
          sortOrder: index,
        })),
      });
    }
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
