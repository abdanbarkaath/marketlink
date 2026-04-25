'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Figtree, Playfair_Display } from 'next/font/google';
import InquiryForm from './InquiryForm';
import { useMarketLinkTheme } from '../../../components/ThemeToggle';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const bodyFont = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  tagline: string | null;
  shortDescription?: string | null;
  overview?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  foundedYear?: number | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  minProjectBudget?: number | null;
  currencyCode?: string | null;
  languages?: string[];
  industries?: string[];
  clientSizes?: string[];
  specialties?: string[];
  remoteFriendly?: boolean;
  servesNationwide?: boolean;
  responseTimeHours?: number | null;
  city: string;
  state: string;
  zip: string | null;
  services: string[];
  projects?: Array<{
    id: string;
    title: string;
    summary?: string | null;
    challenge?: string | null;
    solution?: string | null;
    results?: string | null;
    services: string[];
    projectBudget?: number | null;
    startedAt?: string | null;
    completedAt?: string | null;
    isFeatured?: boolean;
    coverImageUrl?: string | null;
    sortOrder?: number;
  }>;
  clients?: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    isFeatured?: boolean;
    sortOrder?: number;
  }>;
  media?: Array<{
    id: string;
    type: 'logo' | 'cover' | 'gallery' | 'video';
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
  reviews?: Array<{
    id: string;
    reviewerName: string;
    company?: string | null;
    rating: number;
    communicationRating?: number | null;
    qualityRating?: number | null;
    valueRating?: number | null;
    title?: string | null;
    body: string;
    projectSummary?: string | null;
    verified: boolean;
    source?: string | null;
    publishedAt?: string | null;
    sortOrder?: number;
  }>;
  certifications?: Array<{
    id: string;
    title: string;
    issuer: string;
    year?: number | null;
    url?: string | null;
    badgeImageUrl?: string | null;
    sortOrder?: number;
  }>;
  awards?: Array<{
    id: string;
    title: string;
    issuer: string;
    year?: number | null;
    url?: string | null;
    badgeImageUrl?: string | null;
    sortOrder?: number;
  }>;
  rating: number | null;
  verified: boolean;
  logo: string | null;
  status: 'active' | 'pending' | 'disabled';
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProviderMediaItem = NonNullable<Provider['media']>[number];

type MediaPresentation =
  | { kind: 'image'; src: string }
  | { kind: 'embed'; src: string; label: string }
  | { kind: 'instagramProfile'; href: string; handle: string }
  | { kind: 'website'; src: string; hostname: string }
  | { kind: 'link'; href: string; label: string };

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isYouTubeUrl(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  return host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com';
}

function getInstagramEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'instagram.com') return null;
  const match = url.pathname.match(/^\/(p|reel|tv)\/([^/?#]+)/);
  if (!match) return null;
  return `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned/`;
}

function getInstagramProfile(url: URL): { href: string; handle: string } | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'instagram.com') return null;
  const path = url.pathname.split('/').filter(Boolean);
  if (path.length !== 1) return null;
  const handle = path[0]?.trim();
  if (!handle) return null;
  return { href: url.toString(), handle: `@${handle}` };
}

