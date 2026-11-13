import { LocationPrecision } from '@prisma/client';

export const sanitizePublicExpertLocation = <T extends {
  city: string; state: string; zip: string | null; streetAddress?: string | null;
  latitude: number | null; longitude: number | null; locationPrecision: LocationPrecision;
  publicCityLatitude: number | null; publicCityLongitude: number | null;
}>({ publicCityLatitude, publicCityLongitude, ...expert }: T) => {
  if (expert.locationPrecision !== LocationPrecision.approximate && expert.locationPrecision !== LocationPrecision.private) return expert;
  const isPrivate = expert.locationPrecision === LocationPrecision.private;
  return {
    ...expert,
    ...(isPrivate ? { city: '', state: '' } : {}),
    ...('streetAddress' in expert ? { streetAddress: null } : {}),
    zip: null,
    latitude: isPrivate ? null : publicCityLatitude ?? null,
    longitude: isPrivate ? null : publicCityLongitude ?? null,
  };
};
