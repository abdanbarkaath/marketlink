'use client';

import React, { useEffect, useState, use } from 'react';
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
  params: { slug: string };
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

function getYouTubeEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  let id = '';

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || '';
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
    if (url.pathname.startsWith('/shorts/')) id = url.pathname.split('/')[2] || '';
    if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/')[2] || '';
  }

  return id ? `https://www.youtube.com/embed/${id}` : null;
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

  const embedUrl = getYouTubeEmbed(url) || getInstagramEmbed(url);
  if (embedUrl) {
    const label = embedUrl.includes('instagram.com') ? 'Instagram embed' : 'YouTube embed';
    return { kind: 'embed', src: embedUrl, label };
  }

  const instagramProfile = getInstagramProfile(url);
  if (instagramProfile) {
    return { kind: 'instagramProfile', href: instagramProfile.href, handle: instagramProfile.handle };
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
  const resolvedParams = use(params);
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
          throw new Error(`Failed to load provider: ${res.status}`);
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
  const featuredProjects = (p.projects || []).filter((project) => project.isFeatured);
  const visibleProjects = featuredProjects.length ? featuredProjects : p.projects || [];
  const featuredClients = (p.clients || []).filter((client) => client.isFeatured);
  const visibleClients = featuredClients.length ? featuredClients : p.clients || [];
  const visibleCertifications = p.certifications || [];
  const visibleAwards = p.awards || [];
  const visibleMedia = (p.media || []).filter((item) => item.type !== 'logo');
  const coverMedia = visibleMedia.find((item) => item.type === 'cover') || visibleMedia.find((item) => getMediaPresentation(item).kind === 'image') || null;
  const hourlyRange = formatMoneyRange(p.hourlyRateMin, p.hourlyRateMax, p.currencyCode, ' / hr');
  const startingBudget = formatMoney(p.minProjectBudget, p.currencyCode);
  const locationLabel = formatLocation(p.city, p.state, p.zip);
  const mapEmbedSrc = `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(locationLabel)}&t=&z=11&ie=UTF8&iwloc=B&output=embed`;
  const quickFacts = [
    hourlyRange ? { label: 'Hourly range', value: hourlyRange } : null,
    startingBudget ? { label: 'Starting budget', value: `${startingBudget}+` } : null,
    p.responseTimeHours ? { label: 'Response time', value: `${p.responseTimeHours}h` } : null,
    p.foundedYear ? { label: 'Founded', value: String(p.foundedYear) } : null,
    p.rating ? { label: 'Rating', value: `${p.rating.toFixed(1)} / 5` } : null,
    p.servesNationwide ? { label: 'Coverage', value: 'Nationwide' } : p.remoteFriendly ? { label: 'Coverage', value: 'Remote available' } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const mediaGallerySection = visibleMedia.length ? (
    <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
      <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>Media gallery</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {visibleMedia.map((item) => {
          const media = getMediaPresentation(item);

          return (
            <div key={item.id} className={`overflow-hidden rounded-3xl ${t.surfaceMuted} ${t.border} border shadow-sm ${media.kind === 'website' ? 'sm:col-span-2' : ''}`}>
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
                  <div className="border-t p-4">
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
                  <img src={media.src} alt={item.altText || 'Provider media'} className="h-56 w-full object-cover" />
                  {item.altText ? <div className="p-4 text-sm leading-7 text-slate-700">{item.altText}</div> : null}
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
                  <div className="border-t p-4">
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
                <div className="p-5">
                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Instagram profile</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{media.handle}</div>
                  {item.altText ? <p className="mt-3 text-sm leading-7 text-slate-700">{item.altText}</p> : null}
                  <a className="mt-4 inline-block text-sm font-medium underline text-slate-900" href={media.href} target="_blank" rel="noreferrer">
                    Open on Instagram
                  </a>
                </div>
              ) : null}

              {media.kind === 'link' ? (
                <div className="p-4">
                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>External media</div>
                  <a className="mt-2 block break-all text-sm underline text-slate-900" href={media.href} target="_blank" rel="noreferrer">
                    {media.href}
                  </a>
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8">
          {p.status !== 'active' && (
            <div className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4 shadow-[0_14px_45px_rgba(2,6,23,0.08)]`}>
              <div className="font-medium text-amber-900">{p.status === 'disabled' ? 'Your listing is disabled' : 'Your listing is pending approval'}</div>
              {p.disabledReason && (
                <div className="mt-1 text-sm text-amber-800">
                  <span className="font-medium">Reason:</span> {p.disabledReason}
                </div>
              )}
              <div className="mt-2 text-xs text-amber-800">Only you can see this until it&apos;s active.</div>
            </div>
          )}

          <header className={`overflow-hidden rounded-[2rem] ${t.surface} ${t.border} border shadow-[0_24px_80px_rgba(2,6,23,0.10)] backdrop-blur`}>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
              <div className="relative overflow-hidden p-6 md:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(20,184,166,0.18),transparent_55%),radial-gradient(70%_70%_at_100%_0%,rgba(56,189,248,0.16),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.78))]" />
                {coverMedia && getMediaPresentation(coverMedia).kind === 'image' ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverMedia.url} alt={coverMedia.altText || `${p.businessName} cover`} className="absolute inset-y-0 right-0 hidden h-full w-[44%] object-cover opacity-20 lg:block" />
                    <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-gradient-to-r from-white/95 via-white/40 to-transparent lg:block" />
                  </>
                ) : null}

                <div className="relative">
                  <div className="flex items-start gap-4">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo} alt={p.businessName} className="h-16 w-16 rounded-2xl border object-cover shadow-sm md:h-20 md:w-20" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-gray-50 text-sm text-gray-400 shadow-sm md:h-20 md:w-20">Logo</div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border ${t.border} bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>
                          {p.verified ? 'Verified provider' : 'Marketplace provider'}
                        </span>
                        {p.rating ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                            {p.rating.toFixed(1)} rating
                          </span>
                        ) : null}
                      </div>
                      <h1 className={`${displayFont.className} mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl`}>{p.businessName}</h1>
                      <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${t.mutedText}`}>
                        <span>{locationLabel}</span>
                        {p.foundedYear ? <span>Founded {p.foundedYear}</span> : null}
                      </div>
                      {p.tagline ? <div className="mt-4 max-w-3xl text-xl leading-8 text-slate-700">{p.tagline}</div> : null}
                      {p.shortDescription ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 md:text-base">{p.shortDescription}</p> : null}
                    </div>
                  </div>

                  {p.services.length ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {p.services.map((service) => (
                        <span key={service} className={`rounded-full border ${t.border} bg-white/80 px-3 py-1.5 text-xs font-medium ${t.mutedText} shadow-sm`}>
                          {formatToken(service)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {(visibleCertifications.length || visibleAwards.length) ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {visibleCertifications.length ? (
                        <div className={`rounded-2xl border ${t.border} bg-white/80 px-4 py-3 shadow-sm`}>
                          <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Certifications</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{visibleCertifications.length} active credential{visibleCertifications.length === 1 ? '' : 's'}</div>
                        </div>
                      ) : null}
                      {visibleAwards.length ? (
                        <div className={`rounded-2xl border ${t.border} bg-white/80 px-4 py-3 shadow-sm`}>
                          <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Awards</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{visibleAwards.length} recognition{visibleAwards.length === 1 ? '' : 's'}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {(p.industries?.length || p.specialties?.length) ? (
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                      {p.industries?.length ? (
                        <div>
                          <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Industries served</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.industries.map((industry) => (
                              <span key={industry} className={`rounded-full border ${t.border} bg-white/75 px-3 py-1 text-xs ${t.mutedText}`}>
                                {formatToken(industry)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {p.specialties?.length ? (
                        <div>
                          <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Specialties</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.specialties.map((specialty) => (
                              <span key={specialty} className={`rounded-full border ${t.border} bg-white/75 px-3 py-1 text-xs ${t.mutedText}`}>
                                {formatToken(specialty)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col justify-between border-t border-slate-200/70 bg-slate-950/[0.03] p-6 lg:border-l lg:border-t-0 lg:p-8">
                {quickFacts.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {quickFacts.map((fact) => (
                      <div key={fact.label} className={`rounded-2xl ${t.surface} ${t.border} border p-4 shadow-sm`}>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>{fact.label}</div>
                        <div className="mt-3 text-sm font-semibold leading-6 text-slate-900">{fact.value}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className={`mt-6 rounded-3xl ${t.surface} ${t.border} border p-5 shadow-sm`}>
                  <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Quick contact</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Website</div>
                      {p.websiteUrl ? (
                        <a className="mt-1 inline-block break-all underline text-slate-900" href={p.websiteUrl} target="_blank" rel="noreferrer">
                          {p.websiteUrl}
                        </a>
                      ) : (
                        <div className="mt-1 text-slate-500">Not provided</div>
                      )}
                    </div>
                    {p.phone ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Phone</div>
                        <div className="mt-1 text-slate-900">{p.phone}</div>
                      </div>
                    ) : null}
                    {(p.linkedinUrl || p.instagramUrl || p.facebookUrl) ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Social</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.linkedinUrl ? (
                            <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.linkedinUrl} target="_blank" rel="noreferrer">
                              LinkedIn
                            </a>
                          ) : null}
                          {p.instagramUrl ? (
                            <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.instagramUrl} target="_blank" rel="noreferrer">
                              Instagram
                            </a>
                          ) : null}
                          {p.facebookUrl ? (
                            <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.facebookUrl} target="_blank" rel="noreferrer">
                              Facebook
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_340px] xl:items-start">
            <div className="flex min-w-0 flex-col gap-8">
              {mediaGallerySection}

              {(p.shortDescription || p.overview) ? (
                <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                  <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>About</h2>
                  {p.overview ? <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-line md:text-base">{p.overview}</p> : p.shortDescription ? <p className="mt-4 text-sm leading-7 text-slate-700 md:text-base">{p.shortDescription}</p> : null}
                </section>
              ) : null}

              {visibleProjects.length ? (
                <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>Case studies</h2>
                    <span className={`text-xs ${t.mutedText}`}>{visibleProjects.length} project{visibleProjects.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {visibleProjects.map((project) => (
                      <article key={project.id} className={`overflow-hidden rounded-3xl ${t.surfaceMuted} ${t.border} border shadow-sm`}>
                        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                          {project.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.coverImageUrl} alt={project.title} className="h-56 w-full object-cover lg:h-full" />
                          ) : (
                            <div className="hidden bg-slate-100 lg:block" />
                          )}

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className={`${displayFont.className} text-xl font-semibold tracking-[-0.02em] text-slate-900`}>{project.title}</h3>
                                {project.summary ? <p className="mt-3 text-sm leading-7 text-slate-700">{project.summary}</p> : null}
                              </div>
                              {project.isFeatured ? <span className="rounded-full border px-3 py-1 text-xs font-medium text-slate-700">Featured</span> : null}
                            </div>

                            {(project.projectBudget || project.startedAt || project.completedAt) ? (
                              <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {project.projectBudget ? (
                                  <div className="rounded-2xl border p-3">
                                    <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Budget</div>
                                    <div className="mt-2 text-sm text-slate-900">{formatMoney(project.projectBudget, p.currencyCode)}</div>
                                  </div>
                                ) : null}
                                {project.startedAt ? (
                                  <div className="rounded-2xl border p-3">
                                    <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Started</div>
                                    <div className="mt-2 text-sm text-slate-900">{new Date(project.startedAt).toLocaleDateString()}</div>
                                  </div>
                                ) : null}
                                {project.completedAt ? (
                                  <div className="rounded-2xl border p-3">
                                    <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Completed</div>
                                    <div className="mt-2 text-sm text-slate-900">{new Date(project.completedAt).toLocaleDateString()}</div>
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
                              <div className="mt-5 rounded-2xl bg-white/75 p-4">
                                <div className={`text-xs font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Results</div>
                                <p className="mt-2 text-sm leading-7 text-slate-700 whitespace-pre-line">{project.results}</p>
                              </div>
                            ) : null}

                            {project.services?.length ? (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {project.services.map((service) => (
                                  <span key={service} className={`rounded-full border ${t.border} px-3 py-1 text-xs ${t.mutedText}`}>
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

            <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-0">
              {(p.industries?.length || p.languages?.length || p.clientSizes?.length || p.specialties?.length || p.remoteFriendly || p.servesNationwide || p.responseTimeHours) ? (
                <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                  <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>At a glance</h2>
                  <div className="mt-5 space-y-5">
                    {p.industries?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Industries</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.industries.map((s) => (
                            <span key={s} className={`rounded-full border ${t.border} px-3 py-1 text-xs ${t.mutedText}`}>{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.languages?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Languages</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.languages.map((s) => (
                            <span key={s} className={`rounded-full border ${t.border} px-3 py-1 text-xs ${t.mutedText}`}>{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.clientSizes?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Client sizes</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.clientSizes.map((s) => (
                            <span key={s} className={`rounded-full border ${t.border} px-3 py-1 text-xs ${t.mutedText}`}>{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {p.specialties?.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Specialties</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.specialties.map((s) => (
                            <span key={s} className={`rounded-full border ${t.border} px-3 py-1 text-xs ${t.mutedText}`}>{formatToken(s)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {(p.remoteFriendly || p.servesNationwide || p.responseTimeHours) ? (
                      <div className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4`}>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Coverage</div>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          {p.remoteFriendly ? <div>Remote friendly engagement model</div> : null}
                          {p.servesNationwide ? <div>Available for nationwide work</div> : null}
                          {p.responseTimeHours ? <div>Usually replies within {p.responseTimeHours} hours</div> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {visibleClients.length ? (
                <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>Featured clients</h2>
                    <span className={`text-xs ${t.mutedText}`}>{visibleClients.length}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {visibleClients.map((client) => (
                      <div key={client.id} className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4`}>
                        <div className="flex items-center gap-3">
                          {client.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={client.logoUrl} alt={client.name} className="h-11 w-11 rounded-xl border object-cover" />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white text-[11px] font-medium text-slate-500">Logo</div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{client.name}</div>
                            {client.websiteUrl ? (
                              <a className="mt-1 block truncate text-xs underline text-slate-700" href={client.websiteUrl} target="_blank" rel="noreferrer">
                                {client.websiteUrl}
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {(visibleCertifications.length || visibleAwards.length) ? (
                <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                  <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>Credentials</h2>
                  <div className="mt-4 space-y-4">
                    {visibleCertifications.length ? (
                      <div>
                        <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Certifications</div>
                        <div className="mt-3 space-y-3">
                          {visibleCertifications.map((item) => (
                            <div key={item.id} className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4`}>
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
                        <div className="mt-3 space-y-3">
                          {visibleAwards.map((item) => (
                            <div key={item.id} className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4`}>
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

              <section className={`rounded-2xl ${t.surface} ${t.border} border p-6 shadow-[0_14px_45px_rgba(2,6,23,0.08)] backdrop-blur`}>
                <div className="flex items-center justify-between">
                  <h2 className={`${displayFont.className} text-lg font-semibold tracking-[-0.02em] text-slate-900`}>Contact</h2>
                  {p.status !== 'active' ? <span className={`text-sm ${t.mutedText}`}>Available when active</span> : null}
                </div>

                <div className="mt-5 space-y-4">
                  <div className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4 shadow-sm`}>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.18em] ${t.mutedText}`}>Location</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{locationLabel}</div>
                    {p.zip ? <div className="mt-1 text-sm text-slate-600">ZIP {p.zip}</div> : null}
                  </div>

                  <div className={`rounded-2xl ${t.surfaceMuted} ${t.border} border p-4 shadow-sm`}>
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
                          {p.linkedinUrl ? <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                          {p.instagramUrl ? <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
                          {p.facebookUrl ? <a className={`rounded-full border ${t.border} px-3 py-1 text-xs font-medium text-slate-700`} href={p.facebookUrl} target="_blank" rel="noreferrer">Facebook</a> : null}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className={`overflow-hidden rounded-2xl ${t.surfaceMuted} ${t.border} border shadow-sm`}>
                    <iframe
                      src={mapEmbedSrc}
                      title={`${p.businessName} location map`}
                      className="h-56 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  {p.status === 'active' ? <InquiryForm providerSlug={p.slug} /> : <div className={`text-sm ${t.mutedText}`}>Contact form will be available once this listing is active.</div>}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
