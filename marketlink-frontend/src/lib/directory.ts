import { marketingSubjects, formatServiceTokenLabel } from '@/lib/marketingTaxonomy';

export const directoryServices = marketingSubjects.flatMap((area) => area.subcategories.map((service) => ({
  id: `${area.id}.${service.id}`, label: service.label, description: service.buyerLabel,
  area: area.label, areaId: area.id, areaDescription: area.buyerLabel,
  tokens: [...new Set<string>([service.serviceTokens[0], ...(service.id === 'local-seo' ? ['seo'] : [])].filter(Boolean))],
  keywords: [service.label, service.buyerLabel, ...service.serviceTokens, ...service.deliverables.map((item) => item.label)].join(' ').toLowerCase(),
})));
const shortcutAreas = ['local-search-seo', 'social-media-community', 'brand-design-print', 'website-landing-pages'];
export const directoryFilters = [...directoryServices, ...marketingSubjects.filter((area) => shortcutAreas.includes(area.id)).map((area) => ({
  id: `area:${area.id}`, label: area.label, description: area.buyerLabel, area: area.label, areaId: area.id, areaDescription: area.buyerLabel,
  tokens: [...new Set<string>([area.serviceTokens[0], ...area.subcategories.map((item) => item.serviceTokens[0])])], keywords: area.label.toLowerCase(),
}))];
export const directoryShortcuts = ['area:local-search-seo', 'paid-ads-lead-generation.google-ads', 'area:social-media-community', 'area:brand-design-print', 'area:website-landing-pages']
  .map((id) => directoryFilters.find((service) => service.id === id)).filter((service) => service !== undefined);
export const directoryShortcutLabels = ['SEO', 'Google Ads', 'Social Media', 'Branding', 'Websites'];
export function searchDirectoryServices(query: string) {
  const raw = query.trim().toLowerCase();
  const aliases: Record<string, string> = { 'instagram ads': 'meta-ads', 'facebook ads': 'meta-ads', photographer: 'photography', newsletter: 'email-marketing', logo: 'brand-identity' };
  const text = aliases[raw] || raw;
  return directoryServices.filter((service) => !text || service.keywords.includes(text) || service.area.toLowerCase().includes(text));
}
export type DirectoryProvider = {
  id: string; slug: string; businessName: string; expertType?: 'agency' | 'freelancer' | 'creator' | 'specialist' | null;
  locationPrecision?: 'exact' | 'approximate' | null; tagline: string | null; shortDescription?: string | null;
  city: string; state: string; zip?: string | null; latitude?: number | null; longitude?: number | null;
  verified: boolean; logo: string | null; services: string[]; distanceMiles?: number;
  hourlyRateMin?: number | null; hourlyRateMax?: number | null; minProjectBudget?: number | null; currencyCode?: string | null;
};
export type DirectoryPayload = { data: DirectoryProvider[]; meta: { total: number; page: number; limit: number; totalPages: number } };
export function money(value: number | null | undefined, currency = 'USD') {
  if (typeof value !== 'number' || value <= 0) return null;
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
}
export function providerPricing(provider: DirectoryProvider) {
  const currency = provider.currencyCode || 'USD';
  const project = money(provider.minProjectBudget, currency);
  const min = money(provider.hourlyRateMin, currency), max = money(provider.hourlyRateMax, currency);
  return { project: project ? `From ${project}` : 'Ask for a quote', hourly: min && max ? `${min}–${max} / hour` : min ? `From ${min} / hour` : max ? `Up to ${max} / hour` : null };
}
export function serviceLabel(token: string) {
  return directoryServices.find((item) => item.tokens.includes(token))?.label || formatServiceTokenLabel(token);
}
