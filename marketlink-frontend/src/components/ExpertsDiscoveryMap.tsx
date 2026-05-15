'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

type MapProvider = {
  id: string;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  verified: boolean;
  distanceMiles?: number;
  latitude?: number | null;
  longitude?: number | null;
};

type Props = {
  providers: MapProvider[];
};

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
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

export default function ExpertsDiscoveryMap({ providers }: Props) {
  const desktopMapRef = useRef<MapRef | null>(null);
  const mobileMapRef = useRef<MapRef | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappableProviders = useMemo(
    () =>
      providers.filter(
        (provider) => typeof provider.latitude === 'number' && typeof provider.longitude === 'number',
      ) as Array<MapProvider & { latitude: number; longitude: number }>,
    [providers],
  );

  const focusedProvider = useMemo(() => {
    const focusId = hoveredId ?? selectedId;
    if (!focusId) return null;
    return mappableProviders.find((provider) => provider.id === focusId) ?? null;
  }, [hoveredId, selectedId, mappableProviders]);

  const cameraProvider = useMemo(() => {
    const focusId = selectedId ?? hoveredId;
    if (!focusId) return null;
    return mappableProviders.find((provider) => provider.id === focusId) ?? null;
  }, [hoveredId, selectedId, mappableProviders]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-provider-id]'));
    if (!nodes.length) return;

    const onEnter = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null;
      const providerId = target?.dataset.providerId;
      if (providerId) setHoveredId(providerId);
    };

    const onLeave = () => {
      setHoveredId(null);
    };

    nodes.forEach((node) => {
      node.addEventListener('mouseenter', onEnter);
      node.addEventListener('mouseleave', onLeave);
      node.addEventListener('focusin', onEnter);
      node.addEventListener('focusout', onLeave);
    });

    return () => {
      nodes.forEach((node) => {
        node.removeEventListener('mouseenter', onEnter);
        node.removeEventListener('mouseleave', onLeave);
        node.removeEventListener('focusin', onEnter);
        node.removeEventListener('focusout', onLeave);
      });
    };
  }, [providers]);

  useEffect(() => {
    const mapRefs = [desktopMapRef.current, mobileMapRef.current].filter(Boolean) as MapRef[];
    if (!mapRefs.length || !mappableProviders.length) return;

    const bounds = new maplibregl.LngLatBounds(
      [mappableProviders[0].longitude, mappableProviders[0].latitude],
      [mappableProviders[0].longitude, mappableProviders[0].latitude],
    );

    for (const provider of mappableProviders.slice(1)) {
      bounds.extend([provider.longitude, provider.latitude]);
    }

    for (const mapInstance of mapRefs) {
      if (cameraProvider) {
        mapInstance.flyTo({
          center: [cameraProvider.longitude, cameraProvider.latitude],
          zoom: Math.max(mapInstance.getZoom(), 11),
          duration: 500,
        });
      } else {
        mapInstance.fitBounds(bounds, {
          padding: 48,
          duration: 0,
          maxZoom: 11,
        });
      }
    }
  }, [cameraProvider, mappableProviders]);

  useEffect(() => {
    const resizeMaps = () => {
      desktopMapRef.current?.resize();
      mobileMapRef.current?.resize();
    };

    const handleLayoutChange = () => {
      window.requestAnimationFrame(resizeMaps);
    };

    handleLayoutChange();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, { passive: true });

    return () => {
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange);
    };
  }, []);

  function renderMarkers() {
    return mappableProviders.map((provider) => {
      const isActive = provider.id === hoveredId || (!hoveredId && provider.id === selectedId);

      return (
        <Marker
          key={provider.id}
          longitude={provider.longitude}
          latitude={provider.latitude}
          anchor="bottom"
          style={{ width: '32px', height: '40px' }}
        >
          <button
            type="button"
            onClick={() => setSelectedId((current) => (current === provider.id ? null : provider.id))}
            className="group relative inline-flex -translate-y-1 flex-col items-center outline-none"
            aria-label={provider.businessName}
          >
            <span
              className={`absolute top-[6px] h-11 w-11 rounded-full transition ${
                isActive ? 'bg-[#1f314d]/18' : 'bg-[#1f314d]/10'
              }`}
              aria-hidden="true"
            />
            <span
              className={`relative grid h-8 w-8 place-items-center rounded-full border-2 transition ${
                isActive
                  ? 'scale-110 border-slate-900 bg-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.28)]'
                  : 'border-white bg-[#1f314d] shadow-[0_10px_22px_rgba(15,23,42,0.22)]'
              }`}
              aria-hidden="true"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <span
              className={`relative -mt-1 h-3 w-3 rotate-45 border-r-2 border-b-2 transition ${
                isActive ? 'border-slate-900 bg-slate-900' : 'border-white bg-[#1f314d]'
              }`}
              aria-hidden="true"
            />
          </button>
        </Marker>
      );
    });
  }

  function renderFocusedCard() {
    if (!focusedProvider) return null;

    return (
      <div className="pointer-events-auto absolute inset-x-4 bottom-4 rounded-[1.2rem] bg-white/96 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/90">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Highlighted expert</div>
            <Link
              href={`/experts/${focusedProvider.slug}`}
              className="mt-1 inline-flex text-base font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700 hover:decoration-slate-500"
            >
              {focusedProvider.businessName}
            </Link>
            <div className="mt-1 text-sm text-slate-600">
              {focusedProvider.city}, {focusedProvider.state}
              {typeof focusedProvider.distanceMiles === 'number' ? ` | ${focusedProvider.distanceMiles} miles away` : ''}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {focusedProvider.verified ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                Verified
              </span>
            ) : null}
            <Link
              href={`/experts/${focusedProvider.slug}`}
              className="inline-flex items-center text-sm font-semibold text-slate-900 transition hover:text-slate-700"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!mappableProviders.length) {
    return (
      <>
        <section className="ml-card rounded-[1.6rem] px-5 py-5 shadow-[0_16px_40px_rgba(23,26,31,0.06)] lg:hidden">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Map view</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Locations will appear here</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Map pins show up once the current result set has saved coordinates.</p>
        </section>
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <div className="ml-card rounded-[1.8rem] px-5 py-5 shadow-[0_16px_40px_rgba(23,26,31,0.06)] sm:px-6 sm:py-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Map view</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Locations will appear here</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Map pins show up once the current result set has saved coordinates.</p>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <section className="lg:hidden">
        <div className="ml-card overflow-hidden rounded-[1.6rem] shadow-[0_16px_40px_rgba(23,26,31,0.06)]">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Map view</div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Tap a pin to see the expert</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{mappableProviders.length} pinned experts in this result set.</p>
          </div>
          <div className="relative">
            <div className="h-[320px] w-full">
              <Map
                ref={mobileMapRef}
                mapLib={maplibregl}
                initialViewState={{
                  longitude: mappableProviders[0].longitude,
                  latitude: mappableProviders[0].latitude,
                  zoom: 9,
                }}
                mapStyle={MAP_STYLE}
              >
                {renderMarkers()}
                <NavigationControl position="top-right" showCompass={false} />
              </Map>
            </div>
            {renderFocusedCard()}
          </div>
        </div>
      </section>

      <aside className="hidden lg:block lg:sticky lg:top-24">
        <div className="ml-card overflow-hidden rounded-[1.8rem] shadow-[0_16px_40px_rgba(23,26,31,0.06)]">
          <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Map view</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">See who is nearby</h2>
              <div className="text-xs font-medium text-slate-500">{mappableProviders.length} pinned</div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Hover a result card to highlight its location on the map.</p>
          </div>

          <div className="relative">
            <div className="h-[min(560px,calc(100vh-190px))] min-h-[420px] w-full">
              <Map
                ref={desktopMapRef}
                mapLib={maplibregl}
                initialViewState={{
                  longitude: mappableProviders[0].longitude,
                  latitude: mappableProviders[0].latitude,
                  zoom: 9,
                }}
                mapStyle={MAP_STYLE}
              >
                {renderMarkers()}
                <NavigationControl position="top-right" showCompass={false} />
              </Map>
            </div>

            {renderFocusedCard()}
          </div>
        </div>
      </aside>
    </>
  );
}
