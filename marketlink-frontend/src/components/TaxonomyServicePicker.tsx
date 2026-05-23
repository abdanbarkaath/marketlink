'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
  formatServiceTokenLabel,
  getServiceTokensForSubject,
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
  subjectId: string;
  subjectLabel: string;
  label: string;
  description: string;
  keywords: readonly string[];
};

const MAX_SUBJECTS = 3;
const MAX_HELP_TYPES = 8;

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
  const serviceSet = new Set(services.map((service) => service.trim().toLowerCase()).filter(Boolean));
  const selectedSubjectIds = marketingSubjects
    .filter((subject) => getServiceTokensForSubject(subject.id).some((token) => serviceSet.has(token)))
    .map((subject) => subject.id);

  const selectedHelpKeys: string[] = [];

  for (const subject of marketingSubjects) {
    const matches = subject.subcategories
      .map((subcategory) => {
        const subcategoryTokens = uniqueStrings([
          ...subcategory.serviceTokens,
          ...subcategory.deliverables.flatMap((deliverable) => deliverable.serviceTokens),
        ]);
        const overlaps = subcategoryTokens.filter((token) => serviceSet.has(token));
        return { subcategory, overlaps };
      })
      .filter((item) => item.overlaps.length > 0);

    if (matches.length === 1) {
      selectedHelpKeys.push(buildHelpKey(subject.id, matches[0].subcategory.id));
      continue;
    }

    if (matches.length < 2) {
      continue;
    }

    const overlapCounts = new Map<string, number>();
    for (const match of matches) {
      for (const token of uniqueStrings(match.overlaps)) {
        overlapCounts.set(token, (overlapCounts.get(token) || 0) + 1);
      }
    }

    for (const match of matches) {
      if (match.overlaps.some((token) => overlapCounts.get(token) === 1)) {
        selectedHelpKeys.push(buildHelpKey(subject.id, match.subcategory.id));
      }
    }
  }

  return {
    selectedSubjectIds,
    selectedHelpKeys: uniqueStrings(selectedHelpKeys),
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
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedHelpKeys, setSelectedHelpKeys] = useState<string[]>([]);

  useEffect(() => {
    const nextSelection = deriveSelectionFromServices(services);
    setSelectedSubjectIds(nextSelection.selectedSubjectIds);
    setSelectedHelpKeys(nextSelection.selectedHelpKeys);
  }, [services]);

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
            subjectId: subject.id,
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
    const nextTokens = uniqueStrings(
      nextHelpKeys.flatMap((helpKey) => {
        const { subjectId, subcategoryId } = parseHelpKey(helpKey);
        return getServiceTokensForSubcategory(subjectId, subcategoryId);
      }),
    );
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
          <label className="text-sm font-medium text-slate-700">
            Marketing areas {required ? '*' : null}
          </label>
          <span className="text-xs text-slate-500">{selectedSubjectIds.length}/{MAX_SUBJECTS} selected</span>
        </div>
        <p className="text-xs leading-6 text-slate-500">Pick the main areas buyers should find you under, like creator promotion or reels production.</p>
        <div className="relative">
          <input
            value={subjectQuery}
            onChange={(event) => {
              setSubjectQuery(event.target.value);
              setSubjectOpen(true);
            }}
            onFocus={() => setSubjectOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setSubjectOpen(false), 120);
            }}
            placeholder={canAddMoreSubjects ? 'Search areas like creator promotion, reels, or reviews' : 'Remove one area to add another'}
            disabled={!canAddMoreSubjects}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 placeholder:opacity-55 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={areaListId}
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
                {visibleSubjectSuggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        addSubject(suggestion.id);
                      }}
                      className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
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
          <label className="text-sm font-medium text-slate-700">
            Specific help {required ? '*' : null}
          </label>
          <span className="text-xs text-slate-500">{selectedHelpKeys.length}/{MAX_HELP_TYPES} selected</span>
        </div>
        <p className="text-xs leading-6 text-slate-500">Choose the exact help you offer inside those areas, like sponsored posts or reels editing.</p>
        <div className="relative">
          <input
            value={helpQuery}
            onChange={(event) => {
              setHelpQuery(event.target.value);
              setHelpOpen(true);
            }}
            onFocus={() => setHelpOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setHelpOpen(false), 120);
            }}
            placeholder={
              !selectedSubjectIds.length
                ? 'Choose a marketing area first'
                : canAddMoreHelp
                  ? 'Search help like sponsored posts, UGC, or reels editing'
                  : 'Remove one help type to add another'
            }
            disabled={!selectedSubjectIds.length || !canAddMoreHelp}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 placeholder:opacity-55 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={helpListId}
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
                {visibleHelpSuggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        addHelp(suggestion.id);
                      }}
                      className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
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
          <p className="text-xs leading-6 text-slate-500">Your current saved tags stay as-is until you pick specific help here.</p>
        ) : null}
      </div>

      {legacyTokens.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Saved legacy tags</div>
          <p className="mt-2 text-xs leading-6 text-slate-500">These older tags stay until you replace them by updating your areas and help types.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {legacyTokens.map((token) => (
              <span key={token} className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                {formatServiceTokenLabel(token)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
