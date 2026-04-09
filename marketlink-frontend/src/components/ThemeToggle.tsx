'use client';

import { useEffect, useMemo, useState } from 'react';

export type ThemeKey = 'indigo' | 'teal' | 'sunset' | 'mono';

const STORAGE_KEY = 'marketlink_theme';

export const THEMES: Record<
  ThemeKey,
  {
    label: string;

    // page + surfaces
    pageBg: string;
    header: string;
    surface: string;
    surfaceMuted: string;
    border: string;

    // accents
    brandBadge: string;
    primaryBtn: string;
    secondaryBtn: string;
    card: string;
    cardHover: string;
    accentDot: string;
    mutedText: string;
  }
> = {
  indigo: {
    label: 'Indigo',
    pageBg:
      'bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(79,70,229,0.22),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(14,165,233,0.14),transparent_50%),radial-gradient(700px_circle_at_50%_110%,rgba(236,72,153,0.10),transparent_55%),linear-gradient(to_bottom,#f8fafc,#ffffff)]',
    header: 'bg-white/70 border-slate-200/70',
    surface: 'bg-white/70 backdrop-blur',
    surfaceMuted: 'bg-white/55 backdrop-blur',
    border: 'border-slate-200/80',
    brandBadge: 'bg-indigo-600 text-white',
    primaryBtn: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200',
    secondaryBtn: 'border border-slate-200/80 bg-white/70 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200',
    card: 'border border-slate-200/80 bg-white/70 shadow-[0_18px_50px_rgba(2,6,23,0.10)] backdrop-blur',
    cardHover: 'hover:bg-white/85 hover:shadow-[0_24px_70px_rgba(2,6,23,0.12)]',
    accentDot: 'bg-indigo-600',
    mutedText: 'text-slate-600',
  },

  teal: {
    label: 'Teal',
    pageBg:
      'bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(13,148,136,0.20),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(56,189,248,0.14),transparent_50%),radial-gradient(700px_circle_at_50%_110%,rgba(34,197,94,0.10),transparent_55%),linear-gradient(to_bottom,#f0fdfa,#ffffff)]',
    header: 'bg-white/70 border-slate-200/70',
    surface: 'bg-white/70 backdrop-blur',
    surfaceMuted: 'bg-white/55 backdrop-blur',
    border: 'border-slate-200/80',
    brandBadge: 'bg-teal-600 text-white',
    primaryBtn: 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200',
    secondaryBtn: 'border border-slate-200/80 bg-white/70 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200',
    card: 'border border-slate-200/80 bg-white/70 shadow-[0_18px_50px_rgba(2,6,23,0.10)] backdrop-blur',
    cardHover: 'hover:bg-white/85 hover:shadow-[0_24px_70px_rgba(2,6,23,0.12)]',
    accentDot: 'bg-teal-600',
    mutedText: 'text-slate-600',
  },

  sunset: {
    label: 'Sunset',
    pageBg:
      'bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(245,158,11,0.22),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(251,113,133,0.14),transparent_50%),radial-gradient(700px_circle_at_50%_110%,rgba(244,63,94,0.10),transparent_55%),linear-gradient(to_bottom,#fffbeb,#ffffff)]',
    header: 'bg-white/70 border-slate-200/70',
    surface: 'bg-white/70 backdrop-blur',
    surfaceMuted: 'bg-white/55 backdrop-blur',
    border: 'border-slate-200/80',
    brandBadge: 'bg-gradient-to-br from-amber-500 to-rose-500 text-white',
    primaryBtn: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200',
    secondaryBtn: 'border border-slate-200/80 bg-white/70 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200',
    card: 'border border-slate-200/80 bg-white/70 shadow-[0_18px_50px_rgba(2,6,23,0.10)] backdrop-blur',
    cardHover: 'hover:bg-white/85 hover:shadow-[0_24px_70px_rgba(2,6,23,0.12)]',
    accentDot: 'bg-rose-500',
    mutedText: 'text-slate-600',
  },

  mono: {
    label: 'Mono',
    pageBg:
      'bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(2,6,23,0.12),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(2,6,23,0.08),transparent_50%),linear-gradient(to_bottom,#f8fafc,#ffffff)]',
    header: 'bg-white/70 border-slate-200/70',
    surface: 'bg-white/70 backdrop-blur',
    surfaceMuted: 'bg-white/55 backdrop-blur',
    border: 'border-slate-200/80',
    brandBadge: 'bg-slate-900 text-white',
    primaryBtn: 'bg-slate-900 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200',
    secondaryBtn: 'border border-slate-200/80 bg-white/70 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200',
    card: 'border border-slate-200/80 bg-white/70 shadow-[0_18px_50px_rgba(2,6,23,0.10)] backdrop-blur',
    cardHover: 'hover:bg-white/85 hover:shadow-[0_24px_70px_rgba(2,6,23,0.12)]',
    accentDot: 'bg-slate-900',
    mutedText: 'text-slate-600',
  },
};

function isThemeKey(v: any): v is ThemeKey {
  return v === 'indigo' || v === 'teal' || v === 'sunset' || v === 'mono';
}

export function useMarketLinkTheme() {
  const [theme, setTheme] = useState<ThemeKey>('indigo');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const next = isThemeKey(saved) ? saved : 'indigo';
    setTheme(next);
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-ml-theme', next);
  }, []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (isThemeKey(detail)) setTheme(detail);
    };
    window.addEventListener('ml-theme-change', onChange);
    return () => window.removeEventListener('ml-theme-change', onChange);
  }, []);

  const t = useMemo(() => THEMES[theme], [theme]);

  const set = (next: ThemeKey) => {
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute('data-ml-theme', next);
    window.dispatchEvent(new CustomEvent('ml-theme-change', { detail: next }));
  };

  return { theme, t, set };
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, set } = useMarketLinkTheme();

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
      {/* Mobile: select (doesn't blow up header width) */}
      <label className="sm:hidden">
        <span className="sr-only">Theme</span>
        <select value={theme} onChange={(e) => set(e.target.value as ThemeKey)} className="h-9 rounded-xl border border-slate-200/80 bg-white/70 px-2 text-xs font-medium text-slate-700">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <option key={k} value={k}>
              {THEMES[k].label}
            </option>
          ))}
        </select>
      </label>

      {/* Desktop: buttons */}
      <div className="hidden sm:flex items-center gap-2">
        {!compact ? <span className="text-xs font-medium text-slate-600">Theme</span> : null}

        {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
          const active = theme === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => set(k)}
              className={['h-9 rounded-full px-3 text-xs font-medium transition', 'border border-slate-200/80 bg-white/70 hover:bg-white/90', active ? 'ring-2 ring-slate-900/10' : ''].join(' ')}
              aria-pressed={active}
            >
              {THEMES[k].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