function formatToken(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMoney(value: number | null | undefined, currencyCode: string | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currencyCode || 'USD'} ${value}`;
  }
}

function formatMoneyRange(min: number | null | undefined, max: number | null | undefined, currencyCode: string | null | undefined, suffix = '') {
  const formattedMin = formatMoney(min, currencyCode);
  const formattedMax = formatMoney(max, currencyCode);

  if (formattedMin && formattedMax) return `${formattedMin} - ${formattedMax}${suffix}`;
  if (formattedMin) return `${formattedMin}+${suffix}`;
  if (formattedMax) return `Up to ${formattedMax}${suffix}`;
  return null;
}

function formatLocation(city: string, state: string, zip: string | null) {
  return [city, state, zip].filter(Boolean).join(', ');
}

function getMediaPresentation(item: ProviderMediaItem): MediaPresentation {
  const url = parseUrl(item.url);
  if (!url) {
    return { kind: 'link', href: item.url, label: 'Open link' };
  }

  const embedUrl = getInstagramEmbed(url);
  if (embedUrl) {
    return { kind: 'embed', src: embedUrl, label: 'Instagram embed' };
  }

  const instagramProfile = getInstagramProfile(url);
  if (instagramProfile) {
    return { kind: 'instagramProfile', href: instagramProfile.href, handle: instagramProfile.handle };
  }

  if (isYouTubeUrl(url)) {
    return { kind: 'link', href: item.url, label: 'Watch on YouTube' };
  }

  if (item.type !== 'video' && IMAGE_EXT_RE.test(url.pathname)) {
    return { kind: 'image', src: item.url };
  }

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return { kind: 'website', src: item.url, hostname: url.hostname.replace(/^www\./, '') };
  }

  return { kind: 'link', href: item.url, label: 'Open link' };
}

export default function ProviderPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProvider() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        const res = await fetch(`${API_BASE}/providers/${resolvedParams.slug}`);
        if (res.status === 404) {
          notFound();
        }
        if (!res.ok) {
          throw new Error(`Failed to load expert profile: ${res.status}`);
        }
        const data = await res.json();
        setProvider(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProvider();
  }, [resolvedParams.slug]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Loading...</div>;
  }

  if (error || !provider) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Error: {error}</div>;
  }

  return <ProviderPageContent provider={provider} />;
}

function ProviderPageContent({ provider: p }: { provider: Provider }) {
  const { t } = useMarketLinkTheme();
  const pageBorder = 'border-[rgba(var(--ml-border),0.7)]';
  const pageSurface = t.surface;
  const pageSurfaceMuted = t.surfaceMuted;
  const [fitOpen, setFitOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const featuredProjects = (p.projects || []).filter((project) => project.isFeatured);
  const visibleProjects = featuredProjects.length ? featuredProjects : p.projects || [];
  const featuredClients = (p.clients || []).filter((client) => client.isFeatured);
  const visibleClients = featuredClients.length ? featuredClients : p.clients || [];
  const visibleCertifications = p.certifications || [];
  const visibleAwards = p.awards || [];
  const visibleMedia = (p.media || []).filter((item) => {
    if (item.type === 'logo') return false;
    const url = parseUrl(item.url);
    return url ? !isYouTubeUrl(url) : true;
  });
  const coverMedia = visibleMedia.find((item) => item.type === 'cover') || visibleMedia.find((item) => getMediaPresentation(item).kind === 'image') || null;
  const hourlyRange = formatMoneyRange(p.hourlyRateMin, p.hourlyRateMax, p.currencyCode, ' / hr');
  const startingBudget = formatMoney(p.minProjectBudget, p.currencyCode);
  const locationLabel = formatLocation(p.city, p.state, p.zip);
  const mapEmbedSrc = `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(locationLabel)}&t=&z=11&ie=UTF8&iwloc=B&output=embed`;
  const decisionCards = [
    hourlyRange ? { label: 'Hourly range', value: hourlyRange } : null,
    startingBudget ? { label: 'Project minimum', value: `${startingBudget}+` } : null,
    p.responseTimeHours ? { label: 'Response time', value: `${p.responseTimeHours}h` } : null,
    p.foundedYear ? { label: 'Founded', value: String(p.foundedYear) } : null,
    p.rating ? { label: 'Rating', value: `${p.rating.toFixed(1)} / 5` } : null,
    p.servesNationwide ? { label: 'Coverage', value: 'Nationwide' } : p.remoteFriendly ? { label: 'Coverage', value: 'Remote-ready' } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const fitChips = [
    ...(p.industries || []).map((value) => ({ group: 'Industry', value: formatToken(value) })),
    ...(p.specialties || []).map((value) => ({ group: 'Specialty', value: formatToken(value) })),
  ].slice(0, 4);
  const heroServices = p.services.slice(0, 4);
  const heroServicesOverflow = Math.max(0, p.services.length - heroServices.length);
  const selectedWorkSection = visibleMedia.length ? (
    <section className={`overflow-hidden rounded-[2rem] ${pageSurface} ${pageBorder} border shadow-[0_20px_70px_rgba(15,23,42,0.08)]`}>
      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className={`text-[11px] font-medium uppercase tracking-[0.22em] ${t.mutedText}`}>Selected work</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <h2 className={`${displayFont.className} text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-[2.35rem]`}>Recent examples of how they present the work.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 md:text-base md:leading-8">
              Use this section to gauge visual quality, brand polish, and whether the public-facing work feels close to what your project needs.
            </p>
          </div>
          <div className={`rounded-[1.35rem] ${pageSurfaceMuted} ${pageBorder} border px-4 py-4 text-left shadow-sm lg:text-right`}>
            <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Portfolio items</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{visibleMedia.length}</div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-t border-slate-200/80 p-6 md:grid-cols-2 md:px-8 md:py-8">
        {visibleMedia.map((item) => {
          const media = getMediaPresentation(item);
          const spanClass = media.kind === 'website' ? 'md:col-span-2' : '';

          return (
            <div key={item.id} className={`${spanClass} overflow-hidden rounded-[1.75rem] ${pageSurfaceMuted} ${pageBorder} border shadow-sm`}>
              {media.kind === 'embed' ? (
                <>
                  <iframe
                    src={media.src}
                    title={item.altText || media.label}
                    className="h-72 w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                  <div className="border-t border-slate-200/80 p-4 md:p-5">
                    <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>{media.label}</div>
                    {item.altText ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.altText}</p> : null}
                    {media.label === 'Instagram embed' ? (
                      <a className="mt-3 inline-block text-sm font-medium underline text-slate-900" href={item.url} target="_blank" rel="noreferrer">
                        Open on Instagram
                      </a>
                    ) : null}
                  </div>
                </>
              ) : null}

              {media.kind === 'image' ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.src} alt={item.altText || 'Expert media'} className="h-56 w-full object-cover" />
                  {item.altText ? <div className="p-4 text-sm leading-7 text-slate-700 md:p-5">{item.altText}</div> : null}
                </>
              ) : null}

              {media.kind === 'website' ? (
                <>
                  <iframe
                    src={media.src}
                    title={item.altText || `${media.hostname} website preview`}
                    className="h-[30rem] w-full bg-white"
                    loading="lazy"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="border-t border-slate-200/80 p-4 md:p-5">
                    <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Website preview</div>
                    <div className="mt-3 text-sm leading-7 text-slate-700">{item.altText || `Embedded preview for ${media.hostname}`}</div>
                    <a className="mt-3 inline-block text-sm font-medium underline text-slate-900" href={media.src} target="_blank" rel="noreferrer">
                      {media.hostname.includes('instagram.com') ? 'Open on Instagram' : 'Open website'}
                    </a>
                    <div className={`mt-2 text-xs ${t.mutedText}`}>Some websites block iframes. If that happens, use the direct link.</div>
                  </div>
                </>
              ) : null}

              {media.kind === 'instagramProfile' ? (
                <div className="p-5 md:p-6">
                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Instagram profile</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{media.handle}</div>
                  {item.altText ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.altText}</p> : null}
                  <a className="mt-4 inline-block text-sm font-medium underline text-slate-900" href={media.href} target="_blank" rel="noreferrer">
                    Open on Instagram
                  </a>
                </div>
              ) : null}

              {media.kind === 'link' ? (
                <div className="p-4 md:p-5">
                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>External media</div>
                  <a className="mt-2 block break-all text-sm font-medium underline text-slate-900" href={media.href} target="_blank" rel="noreferrer">
                    {media.label}
                  </a>
                  <div className={`mt-2 text-xs ${t.mutedText}`}>{media.href}</div>
                  {item.altText ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.altText}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  return (
    <main className={`${bodyFont.className} ${t.pageBg} min-h-[calc(100vh-72px)]`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-6 md:gap-8">
          {p.status !== 'active' && (
            <div className={`rounded-2xl ${pageSurfaceMuted} ${pageBorder} border p-4 shadow-[0_14px_45px_rgba(2,6,23,0.08)]`}>
              <div className="font-medium text-slate-900">{p.status === 'disabled' ? 'Your expert profile is disabled' : 'Your expert profile is pending approval'}</div>
              {p.disabledReason && (
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-medium">Reason:</span> {p.disabledReason}
                </div>
              )}
              <div className="mt-2 text-xs text-slate-600">Only you can see this profile until it&apos;s active.</div>
            </div>
          )}

          <header className="overflow-hidden rounded-[2rem] ml-card shadow-[0_28px_80px_rgba(23,26,31,0.10)]">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px] xl:gap-0">
              <div className="px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
                <div className="space-y-5 md:space-y-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${t.brandBadge}`}>
                      Expert profile
                    </span>
                    {p.verified ? (
                      <span className="ml-pill-muted rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                        Verified
                      </span>
                    ) : null}
                    <span className={`rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${t.brandBadge}`}>
                      {locationLabel}
                    </span>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex items-start gap-4 md:gap-5">
                        {p.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo} alt={p.businessName} className="h-16 w-16 shrink-0 rounded-[1.1rem] border border-[rgba(var(--ml-border),0.7)] bg-white object-cover shadow-sm md:h-20 md:w-20 md:rounded-[1.35rem]" />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.1rem] border border-[rgba(var(--ml-border),0.7)] bg-white text-sm text-slate-500 shadow-sm md:h-20 md:w-20 md:rounded-[1.35rem]">Logo</div>
                        )}

                        <div className="min-w-0">
                          <h1 className={`${displayFont.className} text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl md:text-5xl`}>{p.businessName}</h1>
                          {p.tagline ? <p className="mt-3 max-w-3xl text-lg leading-tight tracking-[-0.03em] text-slate-800 sm:text-xl md:text-[1.75rem]">{p.tagline}</p> : null}
                          {p.shortDescription || p.overview ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base md:leading-8">{p.shortDescription || p.overview}</p> : null}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <a className="ml-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white" href={`mailto:${p.email}`}>
                            Start a conversation
                          </a>
                        {p.websiteUrl ? (
                          <a className="ml-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold" href={p.websiteUrl} target="_blank" rel="noreferrer">
                            Visit website
                          </a>
                        ) : null}
                      </div>

                      {heroServices.length ? (
                        <div className="mt-5">
                          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Core services</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {heroServices.map((service) => (
                            <span key={service} className="ml-pill rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm md:px-4 md:py-2">
                                {formatToken(service)}
                              </span>
                            ))}
                            {heroServicesOverflow > 0 ? (
                      <span className="ml-pill-muted rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm">
                                +{heroServicesOverflow} more
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {fitChips.length ? (
                      <div className="mt-5 hidden flex-wrap gap-2 lg:flex">
                          {fitChips.map((chip) => (
                            <span key={`${chip.group}-${chip.value}`} className="ml-pill rounded-xl px-3 py-1.5 text-xs font-medium">
                              {chip.value}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="ml-dark-panel rounded-[1.75rem] px-5 py-5 text-white shadow-[0_20px_60px_rgba(23,26,31,0.18)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">Quick snapshot</div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {decisionCards.slice(0, 4).map((fact) => (
                          <div key={fact.label} className="rounded-[1.15rem] border border-white/10 bg-white/6 px-4 py-3.5">
                            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">{fact.label}</div>
                            <div className="mt-2 text-base font-semibold text-white">{fact.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border-t ${pageBorder} ${pageSurfaceMuted} px-5 py-5 sm:px-6 sm:py-6 xl:border-l xl:border-t-0 xl:px-7`}>
                <div className="space-y-5">
                  {coverMedia && getMediaPresentation(coverMedia).kind === 'image' ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(var(--ml-border),0.7)] bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverMedia.url} alt={coverMedia.altText || `${p.businessName} cover`} className="h-64 w-full object-cover" />
                    </div>
                  ) : null}

                  <div className="ml-surface rounded-[1.75rem] px-5 py-5 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Contact details</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">Everything a buyer usually checks before they send the first message.</p>
                    <div className="mt-5 space-y-4 text-sm text-slate-700">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Location</div>
                        <div className="mt-2 font-medium text-slate-900">{locationLabel}</div>
                      </div>
                      {p.websiteUrl ? (
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Website</div>
                          <a className="mt-2 inline-block break-all underline text-slate-900" href={p.websiteUrl} target="_blank" rel="noreferrer">
                            {p.websiteUrl}
                          </a>
                        </div>
                      ) : null}
                      {p.phone ? (
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Phone</div>
                          <div className="mt-2 font-medium text-slate-900">{p.phone}</div>
                        </div>
                      ) : null}
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Email</div>
                        <div className="mt-2 break-all font-medium text-slate-900">{p.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {visibleClients.length ? (
            <section className={`rounded-[1.75rem] ${pageSurface} ${pageBorder} border px-6 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}>
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Trusted by</div>
                    <p className="mt-2 text-sm text-slate-700">Representative clients and teams this expert highlights when explaining fit.</p>
                </div>
                <div className="grid gap-x-6 gap-y-4 border-t border-slate-200/80 pt-4 sm:grid-cols-2 xl:grid-cols-3 lg:border-t-0 lg:pt-0">
                  {visibleClients.slice(0, 6).map((client) => (
                    <div key={client.id} className="flex items-center gap-3 border-b border-slate-200/70 pb-4 last:border-b-0">
                      {client.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={client.logoUrl} alt={client.name} className="h-9 w-9 rounded-full border object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-white text-[10px] font-medium text-slate-500">Logo</div>
                      )}
                      <span className="min-w-0 text-sm font-medium text-slate-900">{client.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="min-w-0 space-y-8">
              {selectedWorkSection}

              {(p.shortDescription || p.overview) ? (
                <section className={`rounded-[2rem] ${pageSurface} ${pageBorder} border px-6 py-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]`}>
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">About the team</div>
                  <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                    <div>
                      <h2 className={`${displayFont.className} text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-[2.35rem]`}>How they approach the work.</h2>
                      {p.overview ? (
                        <p className="mt-4 text-sm leading-8 text-slate-700 whitespace-pre-line md:text-base">
                          {p.overview}
                        </p>
                      ) : p.shortDescription ? (
                        <p className="mt-4 text-sm leading-8 text-slate-700 md:text-base">{p.shortDescription}</p>
                      ) : null}
                    </div>
                    <div className={`rounded-[1.25rem] ${pageSurfaceMuted} ${pageBorder} border px-4 py-4 lg:px-5`}>
                      <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Read this for</div>
                      <p className="mt-2 text-sm leading-7 text-slate-700">Positioning, tone, operating style, and whether the team sounds aligned with your type of project.</p>
                    </div>
                  </div>
                </section>
              ) : null}

              {visibleProjects.length ? (
                <section className={`rounded-[2rem] ${pageSurface} ${pageBorder} border px-6 py-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]`}>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Proof of work</div>
                      <h2 className={`${displayFont.className} mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-[2.35rem]`}>Case studies</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700">A more detailed read on the brief, the response, and the outcomes this expert chooses to highlight.</p>
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>{visibleProjects.length} project{visibleProjects.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="mt-6 grid gap-5">
                    {visibleProjects.map((project) => (
                      <article key={project.id} className={`overflow-hidden rounded-[1.75rem] ${pageSurfaceMuted} ${pageBorder} border shadow-sm`}>
                        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
                          {project.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.coverImageUrl} alt={project.title} className="h-64 w-full object-cover lg:h-full" />
                          ) : (
                            <div className="hidden bg-slate-100 lg:block" />
                          )}

                          <div className="px-5 py-5 md:px-6 md:py-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Project snapshot</div>
                                <h3 className={`${displayFont.className} mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>{project.title}</h3>
                                {project.summary ? <p className="mt-3 text-sm leading-7 text-slate-700">{project.summary}</p> : null}
                              </div>
                              {project.isFeatured ? <span className="ml-pill rounded-xl px-3 py-1 text-xs font-medium">Featured</span> : null}
                            </div>

                            {(project.projectBudget || project.startedAt || project.completedAt) ? (
                              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y border-slate-200/80 py-4 text-sm">
                                {project.projectBudget ? (
                                  <div className="min-w-[120px]">
                                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Budget</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(project.projectBudget, p.currencyCode)}</div>
                                  </div>
                                ) : null}
                                {project.startedAt ? (
                                  <div className="min-w-[120px]">
                                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Started</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{new Date(project.startedAt).toLocaleDateString()}</div>
                                  </div>
                                ) : null}
                                {project.completedAt ? (
                                  <div className="min-w-[120px]">
                                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Completed</div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">{new Date(project.completedAt).toLocaleDateString()}</div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                              {project.challenge ? (
                                <div>
                                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Challenge</div>
                                  <p className="mt-2 text-sm leading-7 text-slate-700 whitespace-pre-line">{project.challenge}</p>
                                </div>
                              ) : null}
                              {project.solution ? (
                                <div>
                                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Solution</div>
                                  <p className="mt-2 text-sm leading-7 text-slate-700 whitespace-pre-line">{project.solution}</p>
                                </div>
                              ) : null}
                            </div>

                            {project.results ? (
                              <div className="ml-dark-panel mt-5 rounded-2xl px-4 py-4">
                                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/65">Results</div>
                                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/82">{project.results}</p>
                              </div>
                            ) : null}

                            {project.services?.length ? (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {project.services.map((service) => (
                                  <span key={service} className="ml-pill rounded-xl px-3 py-1 text-xs">
                                    {formatToken(service)}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

            </div>

            <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6">
              <section className="overflow-hidden rounded-[1.75rem] border border-slate-900/85 bg-[#101a2a] shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="border-b border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(148,163,184,0.18),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] px-6 py-6">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Contact this expert</div>
                  <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-white`}>Send your inquiry</h2>
                  {p.status === 'active' ? (
                    <p className="mt-3 text-sm leading-7 text-slate-200/78">Use the form below to ask about availability, fit, pricing, or project scope.</p>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-slate-200/72">Inquiry tools unlock when this expert profile is active.</p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm" href={`mailto:${p.email}`}>
                      Email expert
                    </a>
                    {p.phone ? (
                      <a className="rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold text-white" href={`tel:${p.phone}`}>
                        Call now
                      </a>
                    ) : null}
                    {p.websiteUrl ? (
                      <a className="rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold text-white" href={p.websiteUrl} target="_blank" rel="noreferrer">
                        Visit website
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="px-6 py-6">
                  {p.status === 'active' ? <InquiryForm providerSlug={p.slug} /> : <div className="text-sm text-slate-600">Contact form will be available once this expert profile is active.</div>}
                </div>
              </section>

              {(p.industries?.length || p.languages?.length || p.clientSizes?.length || p.specialties?.length || p.remoteFriendly || p.servesNationwide || p.responseTimeHours) ? (
                <section className={`rounded-[1.75rem] ${pageSurface} ${pageBorder} border px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left md:hidden"
                    onClick={() => setFitOpen((value) => !value)}
                    aria-expanded={fitOpen}
                  >
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Team fit</div>
                      <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>At a glance</h2>
                    </div>
                    <span className="ml-pill rounded-xl px-4 py-2 text-sm font-medium">
                      {fitOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  <div className="hidden md:block">
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Team fit</div>
                    <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>At a glance</h2>
                  </div>
                  <div className={`${fitOpen ? 'mt-5 block' : 'hidden'} space-y-5 md:mt-5 md:block`}>
                    {p.industries?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Industries</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.industries.map((s) => (
                            <span key={s} className="ml-pill rounded-xl px-3 py-1 text-xs">{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.languages?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Languages</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.languages.map((s) => (
                            <span key={s} className="ml-pill rounded-xl px-3 py-1 text-xs">{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.clientSizes?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Client sizes</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.clientSizes.map((s) => (
                            <span key={s} className="ml-pill rounded-xl px-3 py-1 text-xs">{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.specialties?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Specialties</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.specialties.map((s) => (
                            <span key={s} className="ml-pill rounded-xl px-3 py-1 text-xs">{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {(p.remoteFriendly || p.servesNationwide || p.responseTimeHours) ? (
                      <div className={`rounded-2xl ${pageSurfaceMuted} ${pageBorder} border px-4 py-4`}>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Working model</div>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          {p.remoteFriendly ? <div>Remote-friendly engagement model</div> : null}
                          {p.servesNationwide ? <div>Available for nationwide work</div> : null}
                          {p.responseTimeHours ? <div>Usually replies within {p.responseTimeHours} hours</div> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {(visibleCertifications.length || visibleAwards.length) ? (
                <section className={`rounded-[1.75rem] ${pageSurface} ${pageBorder} border px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left md:hidden"
                    onClick={() => setCredentialsOpen((value) => !value)}
                    aria-expanded={credentialsOpen}
                  >
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Signals</div>
                      <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>Credentials</h2>
                    </div>
                    <span className="ml-pill rounded-xl px-4 py-2 text-sm font-medium">
                      {credentialsOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  <div className="hidden md:block">
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Signals</div>
                    <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>Credentials</h2>
                  </div>
                  <div className={`${credentialsOpen ? 'mt-4 block' : 'hidden'} space-y-4 md:mt-4 md:block`}>
                    {visibleCertifications.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Certifications</div>
                        <div className="mt-3 divide-y divide-slate-200/80">
                          {visibleCertifications.map((item) => (
                            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex items-start gap-3">
                                {item.badgeImageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.badgeImageUrl} alt={item.title} className="h-11 w-11 rounded-xl border object-cover" />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white text-[11px] font-medium text-slate-500">Cert</div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                  <div className={`mt-1 text-xs ${t.mutedText}`}>
                                    {item.issuer}{item.year ? ` • ${item.year}` : ''}
                                  </div>
                                  {item.url ? (
                                    <a className="mt-2 inline-block text-xs font-medium underline text-slate-700" href={item.url} target="_blank" rel="noreferrer">
                                      View credential
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {visibleAwards.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Awards</div>
                        <div className="mt-3 divide-y divide-slate-200/80">
                          {visibleAwards.map((item) => (
                            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex items-start gap-3">
                                {item.badgeImageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.badgeImageUrl} alt={item.title} className="h-11 w-11 rounded-xl border object-cover" />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white text-[11px] font-medium text-slate-500">Award</div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                  <div className={`mt-1 text-xs ${t.mutedText}`}>
                                    {item.issuer}{item.year ? ` • ${item.year}` : ''}
                                  </div>
                                  {item.url ? (
                                    <a className="mt-2 inline-block text-xs font-medium underline text-slate-700" href={item.url} target="_blank" rel="noreferrer">
                                      View award
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className={`rounded-[1.75rem] ${pageSurface} ${pageBorder} border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 text-left md:hidden"
                  onClick={() => setContactOpen((value) => !value)}
                  aria-expanded={contactOpen}
                >
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Contact</div>
                    <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>Reach out</h2>
                  </div>
                    <span className="ml-pill rounded-xl px-4 py-2 text-sm font-medium">
                      {contactOpen ? 'Hide' : 'Show'}
                    </span>
                </button>
                <div className="hidden md:block">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Contact</div>
                  <h2 className={`${displayFont.className} mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-900`}>Reach out</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-700">Use these details if you want to contact the expert directly outside the inquiry flow.</p>
                </div>

                <div className={`${contactOpen ? 'mt-5 block' : 'hidden'} space-y-4 md:mt-5 md:block`}>
                  <p className="text-sm leading-7 text-slate-700 md:hidden">Use these details if you want to contact the expert directly outside the inquiry flow.</p>
                  <div className={`rounded-2xl ${pageSurfaceMuted} ${pageBorder} border p-4 shadow-sm`}>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Location</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{locationLabel}</div>
                    {p.zip ? <div className="mt-1 text-sm text-slate-600">ZIP {p.zip}</div> : null}
                  </div>

                  <div className={`rounded-2xl ${pageSurfaceMuted} ${pageBorder} border p-4 shadow-sm`}>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Email</div>
                    <div className="mt-2 break-all text-sm text-slate-900">{p.email}</div>
                    {p.phone ? (
                      <>
                        <div className={`mt-4 text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Phone</div>
                        <div className="mt-2 text-sm text-slate-900">{p.phone}</div>
                      </>
                    ) : null}
                    {p.websiteUrl ? (
                      <>
                        <div className={`mt-4 text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Website</div>
                        <a className="mt-2 block break-all text-sm underline text-slate-900" href={p.websiteUrl} target="_blank" rel="noreferrer">
                          {p.websiteUrl}
                        </a>
                      </>
                    ) : null}
                    {(p.linkedinUrl || p.instagramUrl || p.facebookUrl) ? (
                      <>
                        <div className={`mt-4 text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Social</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          {p.linkedinUrl ? <a className="ml-pill rounded-xl px-3 py-1 text-xs font-medium" href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                          {p.instagramUrl ? <a className="ml-pill rounded-xl px-3 py-1 text-xs font-medium" href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
                          {p.facebookUrl ? <a className="ml-pill rounded-xl px-3 py-1 text-xs font-medium" href={p.facebookUrl} target="_blank" rel="noreferrer">Facebook</a> : null}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className={`overflow-hidden rounded-2xl ${pageSurfaceMuted} ${pageBorder} border shadow-sm`}>
                    <iframe
                      src={mapEmbedSrc}
                      title={`${p.businessName} location map`}
                      className="h-56 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}



