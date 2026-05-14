'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SuggestionType = 'city' | 'state' | 'postcode' | 'address';

export type LocationSuggestion = {
  label?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  zip?: string | null;
  latitude?: number;
  longitude?: number;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onResolve?: (suggestion: LocationSuggestion) => void;
  type: SuggestionType;
  placeholder?: string;
  required?: boolean;
  fieldClass: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  helperText?: string;
};

function getMinimumCharacters(type: SuggestionType) {
  if (type === 'postcode') return 3;
  return 2;
}

function getDisplayValue(type: SuggestionType, suggestion: LocationSuggestion) {
  if (type === 'postcode') return suggestion.zip || '';
  if (type === 'state') return suggestion.state || suggestion.stateCode || '';
  if (type === 'address') return suggestion.label || '';
  return suggestion.city || '';
}

function getSuggestionLabel(type: SuggestionType, suggestion: LocationSuggestion) {
  if (type === 'address') {
    return suggestion.label || '';
  }
  if (type === 'postcode') {
    const cityState = [suggestion.city, suggestion.stateCode || suggestion.state].filter(Boolean).join(', ');
    return [suggestion.zip, cityState].filter(Boolean).join(' - ');
  }

  if (type === 'state') {
    if (suggestion.state && suggestion.stateCode) {
      return `${suggestion.state} (${suggestion.stateCode})`;
    }
    return suggestion.state || suggestion.stateCode || suggestion.label || '';
  }

  const statePart = suggestion.stateCode || suggestion.state;
  return [suggestion.city, statePart].filter(Boolean).join(', ');
}

export default function LocationAutocompleteField({
  label,
  value,
  onChange,
  onResolve,
  type,
  placeholder,
  required,
  fieldClass,
  autoComplete,
  inputMode,
  maxLength,
  helperText,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const fetchIdRef = useRef(0);
  const confirmedSelectionRef = useRef(true);

  const trimmedValue = value.trim();
  const minCharacters = useMemo(() => getMinimumCharacters(type), [type]);

  useEffect(() => {
    if (trimmedValue.length < minCharacters) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);

    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedValue, type });
        const res = await fetch(`${API_BASE}/location/autocomplete?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          if (currentFetchId === fetchIdRef.current) {
            setSuggestions([]);
          }
          return;
        }

        const body = (await res.json().catch(() => null)) as { suggestions?: LocationSuggestion[] } | null;
        if (currentFetchId !== fetchIdRef.current) {
          return;
        }

        setSuggestions(Array.isArray(body?.suggestions) ? body!.suggestions! : []);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [minCharacters, trimmedValue, type]);

  const handleSelect = (suggestion: LocationSuggestion) => {
    confirmedSelectionRef.current = true;
    setSelectionError(null);
    onChange(getDisplayValue(type, suggestion));
    onResolve?.(suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);

      if (!trimmedValue) {
        confirmedSelectionRef.current = true;
        setSelectionError(null);
        return;
      }

      if (confirmedSelectionRef.current) {
        setSelectionError(null);
        return;
      }

      onChange('');
      setSuggestions([]);
      setSelectionError('Choose a value from the dropdown.');
    }, 120);
  };

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        className={fieldClass}
        value={value}
        onChange={(e) => {
          confirmedSelectionRef.current = false;
          setSelectionError(null);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-autocomplete="list"
        aria-controls={listId}
      />

      {helperText ? <p className="mt-2 text-xs leading-6 text-slate-500">{helperText}</p> : null}
      {selectionError ? <p className="mt-2 text-xs leading-6 text-red-600">{selectionError}</p> : null}

      {showSuggestions ? (
        <div id={listId} className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <ul className="max-h-64 overflow-y-auto py-2">
            {suggestions.map((suggestion, index) => (
              <li key={`${getSuggestionLabel(type, suggestion)}-${index}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  {getSuggestionLabel(type, suggestion)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {open && loading && trimmedValue.length >= minCharacters ? <p className="mt-2 text-xs text-slate-500">Looking up suggestions...</p> : null}
    </div>
  );
}
