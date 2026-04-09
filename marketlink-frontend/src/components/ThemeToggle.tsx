'use client';

import { useEffect, useMemo, useState } from 'react';

export type ThemeKey = 'teal';
export type GradientStyle = 'studio' | 'soft' | 'golden' | 'ambient' | 'dramatic';

type ThemeDefinition = {
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
};

const STORAGE_KEY = 'marketlink_theme';
const GRADIENT_STORAGE_KEY = 'marketlink_gradient';

const GRADIENT_STYLES: Record<GradientStyle, { label: string; pattern: string }> = {
  studio: {
    label: 'Studio',
    pattern:
      'bg-[radial-gradient(800px_ellipse_at_15%_20%,rgba(79,70,229,0.25),transparent_60%),radial-gradient(600px_ellipse_at_85%_80%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(500px_circle_at_60%_-5%,rgba(236,72,153,0.15),transparent_50%),linear-gradient(to_bottom,#f8fafc,#ffffff)]',
  },
  soft: {
    label: 'Soft',
    pattern:
      'bg-[radial-gradient(1200px_ellipse_at_50%_30%,rgba(13,148,136,0.12),transparent_70%),radial-gradient(900px_ellipse_at_70%_70%,rgba(56,189,248,0.08),transparent_65%),radial-gradient(600px_circle_at_20%_80%,rgba(34,197,94,0.06),transparent_60%),linear-gradient(to_bottom,rgba(240,253,250,0.9),#ffffff)]',
  },
  golden: {
    label: 'Golden',
    pattern:
      'bg-[radial-gradient(1000px_ellipse_at_40%_10%,rgba(245,158,11,0.20),transparent_65%),radial-gradient(700px_ellipse_at_80%_60%,rgba(251,113,133,0.15),transparent_60%),radial-gradient(400px_circle_at_10%_90%,rgba(244,63,94,0.12),transparent_55%),linear-gradient(135deg,rgba(255,251,235,0.8),#ffffff)]',
  },
  ambient: {
    label: 'Ambient',
    pattern:
      'bg-[radial-gradient(500px_circle_at_30%_40%,rgba(2,6,23,0.04),transparent_70%),radial-gradient(400px_circle_at_70%_20%,rgba(2,6,23,0.03),transparent_65%),radial-gradient(300px_circle_at_50%_80%,rgba(2,6,23,0.025),transparent_60%),radial-gradient(200px_circle_at_80%_60%,rgba(2,6,23,0.02),transparent_55%),linear-gradient(to_bottom,#f8fafc,#ffffff)]',
  },
  dramatic: {
    label: 'Dramatic',
    pattern:
      'bg-[radial-gradient(700px_ellipse_at_20%_20%,rgba(99,102,241,0.30),transparent_45%),radial-gradient(600px_ellipse_at_80%_80%,rgba(168,85,247,0.25),transparent_40%),radial-gradient(500px_circle_at_80%_20%,rgba(236,72,153,0.22),transparent_35%),radial-gradient(400px_circle_at_20%_80%,rgba(34,197,94,0.20),transparent_30%),linear-gradient(to_bottom,rgba(248,250,252,0.95),#ffffff)]',
  },
};

export const THEMES: Record<string, ThemeDefinition> = {
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

function isThemeKey(v: unknown): v is ThemeKey {
  return v === 'teal';
}

export function useMarketLinkTheme() {
  const [theme, setTheme] = useState<ThemeKey>('teal');
  const [gradientStyle, setGradientStyle] = useState<GradientStyle>('studio');

  useEffect(() => {
    const saved = globalThis.window?.localStorage.getItem(STORAGE_KEY) ?? null;
    const next = isThemeKey(saved) ? saved : 'teal';
    setTheme(next);
    if (globalThis.document) globalThis.document.documentElement.dataset.mlTheme = next;
  }, []);

  useEffect(() => {
    const savedGradient = globalThis.window?.localStorage.getItem(GRADIENT_STORAGE_KEY) ?? null;
    const nextGradient = (Object.keys(GRADIENT_STYLES) as GradientStyle[]).includes(savedGradient as GradientStyle) ? (savedGradient as GradientStyle) : 'studio';
    setGradientStyle(nextGradient);
  }, []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (isThemeKey(detail)) setTheme(detail);
    };
    globalThis.window?.addEventListener('ml-theme-change', onChange);
    return () => globalThis.window?.removeEventListener('ml-theme-change', onChange);
  }, []);

  const t = useMemo(() => {
    const baseTheme = THEMES[theme];
    const gradientPattern = GRADIENT_STYLES[gradientStyle].pattern;

    return {
      ...baseTheme,
      pageBg: gradientPattern,
    };
  }, [theme, gradientStyle]);

  const set = (next: ThemeKey) => {
    setTheme(next);
    globalThis.window?.localStorage.setItem(STORAGE_KEY, next);
    if (globalThis.document) {
      globalThis.document.documentElement.dataset.mlTheme = next;
    }
    globalThis.window?.dispatchEvent(new CustomEvent('ml-theme-change', { detail: next }));
  };

  const setGradient = (next: GradientStyle) => {
    setGradientStyle(next);
    globalThis.window?.localStorage.setItem(GRADIENT_STORAGE_KEY, next);
  };

  const cycleGradient = () => {
    const styles = Object.keys(GRADIENT_STYLES) as GradientStyle[];
    const currentIndex = styles.indexOf(gradientStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setGradient(styles[nextIndex]);
  };

  return { theme, gradientStyle, t, set, setGradient, cycleGradient };
}

export default function ThemeToggle({ compact = false }: Readonly<{ compact?: boolean }>) {
  useMarketLinkTheme();

  return <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>{/* Theme is fixed to teal by default; no visible theme button needed. */}</div>;
}
