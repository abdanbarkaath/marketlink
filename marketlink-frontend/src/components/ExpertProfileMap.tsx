'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

type Props = {
  businessName: string;
  locationLabel: string;
  locationPrecision?: 'exact' | 'approximate' | null;
  latitude?: number | null;
  longitude?: number | null;
};

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
} as const;

export default function ExpertProfileMap({ businessName, locationLabel, locationPrecision, latitude, longitude }: Props) {
  const isApproximate = locationPrecision === 'approximate';

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Map view</div>
        <div className="mt-2 text-white">{locationLabel}</div>
        <div className="mt-2 text-slate-300">
          {isApproximate ? 'This expert shares an approximate service area instead of an exact pin.' : 'Map coordinates are not available for this expert yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white">
      <div className="relative h-56 w-full">
        <Map
          mapLib={maplibregl}
          initialViewState={{
            longitude,
            latitude,
            zoom: isApproximate ? 10 : 12,
          }}
          mapStyle={MAP_STYLE}
        >
          <Marker longitude={longitude} latitude={latitude} anchor="bottom" style={{ width: '32px', height: '40px' }}>
            <div className="relative inline-flex -translate-y-1 flex-col items-center">
              <span className="absolute top-[6px] h-11 w-11 rounded-full bg-[#1f314d]/16" aria-hidden="true" />
              <span className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#1f314d] shadow-[0_10px_22px_rgba(15,23,42,0.22)]" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="relative -mt-1 h-3 w-3 rotate-45 border-r-2 border-b-2 border-white bg-[#1f314d]" aria-hidden="true" />
            </div>
          </Marker>
          <NavigationControl position="top-right" showCompass={false} />
        </Map>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-[1.2rem] bg-white/96 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/90">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {isApproximate ? 'Approximate area' : 'Location'}
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900">{businessName}</div>
          <div className="mt-1 text-sm text-slate-600">{locationLabel}</div>
          {isApproximate ? <div className="mt-1 text-xs font-medium text-slate-500">Shown as a broader city-level area for privacy.</div> : null}
        </div>
      </div>
    </div>
  );
}
