'use client';

import Link from 'next/link';
import { useId, useMemo, useState, type FormEvent } from 'react';
import MarketLinkHeroIllustration from '@/components/MarketLinkHeroIllustration';
import NearbyRadiusField from '@/components/NearbyRadiusField';
import { useMarketLinkTheme } from '@/components/ThemeToggle';
import {
  buildExpertsHrefForBuyerProblem,
  buildExpertsHrefForSubject,
  buyerProblems,
  marketingSubjects,
} from '@/lib/marketingTaxonomy';

const FEATURED_PROBLEM_IDS = new Set([
  'need-more-customers',
  'cannot-find-business',
  'website-not-converting',
  'social-not-working',
]);

const FEATURED_SUBJECT_IDS = new Set([
  'local-search-seo',
  'paid-ads-lead-generation',
  'website-landing-pages',
  'creator-influencer-marketing',
]);

type SearchableOption = {
  id: string;
  label: string;
  description: string;
  detail?: string;
  keywords: readonly string[];
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function filterSearchableOptions(options: readonly SearchableOption[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    [option.label, option.description, option.detail ?? '', ...option.keywords].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}

type SearchableSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: readonly SearchableOption[];
  onChange: (value: string) => void;
  onSelect: (option: SearchableOption) => void;
  helperText?: string;
  invalid?: boolean;
  invalidMessage?: string;
  emptyMessage?: string;
};

function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  onSelect,
  helperText,
  invalid,
  invalidMessage,
  emptyMessage = 'No matching options yet.',
}: SearchableSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const showEmptyState = open && value.trim().length > 0 && options.length === 0;
  const showSuggestions = open && options.length > 0;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={placeholder}
          className="ml-input w-full rounded-[1.15rem] px-4 py-3.5 pr-10 text-sm"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-expanded={showSuggestions}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400" aria-hidden="true">
          v
        </span>

        {showSuggestions ? (
          <div id={listId} role="listbox" className="absolute z-30 mt-2 w-full overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <ul className="max-h-72 overflow-y-auto py-2">
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelect(option);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">{option.description}</div>
                    {option.detail ? <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">{option.detail}</div> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="absolute z-30 mt-2 w-full rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            {emptyMessage}
          </div>
        ) : null}
      </div>
      {invalid ? (
        <p className="text-xs leading-6 text-red-600">{invalidMessage}</p>
      ) : helperText ? (
        <p className="text-xs leading-6 text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}

export default function Home() {
  const { t } = useMarketLinkTheme();
  const [problemId, setProblemId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [problemQuery, setProblemQuery] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const featuredProblems = buyerProblems
    .filter((problem) => FEATURED_PROBLEM_IDS.has(problem.id))
    .sort((a, b) => a.priority - b.priority);
  const featuredSubjects = marketingSubjects.filter((subject) => FEATURED_SUBJECT_IDS.has(subject.id));
  const selectedProblem = buyerProblems.find((problem) => problem.id === problemId) ?? null;
  const availableSubjects = selectedProblem
    ? marketingSubjects.filter((subject) => selectedProblem.suggestedSubjectIds.includes(subject.id))
    : marketingSubjects;
  const problemNeedsSelection = problemQuery.trim().length > 0 && !problemId;
  const subjectNeedsSelection = subjectQuery.trim().length > 0 && !subjectId;
  const hasPendingDropdownSelection = problemNeedsSelection || subjectNeedsSelection;

  const problemOptions = useMemo(
    () =>
      [...buyerProblems]
        .sort((a, b) => a.priority - b.priority)
        .map(
          (problem): SearchableOption => ({
            id: problem.id,
            label: problem.label,
            description: problem.customerLanguage,
            detail: problem.outcomePromise,
            keywords: [...problem.suggestedSubjectIds, ...problem.suggestedServiceTokens],
          }),
        ),
    [],
  );

  const subjectOptions = useMemo(
    () =>
      availableSubjects.map(
        (subject): SearchableOption => ({
          id: subject.id,
          label: subject.label,
          description: subject.shortDescription,
          detail: `Includes ${subject.subcategories
            .slice(0, 3)
            .map((subcategory) => subcategory.label)
            .join(', ')}`,
          keywords: [
            subject.buyerLabel,
            ...subject.serviceTokens,
            ...subject.subcategories.map((subcategory) => subcategory.label),
            ...subject.subcategories.map((subcategory) => subcategory.buyerLabel),
            ...subject.subcategories.flatMap((subcategory) => subcategory.deliverables.map((deliverable) => deliverable.label)),
          ],
        }),
      ),
    [availableSubjects],
  );

  const filteredProblemOptions = useMemo(() => filterSearchableOptions(problemOptions, problemQuery), [problemOptions, problemQuery]);
  const filteredSubjectOptions = useMemo(() => filterSearchableOptions(subjectOptions, subjectQuery), [subjectOptions, subjectQuery]);

  function appendLocationParams(baseHref: string, zip: string, radius: string) {
    const [pathname, query = ''] = baseHref.split('?');
    const params = new URLSearchParams(query);
    params.set('zip', zip || '60601');
    params.set('radius', radius || '10');
    return `${pathname}?${params.toString()}`;
  }

  function onNearbySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPendingDropdownSelection) return;

    const form = event.currentTarget;
    const zipField = form.elements.namedItem('zip');
    const radiusField = form.elements.namedItem('radius');
    const zip = zipField instanceof HTMLInputElement ? zipField.value.trim() : '';
    const radius = radiusField instanceof HTMLSelectElement ? radiusField.value : '10';
    const baseHref = subjectId
      ? buildExpertsHrefForSubject(subjectId)
      : problemId
      ? buildExpertsHrefForBuyerProblem(problemId)
      : '/experts';

    window.location.assign(appendLocationParams(baseHref, zip, radius));
  }

  return (
    <main className={`${t.pageBg} min-h-[calc(100vh-80px)]`}>
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        <section className="ml-card ml-hero-grid ml-ambient-shell overflow-hidden rounded-[2rem] px-5 py-5 shadow-[0_26px_90px_rgba(18,26,42,0.11)] sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className="min-w-0">
              <div className="ml-brand-badge inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] shadow-sm">
                Local marketing, clearer decisions
              </div>

              <h1 className="font-display mt-5 text-[3rem] leading-[0.9] text-slate-950 sm:text-[4.15rem] lg:text-[4.7rem]">
                Find the local marketing partner worth contacting first.
              </h1>

              <p className={`mt-5 max-w-2xl text-[1rem] leading-8 ${t.mutedText}`}>
                Start with one nearby search, then move straight into the shortlist and map. The goal is to make the first click feel obvious.
              </p>

              <div className="mt-6 rounded-[1.65rem] bg-white/90 p-4 shadow-[0_18px_40px_rgba(18,26,42,0.08)] ring-1 ring-slate-200/80 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Start nearby</div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Type to find the right path, then search nearby.</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Search by goal and marketing area, then choose from the dropdown. If ZIP is empty, we start from Chicago.</p>
                  </div>
                </div>

                <form action="/experts" method="GET" onSubmit={onNearbySubmit} className="mt-5 grid gap-4">
                  <div className="grid gap-3 xl:grid-cols-2">
                    <SearchableSelect
                      label="Business goal"
                      placeholder="Search goals like more customers or better reviews"
                      value={problemQuery}
                      options={filteredProblemOptions}
                      onChange={(value) => {
                        setProblemQuery(value);
                        setProblemId('');
                        setSubjectQuery('');
                        setSubjectId('');
                      }}
                      onSelect={(option) => {
                        setProblemId(option.id);
                        setProblemQuery(option.label);
                        setSubjectQuery('');
                        setSubjectId('');
                      }}
                      helperText="Start typing, then choose one goal from the dropdown."
                      invalid={problemNeedsSelection}
                      invalidMessage="Choose one goal from the dropdown."
                      emptyMessage="No matching business goals."
                    />

                    <SearchableSelect
                      label="Marketing area"
                      placeholder={selectedProblem ? 'Search the matching marketing areas' : 'Search areas like ads, SEO, or creators'}
                      value={subjectQuery}
                      options={filteredSubjectOptions}
                      onChange={(value) => {
                        setSubjectQuery(value);
                        setSubjectId('');
                      }}
                      onSelect={(option) => {
                        setSubjectId(option.id);
                        setSubjectQuery(option.label);
                      }}
                      helperText={
                        selectedProblem
                          ? 'This list is filtered to match the selected business goal.'
                          : 'Type a service family, then choose one marketing area from the dropdown.'
                      }
                      invalid={subjectNeedsSelection}
                      invalidMessage="Choose one marketing area from the dropdown."
                      emptyMessage={selectedProblem ? 'No matching marketing areas for this goal.' : 'No matching marketing areas.'}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <NearbyRadiusField
                      initialRadius="10"
                      compact
                      hideCompactStatus
                      fieldClassName="ml-input w-full rounded-[1.15rem] px-4 py-3.5 text-sm"
                      zipLabel="Location ZIP"
                      zipPlaceholder="Enter ZIP code"
                    />
                    <button
                      type="submit"
                      disabled={hasPendingDropdownSelection}
                      className={`inline-flex min-h-12 items-center justify-center rounded-[1.15rem] px-6 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${t.primaryBtn}`}
                    >
                      Find local experts
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <span>Search the goal first, then the next dropdown narrows the matching marketing areas.</span>
                  <Link href="/experts" className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
                    Skip ZIP and browse all experts
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <MarketLinkHeroIllustration />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>What do you need help with?</div>
              <h2 className="font-display mt-2 text-[2.2rem] text-slate-950">Start with the business problem.</h2>
            </div>
            <Link href="/experts" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
              Open the full directory
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredProblems.map((problem, index) => {
              const suggestedSubjects = problem.suggestedSubjectIds
                .map((subjectId) => marketingSubjects.find((subject) => subject.id === subjectId))
                .filter((subject): subject is (typeof marketingSubjects)[number] => Boolean(subject));

              return (
                <Link
                  key={problem.id}
                  href={buildExpertsHrefForBuyerProblem(problem.id)}
                  className="ml-card-hover group overflow-hidden rounded-[1.6rem] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(18,26,42,0.06)] ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(18,26,42,0.1)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="ml-brand-badge inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Problem {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" aria-hidden="true">
                      &rarr;
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{problem.label}</h3>
                  <p className={`mt-2 text-sm leading-7 ${t.mutedText}`}>{problem.customerLanguage}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedSubjects.slice(0, 2).map((subject) => (
                      <span key={subject.id} className="ml-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                        {subject.label}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="browse-by-need" className="mt-8 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={`text-[11px] font-medium uppercase tracking-[0.24em] ${t.mutedText}`}>Popular marketing areas</div>
              <h2 className="font-display mt-2 text-[2.15rem] text-slate-950">Or choose the marketing area directly.</h2>
            </div>
            <Link href="/experts" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
              See every service in the directory
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredSubjects.map((subject, index) => (
              <Link
                key={subject.id}
                href={buildExpertsHrefForSubject(subject.id)}
                data-testid="service-path-card"
                className={[
                  'ml-card-hover group flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[1.8rem] p-5 transition',
                  index % 2 === 0 ? 'ml-dark-panel text-white' : 'ml-card',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${index % 2 === 0 ? 'bg-white/12 text-white/88' : 'ml-brand-badge'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? 'bg-white/70' : t.accentDot}`} />
                  </div>

                  <h3 className={`mt-5 text-[1.35rem] font-semibold tracking-tight ${index % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>
                    {subject.label}
                  </h3>
                  <div className={`mt-2 text-[11px] font-medium uppercase tracking-[0.18em] ${index % 2 === 0 ? 'text-white/60' : t.mutedText}`}>
                    {subject.buyerLabel}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${index % 2 === 0 ? 'text-white/78' : t.mutedText}`}>{subject.shortDescription}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className={`text-sm font-semibold ${index % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>See experts</span>
                  <span className={`text-lg transition group-hover:translate-x-1 ${index % 2 === 0 ? 'text-white/65 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
