'use client';

import { useId, useMemo, useState } from 'react';
import {
  formatServiceTokenLabel,
  getServiceTokensForSubcategory,
  getUnmatchedServiceTokensForExpert,
  marketingSubjects,
} from '@/lib/marketingTaxonomy';

type Props = {
  services: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
};

type SubjectSuggestion = {
  id: string;
  label: string;
  description: string;
  keywords: readonly string[];
};

type HelpSuggestion = {
  id: string;
  subjectLabel: string;
  label: string;
  description: string;
  keywords: readonly string[];
};

const MAX_SUBJECTS = 5;
const MAX_HELP_TYPES = 10;

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildHelpKey(subjectId: string, subcategoryId: string) {
  return `${subjectId}::${subcategoryId}`;
}

function parseHelpKey(helpKey: string) {
  const [subjectId, subcategoryId] = helpKey.split('::');
  return { subjectId, subcategoryId };
}

function deriveSelectionFromServices(services: readonly string[]) {
  const remaining = new Set(services.map((service) => service.trim().toLowerCase()));
  const options = marketingSubjects.flatMap((subject) =>
    subject.subcategories.map((subcategory) => ({
      subjectId: subject.id,
      helpKey: buildHelpKey(subject.id, subcategory.id),
      tokens: getServiceTokensForSubcategory(subject.id, subcategory.id),
    })),
  );

  // Prefer saved bundles, then use distinctive tags to recover older profiles.
  const selected = options
    .filter(({ tokens }) => tokens.length && tokens.every((token) => remaining.has(token)))
    .sort((left, right) => right.tokens.length - left.tokens.length)
    .filter(({ tokens }) => {
      if (!tokens.some((token) => remaining.has(token))) return false;
      tokens.forEach((token) => remaining.delete(token));
      return true;
    });
  for (const token of remaining) {
    const matches = options.filter((option) => option.tokens.includes(token));
    if (matches.length === 1 && !selected.includes(matches[0])) selected.push(matches[0]);
  }

  return {
    selectedSubjectIds: uniqueStrings(selected.map(({ subjectId }) => subjectId)),
    selectedHelpKeys: selected.map(({ helpKey }) => helpKey),
  };
}

