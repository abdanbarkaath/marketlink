'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import NearbyRadiusField from '@/components/NearbyRadiusField';

type SearchableOption = {
  id: string;
  label: string;
  description: string;
  keywords: readonly string[];
};

type SubjectOption = SearchableOption & {
  subcategories: readonly SearchableOption[];
};

type Props = {
  name?: string;
  zip?: string;
  radius?: string;
  subject?: string;
  subcategory?: string;
  problemId?: string;
  verified?: string;
  fieldClassName: string;
  checkboxClassName: string;
  primaryButtonClassName: string;
  subjectOptions: readonly SubjectOption[];
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function filterSearchableOptions(options: readonly SearchableOption[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [...options];

  return options.filter((option) =>
    [option.label, option.description, ...option.keywords].some((value) => value.toLowerCase().includes(normalizedQuery)),
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
          className="ml-input w-full rounded-[1.05rem] px-4 py-3 pr-10 text-sm"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-expanded={showSuggestions}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

export default function ExpertsDirectoryFilters({
  name = '',
  zip,
  radius,
  subject,
  subcategory,
  problemId,
  verified,
  fieldClassName,
  checkboxClassName,
  primaryButtonClassName,
  subjectOptions,
}: Props) {
  const selectedSubject = subjectOptions.find((option) => option.id === subject) ?? null;
  const selectedSubcategory = selectedSubject?.subcategories.find((option) => option.id === subcategory) ?? null;
  const [subjectId, setSubjectId] = useState(selectedSubject?.id ?? '');
  const [subjectQuery, setSubjectQuery] = useState(selectedSubject?.label ?? '');
  const [subcategoryId, setSubcategoryId] = useState(selectedSubcategory?.id ?? '');
  const [subcategoryQuery, setSubcategoryQuery] = useState(selectedSubcategory?.label ?? '');
  const verifiedChecked = verified === '1' || verified?.toLowerCase() === 'true';
  const subjectNeedsSelection = subjectQuery.trim().length > 0 && !subjectId;
  const subcategoryNeedsSelection = subcategoryQuery.trim().length > 0 && !subcategoryId;
  const selectedSubjectOption = subjectOptions.find((option) => option.id === subjectId) ?? null;
  const filteredSubjectOptions = useMemo(
    () => filterSearchableOptions(subjectOptions, subjectQuery),
    [subjectOptions, subjectQuery],
  );
  const filteredSubcategoryOptions = useMemo(
    () => filterSearchableOptions(selectedSubjectOption?.subcategories ?? [], subcategoryQuery),
    [selectedSubjectOption, subcategoryQuery],
  );
  const hasPendingDropdownSelection = subjectNeedsSelection || subcategoryNeedsSelection;

  return (
    <form method="GET" className="grid gap-3">
      <input type="hidden" name="page" value="1" />
      {problemId ? <input type="hidden" name="problem" value={problemId} /> : null}
      {subjectId ? <input type="hidden" name="subject" value={subjectId} /> : null}
      {subcategoryId ? <input type="hidden" name="subcategory" value={subcategoryId} /> : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)_auto] xl:items-end">
        <NearbyRadiusField
          initialZip={zip}
          initialRadius={radius}
          compact
          hideCompactStatus
          fieldClassName={`${fieldClassName} bg-white`}
          zipLabel="Location ZIP"
          zipPlaceholder="60559"
        />

        <SearchableSelect
          label="Marketing area"
          placeholder="Search areas like ads, SEO, or creators"
          value={subjectQuery}
          options={filteredSubjectOptions}
          onChange={(value) => {
            setSubjectQuery(value);
            setSubjectId('');
            setSubcategoryQuery('');
            setSubcategoryId('');
          }}
          onSelect={(option) => {
            setSubjectId(option.id);
            setSubjectQuery(option.label);
            setSubcategoryQuery('');
            setSubcategoryId('');
          }}
          invalid={subjectNeedsSelection}
          invalidMessage="Choose one marketing area from the dropdown."
          emptyMessage="No matching marketing areas."
        />

        <button type="submit" disabled={hasPendingDropdownSelection} className={`${primaryButtonClassName} gap-2 disabled:cursor-not-allowed disabled:opacity-60`}>
          <span>Filter</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href="/experts" className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900">
          Clear filters
        </Link>
      </div>

      <details className="rounded-[1.15rem] border border-slate-200/90 bg-white px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>More filters</span>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Specific help, name, and verified</span>
        </summary>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px] xl:items-end">
          <SearchableSelect
            label="Specific help"
            placeholder={selectedSubjectOption ? 'Search the matching help types' : 'Choose a marketing area first'}
            value={subcategoryQuery}
            options={filteredSubcategoryOptions}
            onChange={(value) => {
              setSubcategoryQuery(value);
              setSubcategoryId('');
            }}
            onSelect={(option) => {
              setSubcategoryId(option.id);
              setSubcategoryQuery(option.label);
            }}
            invalid={subcategoryNeedsSelection}
            invalidMessage="Choose one help type from the dropdown."
            emptyMessage={selectedSubjectOption ? 'No matching help types.' : 'Choose a marketing area first.'}
          />

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Business name</span>
            <input
              type="text"
              name="name"
              defaultValue={name}
              placeholder="Search by business name"
              className={`${fieldClassName} bg-white`}
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Verification</span>
            <label className="ml-input flex w-full items-center gap-3 rounded-[1.05rem] bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="verified"
                value="1"
                defaultChecked={verifiedChecked}
                className={checkboxClassName}
              />
              Verified only
            </label>
          </div>
        </div>
      </details>
    </form>
  );
}
