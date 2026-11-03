'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

const EXPERTISE = [
  { label: 'SEO' },
  { label: 'Google Ads' },
  { label: 'Social Media' },
  { label: 'Branding' },
  { label: 'Websites' },
];
const EXAMPLES = [
  { id: 'north', name: 'Northline Marketing', type: 'Full-service marketing agency', initials: 'NM',
    description: 'A team combining strategy, search, advertising, branding, and content for business marketing.',
    skills: ['SEO', 'Google Ads', 'Social Media', 'Branding', 'Websites'], banner: ['One team.', 'Your marketing.'], color: '#e9edf5', x: 29, y: 35 },
  { id: 'field', name: 'Fieldwork Agency', type: 'Brand and campaign agency', initials: 'FA',
    description: 'A marketing team focused on brand identity, social content, and advertising campaigns.',
    skills: ['Google Ads', 'Social Media', 'Branding'], banner: ['Brand. Content.', 'Campaigns.'], color: '#efd9cd', x: 64, y: 52 },
  { id: 'clear', name: 'Clearpath Marketing', type: 'Digital marketing agency', initials: 'CM',
    description: 'A team bringing paid search, SEO, and website expertise together for digital marketing.',
    skills: ['SEO', 'Google Ads', 'Websites'], banner: ['Search. Strategy.', 'Digital.'], color: '#dce7e0', x: 40, y: 73 },
];
type ExampleAgency = typeof EXAMPLES[number];

