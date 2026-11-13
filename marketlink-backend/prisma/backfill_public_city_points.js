require('dotenv/config');
require('ts-node/register/transpile-only');

const { prisma } = require('../src/lib/prisma');
const { geocodeExpertLocation, hasGeocodingConfig } = require('../src/lib/geocoding');

const needsCityPoint = {
  locationPrecision: 'approximate',
  OR: [{ publicCityLatitude: null }, { publicCityLongitude: null }],
};

async function backfillPublicCityPoints() {
  const cities = await prisma.expert.findMany({
    where: needsCityPoint,
    select: { city: true, state: true },
    distinct: ['city', 'state'],
  });
  if (cities.length && !hasGeocodingConfig()) {
    throw new Error('Set GEOAPIFY_API_KEY before backfilling public city points.');
  }

  let updated = 0;
  let unresolved = 0;
  for (const city of cities) {
    const point = await geocodeExpertLocation(city);
    if (!point.ok) {
      unresolved += 1;
      continue;
    }
    const result = await prisma.expert.updateMany({
      where: { ...needsCityPoint, ...city },
      data: { publicCityLatitude: point.latitude, publicCityLongitude: point.longitude },
    });
    updated += result.count;
  }
  console.log('Updated %d listings. Unresolved cities: %d.', updated, unresolved);
  if (unresolved) process.exitCode = 1;
}

backfillPublicCityPoints()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
