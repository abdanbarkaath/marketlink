'use client';

/* eslint-disable @next/next/no-img-element -- Provider media can come from arbitrary external hosts. */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import InquiryForm from '../../providers/[slug]/InquiryForm';
import ProviderNotFound from '../../providers/[slug]/not-found';
import ExpertProfileMap from '../../../components/ExpertProfileMap';
import { marketingSubjects } from '../../../lib/marketingTaxonomy';
import './profile.css';
import { getGroupedServicesForExpert, getUnmatchedServiceTokensForExpert, type GroupedExpertServiceSubject } from '../../../lib/marketingTaxonomy';

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  email: string;
  expertType?: 'agency' | 'freelancer' | 'creator' | 'specialist' | null;
  locationPrecision?: 'exact' | 'approximate' | null;
  tagline: string | null;
  shortDescription?: string | null;
  overview?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  creatorPlatforms?: string[];
  creatorAudienceSize?: number | null;
  creatorProofSummary?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
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

type InstagramEmbedWindow = Window & {
  instgrm?: {
    Embeds?: {
      process: () => void;
    };
  };
};

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

function formatExpertTypeLabel(expertType: Provider['expertType']) {
  switch (expertType) {
    case 'agency':
      return 'Agency';
    case 'freelancer':
      return 'Freelancer';
    case 'creator':
      return 'Creator';
    case 'specialist':
      return 'Specialist';
    default:
      return 'Expert';
  }
}

function formatAudienceSize(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
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

function formatPublishedDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
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

function LinkIcon({ kind }: { kind: 'website' | 'linkedin' | 'instagram' | 'facebook' }) {
  const baseClass = 'h-4 w-4 shrink-0';

  switch (kind) {
    case 'website':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5c2.5 2.4 3.9 5.3 3.9 8.5S14.5 18.1 12 20.5c-2.5-2.4-3.9-5.3-3.9-8.5S9.5 5.9 12 3.5Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={baseClass} aria-hidden="true">
          <path d="M6.2 8.1A1.9 1.9 0 1 0 6.2 4.3a1.9 1.9 0 0 0 0 3.8Zm-1.6 2.1h3.3V20H4.6v-9.8Zm5.3 0h3.2v1.4h.1c.5-.9 1.7-1.8 3.6-1.8 3.8 0 4.5 2.4 4.5 5.6V20H18v-4.1c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V20H9.9v-9.8Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={baseClass} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.7" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={baseClass} aria-hidden="true">
          <path d="M13.4 20v-6h2.1l.3-2.4h-2.4v-1.5c0-.7.2-1.2 1.2-1.2h1.3V6.8c-.2 0-.9-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2.3v6h2.1Z" />
        </svg>
      );
  }
}

export default function ProviderPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      setMissing(false);
      setError(null);
      setProvider(null);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        const res = await fetch(`${API_BASE}/experts/${resolvedParams.slug}`);
        if (res.status === 404) {
          setMissing(true);
          return;
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

  if (missing) {
    return <ProviderNotFound />;
  }

  if (error || !provider) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Error: {error}
    </div>;
  }

  return <ProviderPageContent provider={provider} />;
}

