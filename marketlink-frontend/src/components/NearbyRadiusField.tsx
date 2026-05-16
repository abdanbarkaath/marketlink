'use client';

import { useEffect, useState } from 'react';

const RADIUS_VALUES = [5, 10, 20, 50, 100] as const;

type Props = {
  initialZip?: string;
  initialRadius?: string;
  zipRequired?: boolean;
  fieldClassName: string;
  zipLabel?: string;
  zipPlaceholder?: string;
  helperText?: string;
  compact?: boolean;
  hideCompactStatus?: boolean;
};

function getInitialRadiusIndex(initialRadius?: string) {
  const parsed = Number(initialRadius);
  const index = RADIUS_VALUES.findIndex((value) => value === parsed);
  return index >= 0 ? index : 1;
}

function FieldIcon({ kind }: { kind: 'location' | 'distance' }) {
  const className = 'h-3.5 w-3.5 text-slate-500';

  if (kind === 'location') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M12 21s6-4.8 6-10a6 6 0 1 0-12 0c0 5.2 6 10 6 10Z" />
        <circle cx="12" cy="11" r="2.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12l4.2-3.1" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function NearbyRadiusField({
  initialZip = '',
  initialRadius = '10',
  zipRequired = false,
  fieldClassName,
  zipLabel = 'ZIP code',
  zipPlaceholder = '60559',
  helperText,
  compact = false,
  hideCompactStatus = false,
}: Props) {
  const [zip, setZip] = useState(initialZip.replace(/\D/g, '').slice(0, 5));
  const [selectedRadius, setSelectedRadius] = useState(RADIUS_VALUES[getInitialRadiusIndex(initialRadius)]);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    let permissionStatus: PermissionStatus | null = null;

    async function checkPermission() {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator) || !('permissions' in navigator)) {
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (!active) return;

        const syncState = () => {
          if (!active) return;
          setGeolocationEnabled(permissionStatus?.state === 'granted');
        };

        syncState();
        permissionStatus.onchange = syncState;
      } catch {
        // Keep geolocation as an optional progressive enhancement only.
      }
    }

    checkPermission();

    return () => {
      active = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  const showRadiusOptions = zip.length === 5 || geolocationEnabled;
  const helperMessage =
    zip.length > 0 && zip.length < 5
      ? 'Enter a full 5-digit ZIP code.'
      : helperText ?? null;

  if (compact) {
    return (
      <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_180px] md:items-end">
        <label className="grid gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <FieldIcon kind="location" />
            <span>{zipLabel}</span>
          </span>
          <input
            type="search"
            name="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder={zipPlaceholder}
            className={fieldClassName}
            title="Enter a 5-digit ZIP code."
            required={zipRequired}
          />
        </label>

        <label className="grid gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <FieldIcon kind="distance" />
            <span>Distance</span>
          </span>
          <select
            name="radius"
            value={String(selectedRadius)}
            onChange={(e) => setSelectedRadius(Number(e.target.value) as (typeof RADIUS_VALUES)[number])}
            disabled={!showRadiusOptions}
            className={fieldClassName}
          >
            {!showRadiusOptions ? <option value="">Choose ZIP first</option> : null}
            {RADIUS_VALUES.map((value) => (
              <option key={value} value={value}>
                Within {value} miles
              </option>
            ))}
          </select>
        </label>

        {!hideCompactStatus ? (
          helperMessage ? (
            <p className={`text-xs leading-5 md:col-span-2 ${zip.length > 0 && zip.length < 5 ? 'text-red-600' : 'text-slate-500'}`}>{helperMessage}</p>
          ) : zip.length === 5 ? (
            <p className="text-xs leading-5 text-slate-500 md:col-span-2">Searching within {selectedRadius} miles of {zip}.</p>
          ) : null
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">{zipLabel}</span>
          <input
            type="search"
            name="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder={zipPlaceholder}
            className={fieldClassName}
            title="Enter a 5-digit ZIP code."
            required={zipRequired}
          />
        </label>

        {helperMessage ? (
          <p className={`text-xs leading-5 ${zip.length > 0 && zip.length < 5 ? 'text-red-600' : 'text-slate-500'}`}>{helperMessage}</p>
        ) : null}
      </div>

      {showRadiusOptions ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-800">Distance</div>
            <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200/80">
              {selectedRadius} mi radius
            </span>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Search radius">
            {RADIUS_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRadius(value)}
                aria-pressed={selectedRadius === value}
                className={`inline-flex min-h-10 items-center justify-center rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                  selectedRadius === value
                    ? 'border-[#1f314d] bg-[#1f314d] text-white shadow-[0_10px_22px_rgba(31,49,77,0.18)]'
                    : 'border-slate-200/85 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {value} mi
              </button>
            ))}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            {zip.length === 5
              ? `Showing experts within ${selectedRadius} miles of ${zip}.`
              : `Choose a distance to use once the ZIP code is ready.`}
          </p>

          {zip.length === 5 ? <input type="hidden" name="radius" value={String(selectedRadius)} /> : null}
        </div>
      ) : (
        <p className="text-xs leading-5 text-slate-500">Enter a 5-digit ZIP code to unlock nearby distance options.</p>
      )}
    </div>
  );
}