function filterSubjectSuggestions(options: readonly SubjectSuggestion[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    [option.label, option.description, ...option.keywords].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

function filterHelpSuggestions(options: readonly HelpSuggestion[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    [option.label, option.subjectLabel, option.description, ...option.keywords].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

export default function TaxonomyServicePicker({ services, onChange, required = false }: Props) {
  const areaListId = useId();
  const helpListId = useId();
  const [subjectQuery, setSubjectQuery] = useState('');
  const [helpQuery, setHelpQuery] = useState('');
  const [subjectIndex, setSubjectIndex] = useState(-1);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [helpIndex, setHelpIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  // Both callers mount the picker once the initial services are available.
  const [initialSelection] = useState(() => deriveSelectionFromServices(services));
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(initialSelection.selectedSubjectIds);
  const [selectedHelpKeys, setSelectedHelpKeys] = useState(initialSelection.selectedHelpKeys);

  const subjectSuggestions = useMemo<SubjectSuggestion[]>(
    () =>
      marketingSubjects.map((subject) => ({
        id: subject.id,
        label: subject.label,
        description: subject.shortDescription,
        keywords: [subject.buyerLabel, ...subject.serviceTokens],
      })),
    [],
  );

  const helpSuggestions = useMemo<HelpSuggestion[]>(
    () =>
      marketingSubjects
        .filter((subject) => selectedSubjectIds.includes(subject.id))
        .flatMap((subject) =>
          subject.subcategories.map((subcategory) => ({
            id: buildHelpKey(subject.id, subcategory.id),
            subjectLabel: subject.label,
            label: subcategory.label,
            description: subcategory.shortDescription,
            keywords: [subcategory.buyerLabel, ...subcategory.serviceTokens],
          })),
        ),
    [selectedSubjectIds],
  );

  const selectedSubjects = useMemo(
    () => marketingSubjects.filter((subject) => selectedSubjectIds.includes(subject.id)),
    [selectedSubjectIds],
  );

  const selectedHelpItems = useMemo(
    () =>
      helpSuggestions
        .filter((suggestion) => selectedHelpKeys.includes(suggestion.id))
        .sort((left, right) => left.subjectLabel.localeCompare(right.subjectLabel) || left.label.localeCompare(right.label)),
    [helpSuggestions, selectedHelpKeys],
  );

  const visibleSubjectSuggestions = useMemo(
    () => filterSubjectSuggestions(subjectSuggestions, subjectQuery).filter((suggestion) => !selectedSubjectIds.includes(suggestion.id)),
    [selectedSubjectIds, subjectQuery, subjectSuggestions],
  );

  const visibleHelpSuggestions = useMemo(
    () => filterHelpSuggestions(helpSuggestions, helpQuery).filter((suggestion) => !selectedHelpKeys.includes(suggestion.id)),
    [helpQuery, helpSuggestions, selectedHelpKeys],
  );

  const legacyTokens = useMemo(() => getUnmatchedServiceTokensForExpert(services), [services]);
  const hasSavedServicesWithoutSelectedHelp = services.length > 0 && selectedHelpKeys.length === 0;
  const areaNeedsSelection = subjectQuery.trim().length > 0 && subjectOpen && visibleSubjectSuggestions.length === 0;
  const helpNeedsSelection = helpQuery.trim().length > 0 && helpOpen && visibleHelpSuggestions.length === 0;
  const canAddMoreSubjects = selectedSubjectIds.length < MAX_SUBJECTS;
  const canAddMoreHelp = selectedHelpKeys.length < MAX_HELP_TYPES;

  function commitHelpSelection(nextHelpKeys: string[]) {
    setSelectedHelpKeys(nextHelpKeys);
    const tokensFor = (helpKey: string) => {
      const { subjectId, subcategoryId } = parseHelpKey(helpKey);
      return getServiceTokensForSubcategory(subjectId, subcategoryId);
    };
    const removedTokens = new Set(selectedHelpKeys.filter((key) => !nextHelpKeys.includes(key)).flatMap(tokensFor));
    const retainedTokens = new Set(nextHelpKeys.filter((key) => selectedHelpKeys.includes(key)).flatMap(tokensFor));
    const addedTokens = nextHelpKeys.filter((key) => !selectedHelpKeys.includes(key)).flatMap(tokensFor);
    const nextTokens = uniqueStrings([
      ...services.filter((token) => !removedTokens.has(token) || retainedTokens.has(token)),
      ...addedTokens,
    ]);
    onChange(nextTokens);
  }

  function addSubject(subjectId: string) {
    if (selectedSubjectIds.includes(subjectId) || !canAddMoreSubjects) return;
    setSelectedSubjectIds((current) => [...current, subjectId]);
    setSubjectQuery('');
    setSubjectOpen(false);
  }

  function removeSubject(subjectId: string) {
    const nextSubjectIds = selectedSubjectIds.filter((current) => current !== subjectId);
    setSelectedSubjectIds(nextSubjectIds);

    const nextHelpKeys = selectedHelpKeys.filter((helpKey) => parseHelpKey(helpKey).subjectId !== subjectId);
    if (nextHelpKeys.length !== selectedHelpKeys.length) {
      commitHelpSelection(nextHelpKeys);
    }
  }

  function addHelp(helpKey: string) {
    if (selectedHelpKeys.includes(helpKey) || !canAddMoreHelp) return;
    commitHelpSelection([...selectedHelpKeys, helpKey]);
    setHelpQuery('');
    setHelpOpen(false);
  }

  function removeHelp(helpKey: string) {
    commitHelpSelection(selectedHelpKeys.filter((current) => current !== helpKey));
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={areaListId + '-input'} className="text-sm font-medium text-slate-700">
            Marketing areas {required ? '*' : null}
          </label>
          <span className="text-xs text-slate-500">{selectedSubjectIds.length} selected · up to {MAX_SUBJECTS}</span>
        </div>
        <p className="text-xs leading-6 text-slate-500">Choose the main areas you work in.</p>
        <div className="relative">
          <input
            id={areaListId + '-input'}
            value={subjectQuery}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && subjectOpen) {
                event.preventDefault();
                setSubjectOpen(false);
                setSubjectIndex(-1);
              } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && visibleSubjectSuggestions.length) {
                event.preventDefault();
                setSubjectOpen(true);
                const last = visibleSubjectSuggestions.length - 1;
                setSubjectIndex((index) => event.key === 'ArrowDown' ? Math.min(index + 1, last) : index < 0 ? last : Math.max(index - 1, 0));
              } else if (event.key === 'Enter' && subjectOpen && visibleSubjectSuggestions[subjectIndex]) {
                event.preventDefault();
                addSubject(visibleSubjectSuggestions[subjectIndex].id);
                setSubjectIndex(-1);
              }
            }}
            onChange={(event) => {
              setSubjectIndex(-1);
              setSubjectQuery(event.target.value);
              setSubjectOpen(true);
            }}
            onFocus={() => setSubjectOpen(true)}
            onClick={() => setSubjectOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setSubjectOpen(false), 120);
            }}
            placeholder={canAddMoreSubjects ? 'Search marketing areas' : 'Remove one area to add another'}
            disabled={!canAddMoreSubjects}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={subjectOpen && visibleSubjectSuggestions.length ? areaListId : undefined}
            aria-activedescendant={subjectOpen && visibleSubjectSuggestions[subjectIndex] ? areaListId + '-' + subjectIndex : undefined}
            aria-haspopup="listbox"
            aria-expanded={subjectOpen && visibleSubjectSuggestions.length > 0}
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          {subjectOpen && visibleSubjectSuggestions.length > 0 ? (
            <div id={areaListId} role="listbox" className="absolute z-30 mt-2 w-full overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <ul className="max-h-72 overflow-y-auto py-2">
                {visibleSubjectSuggestions.map((suggestion, index) => (
                  <li key={suggestion.id}>
                    <button
                      id={areaListId + '-' + index}
                      role="option"
                      aria-selected={subjectIndex === index}
                      tabIndex={-1}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addSubject(suggestion.id)}
                      className="w-full px-4 py-3 text-left transition hover:bg-slate-50 aria-selected:bg-blue-50"
                    >
                      <div className="text-sm font-semibold text-slate-900">{suggestion.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{suggestion.description}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {selectedSubjects.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => removeSubject(subject.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.72))] px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <span>{subject.label}</span>
                <span className="text-slate-400" aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {areaNeedsSelection ? <p className="text-xs leading-6 text-slate-500">Choose one marketing area from the dropdown.</p> : null}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={helpListId + '-input'} className="text-sm font-medium text-slate-700">
            Specific help {required ? '*' : null}
          </label>
          <span className="text-xs text-slate-500">{selectedHelpKeys.length} selected · up to {MAX_HELP_TYPES}</span>
        </div>
        <p className="text-xs leading-6 text-slate-500">Choose services within your selected areas.</p>
        <div className="relative">
          <input
            id={helpListId + '-input'}
            value={helpQuery}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && helpOpen) {
                event.preventDefault();
                setHelpOpen(false);
                setHelpIndex(-1);
              } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && visibleHelpSuggestions.length) {
                event.preventDefault();
                setHelpOpen(true);
                const last = visibleHelpSuggestions.length - 1;
                setHelpIndex((index) => event.key === 'ArrowDown' ? Math.min(index + 1, last) : index < 0 ? last : Math.max(index - 1, 0));
              } else if (event.key === 'Enter' && helpOpen && visibleHelpSuggestions[helpIndex]) {
                event.preventDefault();
                addHelp(visibleHelpSuggestions[helpIndex].id);
                setHelpIndex(-1);
              }
            }}
            onChange={(event) => {
              setHelpIndex(-1);
              setHelpQuery(event.target.value);
              setHelpOpen(true);
            }}
            onFocus={() => setHelpOpen(true)}
            onClick={() => setHelpOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setHelpOpen(false), 120);
            }}
            placeholder={
              !selectedSubjectIds.length
                ? 'Choose a marketing area first'
                : canAddMoreHelp
                  ? 'Search services'
                  : 'Remove one help type to add another'
            }
            disabled={!selectedSubjectIds.length || !canAddMoreHelp}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={helpOpen && visibleHelpSuggestions.length ? helpListId : undefined}
            aria-activedescendant={helpOpen && visibleHelpSuggestions[helpIndex] ? helpListId + '-' + helpIndex : undefined}
            aria-haspopup="listbox"
            aria-expanded={helpOpen && visibleHelpSuggestions.length > 0}
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          {helpOpen && visibleHelpSuggestions.length > 0 ? (
            <div id={helpListId} role="listbox" className="absolute z-30 mt-2 w-full overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <ul className="max-h-72 overflow-y-auto py-2">
                {visibleHelpSuggestions.map((suggestion, index) => (
                  <li key={suggestion.id}>
                    <button
                      id={helpListId + '-' + index}
                      role="option"
                      aria-selected={helpIndex === index}
                      tabIndex={-1}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addHelp(suggestion.id)}
                      className="w-full px-4 py-3 text-left transition hover:bg-slate-50 aria-selected:bg-blue-50"
                    >
                      <div className="text-sm font-semibold text-slate-900">{suggestion.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">
                        {suggestion.subjectLabel} · {suggestion.description}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {selectedHelpItems.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedHelpItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => removeHelp(item.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-500">{item.subjectLabel}</span>
                <span className="text-slate-400" aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {helpNeedsSelection ? <p className="text-xs leading-6 text-slate-500">Choose one help type from the dropdown.</p> : null}
        {hasSavedServicesWithoutSelectedHelp ? (
          <p className="text-xs leading-6 text-slate-500">Your saved tags are kept when you add specific help.</p>
        ) : null}
      </div>

      {legacyTokens.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Saved legacy tags</div>
          <p className="mt-2 text-xs leading-6 text-slate-500">Older tags stay searchable until you remove them.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {legacyTokens.map((token) => (
              <button key={token} type="button" aria-label={`Remove ${formatServiceTokenLabel(token)}`} onClick={() => onChange(services.filter((service) => service !== token))} className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                {formatServiceTokenLabel(token)} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
