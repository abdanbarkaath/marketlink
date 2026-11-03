'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ExpertsDiscoveryMap from '@/components/ExpertsDiscoveryMap';
import SearchableSelect from '@/components/SearchableSelect';
import { directoryServices, directoryFilters, directoryShortcuts, directoryShortcutLabels, searchDirectoryServices, providerPricing, serviceLabel, type DirectoryPayload, type DirectoryProvider } from '@/lib/directory';

const typeLabels = { agency: 'Marketing agency', freelancer: 'Freelancer', creator: 'Creator', specialist: 'Marketing specialist' };
const areas = [...new Set(directoryServices.map((service) => service.area))];

type Props = { payload: DirectoryPayload; params: Record<string, string>; error?: string; problemLabel?: string };
export default function ExpertsDirectory({ payload, params, error, problemLabel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(params.skills?.split(',').filter((id) => directoryFilters.some((item) => item.id === id)) || []);
  const [draft, setDraft] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [query, setQuery] = useState(params.q || '');
  const [zip, setZip] = useState(params.zip || '');
  const [radius, setRadius] = useState(params.radius || '10');
  const [agencyName, setAgencyName] = useState(params.name || '');
  const [providerType, setProviderType] = useState(params.expertType || '');
  const [verified, setVerified] = useState(params.verified === '1' || params.verified === 'true');
  const [match, setMatch] = useState(params.match === 'all' ? 'all' : 'any');
  const [compared, setCompared] = useState<string[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [dialogMode, setDialogMode] = useState<'pricing' | 'compare'>('pricing');
  const [compareMessage, setCompareMessage] = useState('');
  const picker = useRef<HTMLDialogElement>(null), dialog = useRef<HTMLDialogElement>(null), allServicesButton = useRef<HTMLButtonElement>(null);
  const filteredServices = searchDirectoryServices(serviceSearch);
  const selectedProviders = payload.data.filter((provider) => compared.includes(provider.id));
  const legacyFilters = Boolean(params.subject || params.service || params.problem || params.subcategory);

  function href(changes: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(params);
    if (resetPage) next.delete('page');
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return `/experts${next.size ? `?${next}` : ''}`;
  }
  function navigate(changes: Record<string, string | undefined>) {
    startTransition(() => router.push(href(changes), { scroll: false }));
  }
  function applyServices(ids: string[], nextMatch = match) {
    setSelected(ids); setSelectedPin(null);
    navigate({ skills: ids.join(','), match: nextMatch, subject: undefined, subcategory: undefined, service: undefined, problem: undefined, q: undefined });
  }
  function openServices() { setDraft([...selected]); setServiceSearch(''); picker.current?.showModal(); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const exact = directoryServices.find((item) => item.label.toLowerCase() === query.trim().toLowerCase());
    const suggestions = searchDirectoryServices(query);
    const service = exact || (query.trim() && suggestions.length === 1 ? suggestions[0] : undefined);
    const ids = service ? [...new Set([...selected, service.id])] : selected;
    setSelected(ids);
    navigate({ zip: zip.trim() || undefined, radius: zip.trim() ? radius : undefined, q: service ? undefined : query.trim() || undefined,
      ...(service ? { skills: ids.join(','), subject: undefined, subcategory: undefined, service: undefined, problem: undefined } : {}),
      name: agencyName.trim() || undefined, expertType: providerType || undefined, verified: verified ? '1' : undefined,
      sort: !zip.trim() && params.sort === 'distance' ? 'newest' : params.sort });
  }
  function toggleCompare(provider: DirectoryProvider, checked: boolean) {
    if (checked && compared.length === 3) { setCompareMessage('Choose up to three teams. Remove one to add another.'); return; }
    setCompared((current) => checked ? [...current, provider.id] : current.filter((id) => id !== provider.id));
    setCompareMessage('');
  }
  function showDialog(mode: 'pricing' | 'compare') { setDialogMode(mode); dialog.current?.showModal(); }
  function serviceOption(service: typeof directoryServices[number]) {
    return <label className="service-option" key={service.id}><input type="checkbox" checked={draft.includes(service.id)} onChange={(event) => {
      const checked = event.target.checked;
      setDraft((current) => checked ? [...current, service.id] : current.filter((id) => id !== service.id));
    }} /><span><strong>{service.label}</strong><span>{service.description}</span>{serviceSearch ? <span>{service.area}</span> : null}</span></label>;
  }

  return <main className="experts-directory" id="main-content" aria-busy={pending}>
    <section className="intro" aria-labelledby="directory-title"><h1 id="directory-title">Find your local marketing team.</h1><p>Search by expertise. Compare your options. Contact the team that fits.</p>
      <form className="search" onSubmit={submit} aria-label="Search marketing providers">
        <SearchableSelect label="What do you need?" placeholder="Try SEO, photography, or email marketing" value={query}
          options={searchDirectoryServices(query).map((item) => ({ ...item, keywords: [item.keywords], detail: item.area }))}
          onChange={setQuery} onSelect={(item) => setQuery(item.label)} emptyMessage="No catalog match. Search provider descriptions or browse all services." />
        <label className="field">Business location<input name="zip" value={zip} onChange={(event) => setZip(event.target.value)} placeholder="Enter ZIP code" inputMode="numeric" maxLength={5} pattern="[0-9]{5}" autoComplete="postal-code" /></label>
        <label className="field">Distance<select name="radius" value={radius} onChange={(event) => setRadius(event.target.value)}>{[5, 10, 20, 50, 100].map((value) => <option value={value} key={value}>{value} miles</option>)}</select></label>
        <button className="primary" type="submit" disabled={pending}>{pending ? 'Searching…' : 'Find marketing teams'}</button>
      </form>
    </section>
    <section className="service-tools" aria-label="Marketing service filters"><div className="shortcuts">
      {directoryShortcuts.map((service, index) => <label className="chip" key={service.id} title={service.description}><input type="checkbox" checked={selected.includes(service.id)} disabled={pending}
        onChange={(event) => applyServices(event.target.checked ? [...selected, service.id] : selected.filter((id) => id !== service.id))} />{directoryShortcutLabels[index]}</label>)}
      <button className="all-services" ref={allServicesButton} onClick={openServices} disabled={pending} aria-haspopup="dialog"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="12" y="2" width="6" height="6" rx="1"/><rect x="2" y="12" width="6" height="6" rx="1"/><rect x="12" y="12" width="6" height="6" rx="1"/></svg>All marketing services{selected.length ? ` (${selected.length})` : ''}</button>
    </div><div className="filter-options"><label>Match services<select value={match} disabled={pending} onChange={(event) => { const value = event.target.value; setMatch(value); if (selected.length) applyServices(selected, value); else navigate({ match: value }); }}><option value="any">Any selected service</option><option value="all">All selected services</option></select></label>
      <div className="additional-actions"><details className="more-filters"><summary>More filters</summary><div className="extra"><form onSubmit={(event) => { event.preventDefault(); navigate({ name: agencyName.trim() || undefined, expertType: providerType || undefined, verified: verified ? '1' : undefined }); }}>
        <label className="field">Business name<input name="name" value={agencyName} onChange={(event) => setAgencyName(event.target.value)} maxLength={150} placeholder="Search agency names" /></label>
        <label className="field">Provider type<select name="expertType" value={providerType} onChange={(event) => setProviderType(event.target.value)}><option value="">All providers</option>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="verification"><input name="verified" type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} />Verified only</label><button className="primary" disabled={pending}>Apply filters</button>
      </form></div></details><button className="text-button" onClick={() => showDialog('pricing')}>How pricing works</button></div>
    </div>
    <div className="selected-services" role="group" aria-label="Applied filters">{selected.map((id) => <button className="selected-chip" key={id} disabled={pending} aria-label={`Remove ${directoryFilters.find((service) => service.id === id)?.label} filter`} onClick={() => applyServices(selected.filter((value) => value !== id))}>{directoryFilters.find((service) => service.id === id)?.label}<span aria-hidden="true">×</span></button>)}
      {params.name ? <span className="selected-chip">Name: {params.name}</span> : null}{params.expertType ? <span className="selected-chip">{typeLabels[params.expertType as keyof typeof typeLabels]}</span> : null}{params.verified ? <span className="selected-chip">Verification filter</span> : null}
      {legacyFilters ? <span className="selected-chip">{problemLabel || params.subcategory || params.subject || `Services: ${params.service?.split(',').map(serviceLabel).join(', ')}`}</span> : null}
      {(selected.length || legacyFilters || params.q || params.name || params.expertType || params.verified || params.zip) ? <Link className="text-button" href="/experts">Clear filters</Link> : null}
    </div></section>
    <div className="directory-workspace"><section className={`directory-map ${showMap ? 'mobile-visible' : ''}`} id="directory-map" aria-label="Provider map">
      <div className="map-head"><strong>Teams in this area</strong><span>Current results</span></div>
      <ExpertsDiscoveryMap providers={payload.data} selectedProviderId={selectedPin} onProviderSelect={(id) => {
        setSelectedPin(id); if (id && window.matchMedia('(min-width: 1024px)').matches) document.getElementById(`provider-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }} />
      <p className="map-caption">Map shows this page’s results with saved locations. {payload.data.filter((provider) => provider.latitude == null || provider.longitude == null).length || 'No'} results lack map coordinates.</p>
    </section>
    <section className="results-panel" aria-label="Provider results"><div className="results-heading"><h2>{payload.meta.total} marketing {payload.meta.total === 1 ? 'team' : 'teams'}</h2><label className="sort">Sort by<select value={params.sort || 'newest'} disabled={pending} onChange={(event) => navigate({ sort: event.target.value, order: undefined })}>
      <option value="newest">Newest</option><option value="name">Name: A to Z</option><option value="distance" disabled={!params.zip}>Nearest first{!params.zip ? ' (enter ZIP)' : ''}</option><option value="rating">Rating</option><option value="verified">Verified first</option></select></label></div>
      <p className="result-note" role="status">{pending ? 'Updating teams and map…' : error ? 'Search unavailable' : selected.length ? `Providers offering ${match === 'all' ? 'all' : 'at least one'} selected ${selected.length === 1 ? 'service' : 'services'}.` : 'Compare expertise, location and provider-supplied price guidance.'}</p>
      {error ? <div className="empty" role="alert"><h3>Unable to load teams</h3><p>{error}</p><button className="secondary" onClick={() => startTransition(() => router.refresh())}>Try again</button><Link href="/experts" className="text-button">Clear filters</Link></div> : !payload.data.length ? <div className="empty"><h3>No teams match this search.</h3><p>Try fewer services, a wider distance or another search term. A service can be listed in the catalog without providers in your selected area.</p><Link className="secondary" href="/experts">Browse all providers</Link></div> : <ul className="result-list" data-testid="expert-results-list">{payload.data.map((provider) => {
        const price = providerPricing(provider), type = provider.expertType || 'specialist';
        const tokens = [...provider.services].sort((a, b) => Number(directoryFilters.some((service) => selected.includes(service.id) && service.tokens.includes(b))) - Number(directoryFilters.some((service) => selected.includes(service.id) && service.tokens.includes(a))));
        return <li key={provider.id} id={`provider-${provider.id}`} data-testid="expert-result-card" data-provider-id={provider.id} className={`agency ${selectedPin === provider.id ? 'selected' : ''}`}>
          <div className={`proof type-${type}`}><strong>{provider.expertType ? typeLabels[provider.expertType] : 'Marketing provider'}</strong><span>{[provider.city, provider.state].filter(Boolean).join(', ')}</span></div>
          <div className="row-main"><div className={`avatar type-${type}`} aria-hidden="true">{provider.logo && !provider.logo.includes('placehold.co') ? <Image src={provider.logo} alt="" width={55} height={55} unoptimized /> : provider.businessName.split(' ').slice(0, 2).map((word) => word[0]).join('')}</div><div className="agency-content"><h3><Link href={`/experts/${provider.slug}`}>{provider.businessName}</Link></h3><p className="meta">{[provider.city, provider.state, provider.zip].filter(Boolean).join(', ')}{typeof provider.distanceMiles === 'number' ? ` · ${provider.distanceMiles} miles away` : ''}{provider.verified ? ' · Verified' : ''}{provider.locationPrecision === 'approximate' ? ' · Approximate area' : ''}</p>
          <p className="description">{provider.shortDescription || provider.tagline || 'Open the profile to review this provider’s work, services and contact options.'}</p><ul className="skills" aria-label={`${provider.businessName} services`}>{tokens.slice(0, 5).map((token) => <li key={token} title={directoryServices.find((item) => item.tokens.includes(token))?.description}>{serviceLabel(token)}</li>)}{tokens.length > 5 ? <li><Link href={`/experts/${provider.slug}`}>+{tokens.length - 5} more</Link></li> : null}</ul></div></div>
          <div className="pricing-grid"><div><span>One-off project</span><strong>{price.project}</strong></div><div><span>{price.hourly ? 'Hourly rate' : 'Ongoing support'}</span><strong>{price.hourly || 'Ask for a quote'}</strong></div><small>Confirm scope, recurring fees and any advertising spend directly with the provider.</small></div>
          <div className="row-bottom"><label className="compare-label"><input type="checkbox" checked={compared.includes(provider.id)} onChange={(event) => toggleCompare(provider, event.target.checked)} aria-label={`Compare ${provider.businessName}`} />Compare</label><Link className="profile" href={`/experts/${provider.slug}`}>View profile<span className="sr-only">: {provider.businessName}</span></Link></div>
        </li>;
      })}</ul>}
      {!error && payload.meta.total > 0 ? <nav className="pagination" aria-label="Results pages"><p>Page {payload.meta.page} of {payload.meta.totalPages} · {payload.meta.total} results</p><div>{payload.meta.page > 1 ? <Link className="secondary" href={href({ page: String(payload.meta.page - 1) }, false)}>Previous</Link> : null}{payload.meta.page < payload.meta.totalPages ? <Link className="secondary" href={href({ page: String(payload.meta.page + 1) }, false)}>Next</Link> : null}</div></nav> : null}
    </section></div>
    <footer className="directory-footer">You arrange scope, pricing and payment directly with your chosen provider. Providers pay MarketLink a separate subscription.</footer>
    {compared.length ? <div className="compare-tray" aria-label="Selected providers"><span role="status">{compareMessage || `${compared.length} of 3 teams selected`}</span><button className="primary" disabled={compared.length < 2} onClick={() => showDialog('compare')}>Compare teams</button><button className="text-button" onClick={() => { setCompared([]); setCompareMessage(''); }}>Clear</button></div> : null}
    {!compared.length ? <button className="mobile-map-toggle" aria-expanded={showMap} aria-controls="directory-map" onClick={() => { setShowMap(!showMap); if (!showMap) requestAnimationFrame(() => document.getElementById('directory-map')?.scrollIntoView({ block: 'start' })); }}>{showMap ? 'Hide map' : 'Show map'}</button> : null}
    <dialog ref={picker} className="service-picker" aria-labelledby="service-title" onClose={() => allServicesButton.current?.focus()} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); picker.current?.close(); } }}>
      <header className="picker-heading"><div><h2 id="service-title">All marketing services</h2><p>Choose the expertise you need. You can select more than one.</p></div><button className="secondary" onClick={() => picker.current?.close()} aria-label="Close service picker">Close</button></header>
      <div className="picker-search"><label className="field">Search all services<input type="search" value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Try photography, email, Instagram ads…" autoFocus /></label><p aria-live="polite">{serviceSearch ? `${filteredServices.length} matching services` : `${areas.length} marketing areas · ${directoryServices.length} services`}</p></div>
      <div className="service-groups">{serviceSearch ? filteredServices.length ? <div className="service-choices">{filteredServices.map(serviceOption)}</div> : <p className="service-empty">No service matches that term. Try another name or clear the search to browse all marketing areas.</p> : areas.map((area) => <details className="service-group" key={area}><summary>{area}<small>{directoryServices.find((service) => service.area === area)?.areaDescription}</small></summary><div className="service-choices">{directoryServices.filter((service) => service.area === area).map(serviceOption)}</div></details>)}</div>
      <footer className="picker-footer"><button className="text-button" onClick={() => setDraft([])}>Clear selections</button><button className="primary" onClick={() => { picker.current?.close(); applyServices(draft); }}>Apply {draft.length ? `${draft.length} selected ` : ''}services</button></footer>
    </dialog>
    <dialog ref={dialog} className="directory-dialog" aria-labelledby="directory-dialog-title"><button className="close" aria-label="Close dialog" onClick={() => dialog.current?.close()}>×</button><h2 id="directory-dialog-title">{dialogMode === 'pricing' ? 'How agency pricing works' : 'Compare marketing teams'}</h2>
      {dialogMode === 'pricing' ? <div className="pricing-explainer"><h3>One-off project</h3><p>A provider’s starting budget for a defined piece of work. “From” is not a guaranteed final quote.</p><h3>Hourly rate and ongoing support</h3><p>Hourly rates are labelled per hour. Ask the provider for monthly pricing, included deliverables, minimum terms and cancellation arrangements.</p><h3>Advertising and platform costs</h3><p>Ask whether ad spend and software fees are included. Confirm all fees directly with your provider.</p><h3>Your agreement is with the provider</h3><p>Providers pay MarketLink a separate subscription. That subscription is not your project price.</p></div> : <div className="table-scroll"><table><thead><tr><th scope="col">Details</th>{selectedProviders.map((provider) => <th scope="col" key={provider.id}><Link href={`/experts/${provider.slug}`}>{provider.businessName}</Link></th>)}</tr></thead><tbody>{['Services', 'Location', 'Project budget', 'Hourly rate'].map((label) => <tr key={label}><th scope="row">{label}</th>{selectedProviders.map((provider) => <td key={provider.id}>{label === 'Services' ? provider.services.map(serviceLabel).join(', ') : label === 'Location' ? [provider.city, provider.state].join(', ') : label === 'Project budget' ? providerPricing(provider).project : providerPricing(provider).hourly || 'Ask for a quote'}</td>)}</tr>)}</tbody></table></div>}
    </dialog>
  </main>;
}
