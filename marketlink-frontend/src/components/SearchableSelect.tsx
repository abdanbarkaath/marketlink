'use client';

import { useId, useState } from 'react';

export type SearchableOption = {
  id: string;
  label: string;
  description: string;
  detail?: string;
  keywords: readonly string[];
};

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

export default function SearchableSelect({
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const messageId = `${listId}-message`;
  const showEmptyState = open && value.trim().length > 0 && options.length === 0;
  const showSuggestions = open && options.length > 0;

  return (
    <div className="grid gap-2">
      <label htmlFor={`${listId}-input`} className="ml-select-label text-sm text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={`${listId}-input`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => { setOpen(true); setActiveIndex(-1); }}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setActiveIndex(-1);
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              const nextIndex = options.length === 0 ? -1 : event.key === 'ArrowDown'
                ? (activeIndex + 1) % options.length
                : activeIndex <= 0 ? options.length - 1 : activeIndex - 1;
              setActiveIndex(nextIndex);
              document.getElementById(`${listId}-option-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });
            } else if (event.key === 'Enter' && open && activeIndex >= 0 && options[activeIndex]) {
              event.preventDefault();
              onSelect(options[activeIndex]);
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          placeholder={placeholder}
          className="ml-input w-full px-4 py-3 pr-10"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-expanded={showSuggestions}
          aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid || helperText ? messageId : undefined}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="m5 7 5 6 5-6" /></svg>
        </span>

        {showSuggestions ? (
          <div className="ml-select-panel absolute z-30 mt-2 w-full overflow-hidden bg-white">
            <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-2">
              {options.map((option, index) => (
                <li key={option.id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      onSelect(option);
                      setOpen(false);
                      setActiveIndex(-1);
                    }}
                    className={`cursor-pointer px-4 py-3 text-left transition hover:bg-slate-50 ${activeIndex === index ? 'bg-slate-100' : ''}`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">{option.description}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-500 ">
            {emptyMessage}
          </div>
        ) : null}
      </div>
      {invalid ? (
        <p id={messageId} className="text-xs leading-6 text-red-600">{invalidMessage}</p>
      ) : helperText ? (
        <p id={messageId} className="text-xs leading-6 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