function ProviderPageContent({ provider: p }: { provider: Provider }) {
  const [instagramSlide, setInstagramSlide] = useState(0);
  useEffect(() => setInstagramSlide(0), [p.slug]);
  const projects = p.projects || [];
  const clients = p.clients || [];
  const reviews = p.reviews || [];
  const credentials = [...(p.certifications || []).map(item => ({ ...item, kind: 'Certification' })), ...(p.awards || []).map(item => ({ ...item, kind: 'Award' }))];
  const media = (p.media || []).filter(item => item.type !== 'logo');
  const instagramPosts = media.filter(item => getMediaPresentation(item).kind === 'embed');
  const gallery = media.filter(item => !['embed', 'instagramProfile'].includes(getMediaPresentation(item).kind));
  const cover = gallery.find(item => item.type === 'cover' && getMediaPresentation(item).kind === 'image') || gallery.find(item => getMediaPresentation(item).kind === 'image');
  const instagramProfile = p.instagramUrl ? getInstagramProfile(parseUrl(p.instagramUrl) ?? new URL('https://instagram.com')) : null;
  const activePost = instagramPosts[instagramSlide % instagramPosts.length];
  const activePostMedia = activePost ? getMediaPresentation(activePost) : null;
  const hourlyRange = formatMoneyRange(p.hourlyRateMin, p.hourlyRateMax, p.currencyCode, ' / hour');
  const startingBudget = formatMoney(p.minProjectBudget, p.currencyCode);
  const location = formatLocation(p.city, p.state, p.locationPrecision === 'approximate' ? null : p.zip);
  const groupedServices = getGroupedServicesForExpert(p.services) as GroupedExpertServiceSubject[];
  const unmatchedServices = getUnmatchedServiceTokensForExpert(p.services);
  const links = [
    p.websiteUrl ? { href: p.websiteUrl, label: 'Website', kind: 'website' as const } : null,
    p.instagramUrl ? { href: p.instagramUrl, label: 'Instagram', kind: 'instagram' as const } : null,
    p.linkedinUrl ? { href: p.linkedinUrl, label: 'LinkedIn', kind: 'linkedin' as const } : null,
    p.facebookUrl ? { href: p.facebookUrl, label: 'Facebook', kind: 'facebook' as const } : null,
  ].filter(item => item !== null);
  const facts = [
    { label: 'Provider type', value: formatExpertTypeLabel(p.expertType) },
    location ? { label: p.locationPrecision === 'approximate' ? 'Approximate area' : 'Based in', value: location } : null,
    p.industries?.length ? { label: 'Works with', value: p.industries.map(formatToken).join(', ') } : null,
    p.languages?.length ? { label: 'Languages', value: p.languages.map(formatToken).join(', ') } : null,
    (p.remoteFriendly || p.servesNationwide) ? { label: 'Service coverage', value: [p.remoteFriendly ? 'Remote-friendly' : null, p.servesNationwide ? 'Nationwide' : null].filter(Boolean).join(', ') } : null,
    p.foundedYear ? { label: 'Founded', value: String(p.foundedYear) } : null,
    p.clientSizes?.length ? { label: 'Client sizes', value: p.clientSizes.map(formatToken).join(', ') } : null,
    p.specialties?.length ? { label: 'Specialties', value: p.specialties.map(formatToken).join(', ') } : null,
    p.responseTimeHours ? { label: 'Typical response', value: `About ${p.responseTimeHours} hours` } : null,
  ].filter(item => item !== null);
  const audience = formatAudienceSize(p.creatorAudienceSize);
  const hasInstagram = Boolean(instagramProfile || instagramPosts.length);
  const instagramProfileHref = instagramProfile?.href;

  useEffect(() => {
    if (!instagramProfileHref) return;
    const win = window as InstagramEmbedWindow;
    const processEmbeds = () => win.instgrm?.Embeds?.process();
    const existing = document.querySelector('script[data-marketlink-instagram-embed="true"]');
    if (existing) {
      processEmbeds();
      existing.addEventListener('load', processEmbeds);
      return () => existing.removeEventListener('load', processEmbeds);
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.dataset.marketlinkInstagramEmbed = 'true';
    script.addEventListener('load', processEmbeds);
    document.body.appendChild(script);
    return () => script.removeEventListener('load', processEmbeds);
  }, [instagramProfileHref]);

  return (
    <main className="agency-profile">
      <div className="profile-wrap">
        <Link className="profile-back" href="/experts">← Back to marketing teams</Link>
        {p.status !== 'active' ? <div className="profile-notice">
          <strong>
            {p.status === 'disabled' ? 'Your expert profile is disabled' : 'Your expert profile is pending approval'}
          </strong>
          {p.disabledReason ? <p>
            {p.disabledReason}
          </p> : null}<p>Contact tools are available when this profile is active.</p>
        </div> : null}
        <header className="profile-hero">
          <div className="profile-hero-copy">
            <ProfileLogo key={p.logo} name={p.businessName} src={p.logo} />
            <h1>
              {p.businessName}
            </h1>
            <p className="profile-location">
              {formatExpertTypeLabel(p.expertType)}
              {location ? ` · ${location}` : ''}
              {p.verified ? ' · Verified' : ''}
              {typeof p.rating === 'number' ? ` · ${p.rating.toFixed(1)} / 5` : ''}
              {p.locationPrecision === 'approximate' ? ' · Approximate area' : ''}
            </p>
            {p.tagline || p.shortDescription ? <p className="profile-tagline">
              {p.tagline || p.shortDescription}
            </p> : null}
            {groupedServices.length || unmatchedServices.length ? <ul className="profile-tags" aria-label="Main services">
              {[...groupedServices.map(item => item.label), ...unmatchedServices.map(formatToken)].slice(0, 5).map(item => <li key={item}>
                {item}
              </li>)}
            </ul> : null}
            {links.length ? <div className="profile-socials">
              {links.map(link => <a key={link.kind} href={link.href} target="_blank" rel="noreferrer">
                <LinkIcon kind={link.kind} />
                {link.label}<span className="sr-only"> (opens in a new tab)</span>
              </a>)}
            </div> : null}
            {p.status === 'active' ? <a className="profile-contact-button" href="#expert-inquiry-form">Contact {p.businessName}
            </a> : null}
          </div>
          <section className="profile-social-preview" id="profile-instagram" aria-label={hasInstagram ? 'Instagram preview' : 'Agency work preview'}>
            {hasInstagram ? <div className="profile-instagram">
              <div className="profile-instagram-header">
                <LinkIcon kind="instagram" />
                <div>
                  <strong>
                    {instagramProfile?.handle || 'Instagram'}
                  </strong>
                  <span>From {p.businessName}
                  </span>
                </div>
              </div>
              {!instagramProfile && activePostMedia?.kind === 'embed' ? <InstagramPostPreview key={activePost.id} src={activePostMedia.src} title={activePost.altText || 'Instagram post'} /> : instagramProfile ? <div className="profile-instagram-embed">
                <blockquote className="instagram-media" data-instgrm-permalink={instagramProfile.href} data-instgrm-version="14" style={{ margin: 0, width: '100%', minWidth: 0, border: 0, boxShadow: 'none' }}>
                  <a href={instagramProfile.href} target="_blank" rel="noreferrer">View {instagramProfile.handle} on Instagram</a>
                </blockquote>
              </div> : null}
              {!instagramProfile && instagramPosts.length > 1 ? <div className="profile-carousel" aria-label="Instagram posts">
                <button type="button" aria-label="Previous Instagram post" onClick={() => setInstagramSlide(current => (current - 1 + instagramPosts.length) % instagramPosts.length)}>Previous</button>
                <span aria-live="polite">
                  {instagramSlide + 1} of {instagramPosts.length}
                </span>
                <button type="button" aria-label="Next Instagram post" onClick={() => setInstagramSlide(current => (current + 1) % instagramPosts.length)}>Next</button>
              </div> : null}
              <div className="profile-instagram-footer">
                <p>Instagram previews may be blocked by your browser.</p>
                <a href={instagramProfile?.href || activePost?.url} target="_blank" rel="noreferrer">Open on Instagram</a>
              </div>
            </div> : cover ? <img className="profile-cover" src={cover.url} alt={cover.altText || `${p.businessName} work`} /> : <div className="profile-no-preview">
              <LinkIcon kind="instagram" />
              <h2>No Instagram preview yet</h2>
              <p>This provider has not added Instagram content. Explore their services and work below.</p>
            </div>}
          </section>
        </header>
      </div>
      <nav className="profile-section-nav" aria-label="Profile sections">
        <div className="profile-wrap">
          <a href="#profile-overview">Overview</a>
          <a href="#profile-services">Services</a>
          <a href="#profile-work">Work</a>
          {hasInstagram ? <a href="#profile-instagram">Instagram</a> : null}<a href="#profile-details">Details</a>
          <a href="#profile-reviews">Reviews</a>
        </div>
      </nav>
      <div className="profile-content profile-wrap">
        <div className="profile-main">
          <section id="profile-overview">
            <h2>Meet {p.businessName}
            </h2>
            {p.shortDescription || p.tagline ? <p className="profile-overview-lead">
              {p.shortDescription || p.tagline}
            </p> : null}
            {p.overview ? <p className="profile-about">
              {p.overview}
            </p> : !p.shortDescription && !p.tagline ? <p className="profile-about">This provider has not added an introduction yet. Review their listed services and business details below.</p> : null}
            <dl className="profile-overview-facts">
              {facts.slice(0, 4).map(fact => <div key={fact.label}>
                <dt>
                  {fact.label}
                </dt>
                <dd>
                  {fact.value}
                </dd>
              </div>)}
            </dl>
            {clients.length ? <div className="profile-clients">
              <p>Clients listed by this provider</p>
              <ul>
                {clients.map(client => <li key={client.id}>
                  {client.websiteUrl ? <a href={client.websiteUrl} target="_blank" rel="noreferrer">
                    {client.logoUrl ? <img src={client.logoUrl} alt="" /> : null}
                    {client.name}
                  </a> : <>
                    {client.logoUrl ? <img src={client.logoUrl} alt="" /> : null}
                    {client.name}
                  </>}
                </li>)}
              </ul>
            </div> : null}
            {p.expertType === 'creator' && (p.creatorProofSummary || p.creatorPlatforms?.length || audience) ? <div className="profile-creator">
              <h3>Creator profile</h3>
              {p.creatorProofSummary ? <p>
                {p.creatorProofSummary}
              </p> : null}
              {p.creatorPlatforms?.length ? <p>Platforms: {p.creatorPlatforms.join(', ')}
              </p> : null}
              {audience ? <p>Reported audience: {audience}
              </p> : null}
            </div> : null}
          </section>
          <section id="profile-services">
            <h2>What can they help you with?</h2>
            <p className="profile-section-intro">Explore their listed services. Confirm the deliverables, timeline and costs directly with the provider.</p>
            <div className="profile-service-menu">
              {groupedServices.map(subject => <article className="profile-service-row" key={subject.id}>
                <div>
                  <h3>
                    {subject.label}
                  </h3>
                  <p>
                    {marketingSubjects.find(item => item.id === subject.id)?.buyerLabel}
                  </p>
                </div>
                <ul>
                  {subject.subcategories.map(subcategory => <li key={subcategory.id}>
                    {subcategory.label}
                    {subcategory.deliverables.length ? <span>
                      {subcategory.deliverables.map(item => item.label).join(', ')}
                    </span> : null}
                  </li>)}
                </ul>
              </article>)}
              {unmatchedServices.length ? <article className="profile-service-row">
                <div>
                  <h3>Other services</h3>
                  <p>Additional services listed by this provider.</p>
                </div>
                <ul>
                  {unmatchedServices.map(service => <li key={service}>
                    {formatToken(service)}
                  </li>)}
                </ul>
              </article> : null}
            </div>
            {!groupedServices.length && !unmatchedServices.length ? <p className="profile-empty">This provider has not listed services yet.</p> : null}
          </section>
          <section id="profile-work">
            <h2>Selected work</h2>
            <p className="profile-section-intro">Review the brief, the work delivered and the provider’s reported results.</p>
            {projects.length ? <div className="profile-projects">
              {projects.map(project => <article className="profile-project" key={project.id}>
                {project.coverImageUrl ? <img src={project.coverImageUrl} alt={project.title} loading="lazy" /> : null}<div className="profile-project-body">
                  <h3>
                    {project.title}
                  </h3>
                  {project.summary ? <p>
                    {project.summary}
                  </p> : null}<ul className="profile-tags">
                    {project.services.map(service => <li key={service}>
                      {formatToken(service)}
                    </li>)}
                  </ul>
                  {project.challenge || project.solution || project.results || project.projectBudget != null || project.startedAt || project.completedAt ? <details>
                    <summary>Explore project</summary>
                    <dl>
                      {[{ label: 'Challenge', value: project.challenge }, { label: 'The work', value: project.solution }, { label: 'Reported results', value: project.results }, { label: 'Project budget', value: formatMoney(project.projectBudget, p.currencyCode) }, { label: 'Started', value: formatPublishedDate(project.startedAt) }, { label: 'Completed', value: formatPublishedDate(project.completedAt) }].filter(item => item.value).map(item => <div key={item.label}>
                        <dt>
                          {item.label}
                        </dt>
                        <dd>
                          {item.value}
                        </dd>
                      </div>)}
                    </dl>
                  </details> : null}
                </div>
              </article>)}
            </div> : null}
            {gallery.length ? <div className="profile-gallery">
              {gallery.map(item => <ProfileMedia key={item.id} item={item} />)}
            </div> : null}
            {!projects.length && !gallery.length ? <p className="profile-empty">No projects or work samples have been added yet.</p> : null}
          </section>
          <section id="profile-details">
            <h2>Business details</h2>
            <dl className="profile-details">
              {facts.map(fact => <div key={fact.label}>
                <dt>
                  {fact.label}
                </dt>
                <dd>
                  {fact.value}
                </dd>
              </div>)}
            </dl>
          </section>
          <section id="profile-reviews">
            <h2>Reviews &amp; credentials</h2>
            {reviews.length ? <div className="profile-reviews">
              {reviews.map(review => <article key={review.id} className="profile-review">
                <div className="profile-review-heading">
                  <h3>
                    {review.title || `Review from ${review.reviewerName}`}
                  </h3>
                  <strong>
                    {review.rating.toFixed(1)} / 5</strong>
                </div>
                <p>
                  {review.body}
                </p>
                <p className="profile-review-by">
                  {review.reviewerName}
                  {review.company ? `, ${review.company}` : ''}
                  {review.verified ? ' · Verified review' : ''}
                </p>
                {review.projectSummary ? <p>
                  {review.projectSummary}
                </p> : null}<dl className="profile-review-ratings">
                  {[{ label: 'Communication', value: review.communicationRating }, { label: 'Quality', value: review.qualityRating }, { label: 'Value', value: review.valueRating }].filter(item => item.value != null).map(item => <div key={item.label}>
                    <dt>
                      {item.label}
                    </dt>
                    <dd>
                      {item.value} / 5</dd>
                  </div>)}
                </dl>
                {review.source || review.publishedAt ? <p className="profile-caption">
                  {[review.source, formatPublishedDate(review.publishedAt)].filter(Boolean).join(' · ')}
                </p> : null}
              </article>)}
            </div> : <p className="profile-empty">No client reviews have been published yet.</p>}
            {credentials.length ? <div className="profile-credentials">
              {credentials.map(item => <article key={`${item.kind}-${item.id}`}>
                {item.badgeImageUrl ? <img src={item.badgeImageUrl} alt="" loading="lazy" /> : null}<div>
                  <h3>
                    {item.title}
                  </h3>
                  <p>
                    {item.kind} · {item.issuer}
                    {item.year ? ` · ${item.year}` : ''}
                  </p>
                  {item.url ? <a href={item.url} target="_blank" rel="noreferrer">View {item.kind.toLowerCase()}
                  </a> : null}
                </div>
              </article>)}
            </div> : null}
          </section>
          <section className="profile-contact-section" id="expert-inquiry-form">
            <h2>Tell the team what you need.</h2>
            <p className="profile-section-intro">Ask about fit, availability, scope or pricing. You arrange work and payment directly with the provider.</p>
            {p.status === 'active' ? <InquiryForm expertSlug={p.slug} /> : <p className="profile-empty">Contact is available once this profile is active.</p>}
          </section>
        </div>
        <aside className="profile-sidebar" aria-label="Pricing and location">
          <section className="profile-pricing">
            <h2>Pricing at a glance</h2>
            <p>A starting point for your budget. Confirm the scope and final quote with the team.</p>
            {startingBudget || hourlyRange ? <dl>
              {startingBudget ? <div>
                <dt>Project minimum</dt>
                <dd>From {startingBudget}
                </dd>
              </div> : null}
              {hourlyRange ? <div>
                <dt>Hourly range</dt>
                <dd>
                  {hourlyRange}
                </dd>
              </div> : null}
            </dl> : <p className="profile-price-empty">Ask the provider for a quote.</p>}<small>Ask about monthly support and additional advertising spend. MarketLink’s provider subscription is separate from your project price.</small>
          </section>
          <section className="profile-location-section">
            <h2>Location &amp; coverage</h2>
            <p>
              {location || 'Location not provided'}
              {p.remoteFriendly ? ' · Remote-friendly' : ''}
              {p.servesNationwide ? ' · Serves nationwide' : ''}
            </p>
            <ExpertProfileMap businessName={p.businessName} locationLabel={location} locationPrecision={p.locationPrecision} latitude={p.latitude} longitude={p.longitude} />
          </section>
        </aside>
      </div>
    </main>
  );
}

function ProfileMedia({ item }: { item: ProviderMediaItem }) {
  const media = getMediaPresentation(item);
  return <figure>
    {media.kind === 'image' ? <img src={media.src} alt={item.altText || 'Provider work sample'} loading="lazy" /> : media.kind === 'website' || media.kind === 'embed' ? <>
      <iframe src={media.src} title={item.altText || (media.kind === 'website' ? media.hostname : media.label)} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" referrerPolicy="strict-origin-when-cross-origin" />
      <a href={item.url} target="_blank" rel="noreferrer">
        {media.kind === 'website' ? 'Open website' : 'Open on Instagram'}
      </a>
    </> : <a href={media.href} target="_blank" rel="noreferrer">
      {media.kind === 'instagramProfile' ? `View ${media.handle}` : media.label}
    </a>}
    {item.altText ? <figcaption>
      {item.altText}
    </figcaption> : null}
  </figure>;
}

function ProfileLogo({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img className="profile-logo" src={src} alt="" onError={() => setFailed(true)} />
  ) : (
    <div className="profile-logo" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</div>
  );
}

function InstagramPostPreview({ src, title }: { src: string; title: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(() => setStatus('unavailable'), 8000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (status === 'unavailable') {
    return <div className="profile-embed-unavailable"><h2>Instagram preview unavailable</h2><p>You can still view the agency’s work using the Instagram link below.</p></div>;
  }
  return <div className="profile-post-preview">
    {status === 'loading' ? <p className="profile-embed-loading" role="status">Loading Instagram preview…</p> : null}
    <iframe src={src} title={title} className="profile-instagram-frame" allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={() => setStatus('ready')} onError={() => setStatus('unavailable')} />
    {status === 'ready' ? <button className="profile-embed-hide" type="button" onClick={() => setStatus('unavailable')}>Preview not displaying?</button> : null}
  </div>;
}
