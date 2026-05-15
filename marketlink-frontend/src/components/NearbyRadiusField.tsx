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
};

function getInitialRadiusIndex(initialRadius?: string) {
  const parsed = Number(initialRadius);
  const index = RADIUS_VALUES.findIndex((value) => value === parsed);
  return index >= 0 ? index : 1;
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

  return (
    <div className={`grid gap-4 ${compact ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start' : ''}`}>
      <div className="grid gap-3">
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
          <p className={`text-xs leading-6 ${zip.length > 0 && zip.length < 5 ? 'text-red-600' : 'text-slate-500'}`}>{helperMessage}</p>
        ) : null}
      </div>

      {showRadiusOptions ? (
        <div className={`grid gap-2 ${compact ? 'lg:mt-8' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-800">Distance</div>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              {selectedRadius} mi
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
                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {value} mi
              </button>
            ))}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            {zip.length === 5
              ? `Within ${selectedRadius} miles of ${zip}`
              : `Choose a distance to use once the ZIP code is ready.`}
          </p>

          {zip.length === 5 ? <input type="hidden" name="radius" value={String(selectedRadius)} /> : null}
        </div>
      ) : (
        <p className={`text-xs leading-6 text-slate-500 ${compact ? 'lg:mt-8' : ''}`}>Enter a 5-digit ZIP code to choose a nearby distance.</p>
      )}
    </div>
  );
}