function ExampleCard({ agency, compact = false, selected, onExplore }: {
  agency: ExampleAgency; compact?: boolean; selected: boolean; onExplore: () => void;
}) {
  return <article className={`agency ${selected ? 'selected' : ''}`}>
    {!compact ? <div className="banner"><strong>{agency.banner.map((line) => <span key={line}>{line}<br /></span>)}</strong>
      <svg className="mono" width="135" height="90" viewBox="0 0 135 90" aria-hidden="true"><text x="135" y="76" textAnchor="end" fill="currentColor">{agency.initials}</text></svg><small>Example agency identity</small></div> : null}
    <div className="agency-inner"><div className="agency-head"><div className="avatar" style={{ background: agency.color }} aria-hidden="true">{agency.initials}</div>
      <div><h3>{agency.name}</h3><p>{agency.type}</p></div>
    </div><p className="description">{agency.description}</p>
      <ul className="tags" aria-label={`${agency.name} example expertise`}>{agency.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <div className="card-bottom"><span>Fictional agency · Example profile</span><button className="profile-link" aria-label={`Explore example: ${agency.name}`} onClick={onExplore}>Explore example</button></div>
    </div>
  </article>;
}

export default function HomeMarketplace() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [zip, setZip] = useState('');
  const [name, setName] = useState('');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [example, setExample] = useState<ExampleAgency | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const examples = EXAMPLES.filter((agency) => selectedSkills.length === 0 || selectedSkills.some((skill) => agency.skills.includes(skill)));
  const params = new URLSearchParams();
  if (zip.trim()) { params.set('zip', zip.trim()); params.set('radius', '10'); }
  if (name.trim()) params.set('name', name.trim());
  const browseHref = `/experts${params.size ? `?${params}` : ''}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign(browseHref);
  }
  function explore(agency: ExampleAgency) {
    setExample(agency);
    dialog.current?.showModal();
  }

  return <main className="approved-home two" id="main-content">
    <div className="hero-band"><section className="intro wrap">
      <h1>Find the right local marketing team for your business.</h1>
      <p>Compare nearby marketing agencies by their skills, past work and location. Contact the team that fits your business.</p>
      <form className="search" action="/experts" onSubmit={submit} aria-label="Find marketing agencies">
        <label>Where is your business?<input name="zip" value={zip} onChange={(event) => setZip(event.target.value)} placeholder="Enter ZIP code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" /></label>
        <label>Agency name <span style={{ fontWeight: 400 }}>(optional)</span><input name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Search agency names" /></label>
        <button className="primary" type="submit">Find marketing teams</button>
      </form>
      <p className="search-note">Looking for one service or a complete marketing team? Start here and refine by expertise.</p>
    </section></div>
    <div className="wrap">
      <section className="services" aria-label="Provider expertise"><div className="services-title"><h2>Try filtering the example agencies</h2>
        <button className="reset" onClick={() => { setSelectedSkills([]); setSelectedPin(null); }}>Clear filters</button></div>
        <div className="chips">{EXPERTISE.map((item) => <label className="chip" key={item.label}>
          <input type="checkbox" checked={selectedSkills.includes(item.label)} onChange={(event) => {
            const checked = event.target.checked;
            setSelectedSkills((current) => checked ? [...current, item.label] : current.filter((value) => value !== item.label));
            setSelectedPin(null);
          }} />{item.label}
        </label>)}</div>
      </section>
      <section className="agency-area" id="agency-list" aria-labelledby="example-teams-heading" data-nosnippet>
        <div className="section-top"><h2 id="example-teams-heading">See what you can compare</h2><p className="count">{examples.length} example profiles</p></div>
        <p className="example-description">These fictional teams demonstrate agency profiles. Real listings are in <Link href={browseHref}>Browse experts</Link>.</p>
        <div className="results">{examples.map((agency) => <ExampleCard key={agency.id} agency={agency} selected={false} onExplore={() => explore(agency)} />)}</div>
      </section>
      <section className="agency-explore" id="agency-explore" aria-labelledby="explore-heading" data-nosnippet>
        <div className="section-top"><div><h2 id="explore-heading">Explore agencies near you</h2><p className="explore-intro">A sample of how you’ll compare teams and locations in Browse experts.</p></div><Link className="reset" href={browseHref}>Find real marketing teams</Link></div>
        <div className="explore-grid"><div className="results explore-results">{examples.map((agency) => <ExampleCard key={agency.id} agency={agency} compact selected={selectedPin === agency.id} onExplore={() => explore(agency)} />)}</div>
          <aside className="map-column" aria-label="Agency map demonstration"><div className="map">
            <svg viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true"><path fill="#d4e2cd" d="M0 0H128L99 178 0 220ZM400 380l-110 45-22 175h132Z" />
              <path d="M-20 300 420 130M110-30 225 630M-20 490 420 315M-20 65 420 410" stroke="#fff" strokeWidth="22" fill="none" />
              <path d="M-20 560Q100 460 200 515T420 470" stroke="#b7d6e4" strokeWidth="25" fill="none" /></svg>
            <span className="map-title">Example agency locations</span>
            {examples.map((agency) => <button className={`pin ${selectedPin === agency.id ? 'active' : ''}`} key={agency.id} style={{ left: `${agency.x}%`, top: `${agency.y}%` }}
              aria-label={`Highlight example ${agency.name}`} aria-pressed={selectedPin === agency.id} onClick={() => setSelectedPin(agency.id)}>{EXAMPLES.indexOf(agency) + 1}</button>)}
            <p className="map-note">Illustrative map and fictional agency locations. Open Browse experts for real results and the live map.</p>
          </div><p className="map-caption">Select a sample pin to see how location browsing works.</p></aside>
        </div>
      </section>
      <section className="why"><h2>Choose a team.<br />Discuss your needs.</h2><p>Look through an agency’s expertise and past projects. Contact them to discuss which services your business needs, the scope, and the price. You agree on the work and payment directly with the agency.</p></section>
      <footer className="footer"><span>MarketLink connects local businesses with marketing teams.</span><Link href={browseHref}>Browse real providers</Link></footer>
    </div>
    <dialog ref={dialog} aria-labelledby="example-profile-title"><button className="close" aria-label="Close example profile" onClick={() => dialog.current?.close()}>×</button>
      <p className="dialog-note">Fictional sample agency · Profile demonstration</p><h2 id="example-profile-title">{example?.name}</h2><p>{example?.description}</p>
      <h3>Team expertise</h3><ul className="tags">{example?.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <h3>Past work and case studies</h3><p>A real provider profile contains the team’s own projects, services, and contact options. This example does not represent an actual business.</p>
      <Link className="primary" href={browseHref}>Find a real marketing team</Link>
    </dialog>
  </main>;
}
