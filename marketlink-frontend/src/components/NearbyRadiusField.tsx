'use client';

import { useEffect, useMemo, useState } from 'react';

const RADIUS_VALUES = [5, 10, 20, 50, 100] as const;

type Props = {
  initialZip?: string;
  initialRadius?: string;
  zipRequired?: boolean;
  fieldClassName: string;
  zipLabel?: string;
  zipPlaceholder?: string;
  helperText?: string;
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
}: Props) {
  const [zip, setZip] = useState(initialZip.replace(/\D/g, '').slice(0, 5));
  const [radiusIndex, setRadiusIndex] = useState(getInitialRadiusIndex(initialRadius));
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

  const showSlider = zip.length === 5 || geolocationEnabled;
  const selectedRadius = useMemo(() => RADIUS_VALUES[radiusIndex], [radiusIndex]);

  return (
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

      {zip.length > 0 && zip.length < 5 ? (
        <p className="text-xs leading-6 text-red-600">Enter a full 5-digit ZIP code.</p>
      ) : helperText ? (
        <p className="text-xs leading-6 text-slate-500">{helperText}</p>
      ) : null}

      {showSlider ? (
        <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-800">Radius</div>
            <div className="text-sm font-semibold text-slate-900">{selectedRadius} miles</div>
          </div>

          <input
            type="range"
            min={0}
            max={RADIUS_VALUES.length - 1}
            step={1}
            value={radiusIndex}
            onChange={(e) => setRadiusIndex(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
            aria-label="Search radius"
          />

          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500">
            {RADIUS_VALUES.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>

          <p className="mt-3 text-xs leading-6 text-slate-600">
            {zip.length === 5
              ? `${selectedRadius} miles from ZIP code ${zip}`
              : `${selectedRadius} mile radius is ready. Enter a ZIP code to search nearby experts.`}
          </p>

          {zip.length === 5 ? <input type="hidden" name="radius" value={String(selectedRadius)} /> : null}
        </div>
      ) : (
        <p className="text-xs leading-6 text-slate-500">Enter a 5-digit ZIP code to unlock the distance slider.</p>
      )}
    </div>
  );
}
