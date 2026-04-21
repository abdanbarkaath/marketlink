'use client';

import { useEffect, useMemo, useState } from 'react';

export type ThemeKey =
  | 'graphite-sage'
  | 'coastal-indigo'
  | 'midnight-plum'
  | 'forest-moss'
  | 'terracotta-ink'
  | 'monochrome-stone'
  | 'alpine-teal'
  | 'orchid-dusk'
  | 'ember-slate'
  | 'ink-porcelain';

type ThemeDefinition = {
  label: string;
  shortLabel: string;
  swatch: string;
  css: Record<string, string>;
};

type ThemeTokens = {
  pageBg: string;
  header: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  brandBadge: string;
  primaryBtn: string;
  secondaryBtn: string;
  card: string;
  cardHover: string;
  accentDot: string;
  mutedText: string;
  headerText: string;
  headerMutedText: string;
};

const STORAGE_KEY = 'marketlink-theme';

const THEME_TOKENS: ThemeTokens = {
  pageBg: 'ml-page-bg',
  header: 'ml-header',
  surface: 'ml-surface',
  surfaceMuted: 'ml-surface-muted',
  border: 'ml-border',
  brandBadge: 'ml-brand-badge',
  primaryBtn: 'ml-btn-primary',
  secondaryBtn: 'ml-btn-secondary',
  card: 'ml-card',
  cardHover: 'ml-card-hover',
  accentDot: 'bg-[rgb(var(--ml-accent))]',
  mutedText: 'ml-text-muted',
  headerText: 'text-[rgb(var(--ml-header-text))]',
  headerMutedText: 'text-[rgb(var(--ml-header-muted))]/72',
};

const THEMES: Record<ThemeKey, ThemeDefinition> = {
  'graphite-sage': {
    label: 'Graphite Sage',
    shortLabel: 'Graph',
    swatch: 'linear-gradient(135deg,#181C22 0%,#2B3440 46%,#DCE4E7 46%,#F3F5F7 76%,#6F8F84 100%)',
    css: {
      '--ml-text': '24 28 34',
      '--ml-muted': '91 105 114',
      '--ml-border': '207 216 222',
      '--ml-surface': '243 245 247',
      '--ml-surface-2': '220 228 233',
      '--ml-primary': '24 28 34',
      '--ml-primary-hover': '15 23 42',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(220, 228, 233, 0.44), transparent 30%), radial-gradient(circle at top right, rgba(111, 143, 132, 0.10), transparent 26%), linear-gradient(180deg, rgba(243, 245, 247, 0.995) 0%, rgba(236, 240, 243, 1) 48%, rgba(228, 234, 238, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(232, 238, 241, 0.98), rgba(219, 227, 232, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(238, 242, 245, 0.98), rgba(226, 233, 237, 0.96))',
      '--ml-glow': '0 24px 72px rgba(23, 26, 31, 0.10)',
      '--ml-ring': 'rgba(111, 143, 132, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(43, 52, 64, 0.96), rgba(24, 28, 34, 0.98))',
      '--ml-header-border': 'rgba(66, 76, 87, 0.8)',
      '--ml-header-text': '243 245 247',
      '--ml-header-muted': '220 228 233',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(220, 228, 233, 1), rgba(194, 206, 212, 1))',
      '--ml-brand-fg': '24 28 34',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(43, 52, 64, 1), rgba(24, 28, 34, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(52, 63, 76, 1), rgba(31, 37, 45, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(232, 238, 241, 0.96), rgba(219, 227, 232, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(239, 243, 245, 0.98), rgba(227, 234, 238, 0.96))',
      '--ml-btn-secondary-text': '24 28 34',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(232, 238, 241, 0.94), rgba(219, 227, 232, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(243, 245, 247, 0.98), rgba(232, 238, 241, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(243, 245, 247, 0.98), rgba(231, 236, 239, 0.94))',
      '--ml-pill-bg': 'rgba(243, 245, 247, 0.92)',
      '--ml-pill-muted-bg': 'rgba(220, 228, 233, 0.84)',
      '--ml-pill-text': '91 105 114',
      '--ml-pill-muted-text': '100 113 122',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(43, 52, 64, 1), rgba(24, 28, 34, 1))',
      '--ml-dark-panel-border': 'rgba(66, 76, 87, 0.85)',
      '--ml-dark-panel-text': '243 245 247',
      '--ml-accent': '111 143 132',
    },
  },
  'coastal-indigo': {
    label: 'Coastal Indigo',
    shortLabel: 'Indigo',
    swatch: 'linear-gradient(135deg,#0F172A 0%,#25324A 48%,#FFFFFF 48%,#F7F4EF 78%,#B6BDC8 100%)',
    css: {
      '--ml-text': '15 23 42',
      '--ml-muted': '96 104 116',
      '--ml-border': '227 228 232',
      '--ml-surface': '255 255 255',
      '--ml-surface-2': '250 247 243',
      '--ml-primary': '15 23 42',
      '--ml-primary-hover': '10 18 34',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(246, 242, 238, 0.34), transparent 30%), radial-gradient(circle at top right, rgba(230, 232, 236, 0.08), transparent 24%), linear-gradient(180deg, rgba(255, 255, 255, 0.998) 0%, rgba(252, 251, 249, 1) 52%, rgba(248, 245, 241, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(255, 255, 255, 0.985), rgba(250, 247, 243, 0.95))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(253, 252, 250, 0.985), rgba(247, 243, 239, 0.96))',
      '--ml-glow': '0 24px 72px rgba(15, 23, 42, 0.10)',
      '--ml-ring': 'rgba(91, 127, 163, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(37, 50, 74, 0.96), rgba(15, 23, 42, 0.98))',
      '--ml-header-border': 'rgba(56, 70, 97, 0.82)',
      '--ml-header-text': '248 250 252',
      '--ml-header-muted': '236 239 244',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(252, 250, 247, 1), rgba(242, 238, 232, 1))',
      '--ml-brand-fg': '15 23 42',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(37, 50, 74, 1), rgba(15, 23, 42, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(46, 62, 90, 1), rgba(20, 30, 52, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(250, 247, 243, 0.95))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(253, 252, 250, 0.985), rgba(247, 243, 239, 0.96))',
      '--ml-btn-secondary-text': '15 23 42',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(250, 247, 243, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(252, 251, 249, 0.985), rgba(246, 243, 239, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(255, 255, 255, 0.985), rgba(250, 247, 243, 0.94))',
      '--ml-pill-bg': 'rgba(255, 255, 255, 0.92)',
      '--ml-pill-muted-bg': 'rgba(246, 243, 239, 0.84)',
      '--ml-pill-text': '96 104 116',
      '--ml-pill-muted-text': '111 102 92',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(37, 50, 74, 1), rgba(15, 23, 42, 1))',
      '--ml-dark-panel-border': 'rgba(56, 70, 97, 0.85)',
      '--ml-dark-panel-text': '248 250 252',
      '--ml-accent': '91 127 163',
    },
  },
  'midnight-plum': {
    label: 'Midnight Plum',
    shortLabel: 'Plum',
    swatch: 'linear-gradient(135deg,#17121F 0%,#30263D 46%,#E1DAEA 46%,#F6F3F8 76%,#7E6B9C 100%)',
    css: {
      '--ml-text': '32 24 42',
      '--ml-muted': '107 96 126',
      '--ml-border': '219 210 231',
      '--ml-surface': '246 243 248',
      '--ml-surface-2': '225 218 234',
      '--ml-primary': '23 18 31',
      '--ml-primary-hover': '14 11 21',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(225, 218, 234, 0.40), transparent 28%), radial-gradient(circle at top right, rgba(126, 107, 156, 0.12), transparent 24%), linear-gradient(180deg, rgba(246, 243, 248, 0.995) 0%, rgba(237, 232, 242, 1) 48%, rgba(229, 223, 236, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(234, 228, 240, 0.98), rgba(223, 215, 233, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(240, 235, 245, 0.98), rgba(229, 221, 238, 0.96))',
      '--ml-glow': '0 24px 72px rgba(23, 18, 31, 0.12)',
      '--ml-ring': 'rgba(126, 107, 156, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(48, 38, 61, 0.96), rgba(23, 18, 31, 0.98))',
      '--ml-header-border': 'rgba(73, 60, 91, 0.82)',
      '--ml-header-text': '246 243 248',
      '--ml-header-muted': '225 218 234',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(225, 218, 234, 1), rgba(203, 190, 219, 1))',
      '--ml-brand-fg': '23 18 31',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(48, 38, 61, 1), rgba(23, 18, 31, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(58, 47, 73, 1), rgba(31, 24, 42, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(234, 228, 240, 0.96), rgba(223, 215, 233, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(240, 235, 245, 0.98), rgba(229, 221, 238, 0.96))',
      '--ml-btn-secondary-text': '23 18 31',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(234, 228, 240, 0.94), rgba(223, 215, 233, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(246, 243, 248, 0.98), rgba(234, 228, 240, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(246, 243, 248, 0.98), rgba(236, 230, 242, 0.94))',
      '--ml-pill-bg': 'rgba(246, 243, 248, 0.92)',
      '--ml-pill-muted-bg': 'rgba(225, 218, 234, 0.82)',
      '--ml-pill-text': '107 96 126',
      '--ml-pill-muted-text': '116 101 137',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(48, 38, 61, 1), rgba(23, 18, 31, 1))',
      '--ml-dark-panel-border': 'rgba(73, 60, 91, 0.85)',
      '--ml-dark-panel-text': '246 243 248',
      '--ml-accent': '126 107 156',
    },
  },
  'forest-moss': {
    label: 'Forest Moss',
    shortLabel: 'Moss',
    swatch: 'linear-gradient(135deg,#18201B 0%,#33443B 46%,#DCE5DA 46%,#F2F5F0 76%,#6D8A6F 100%)',
    css: {
      '--ml-text': '24 32 27',
      '--ml-muted': '88 99 89',
      '--ml-border': '205 216 203',
      '--ml-surface': '242 245 240',
      '--ml-surface-2': '220 229 218',
      '--ml-primary': '24 32 27',
      '--ml-primary-hover': '16 22 18',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(220, 229, 218, 0.40), transparent 30%), radial-gradient(circle at top right, rgba(109, 138, 111, 0.12), transparent 24%), linear-gradient(180deg, rgba(242, 245, 240, 0.995) 0%, rgba(234, 239, 232, 1) 48%, rgba(225, 232, 223, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(229, 235, 226, 0.98), rgba(214, 223, 212, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(236, 241, 232, 0.98), rgba(221, 229, 217, 0.96))',
      '--ml-glow': '0 24px 72px rgba(24, 32, 27, 0.10)',
      '--ml-ring': 'rgba(109, 138, 111, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(51, 68, 59, 0.96), rgba(24, 32, 27, 0.98))',
      '--ml-header-border': 'rgba(70, 90, 76, 0.82)',
      '--ml-header-text': '242 245 240',
      '--ml-header-muted': '220 229 218',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(220, 229, 218, 1), rgba(192, 206, 190, 1))',
      '--ml-brand-fg': '24 32 27',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(51, 68, 59, 1), rgba(24, 32, 27, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(61, 80, 69, 1), rgba(31, 41, 35, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(229, 235, 226, 0.96), rgba(214, 223, 212, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(236, 241, 232, 0.98), rgba(221, 229, 217, 0.96))',
      '--ml-btn-secondary-text': '24 32 27',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(229, 235, 226, 0.94), rgba(214, 223, 212, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(242, 245, 240, 0.98), rgba(229, 235, 226, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(242, 245, 240, 0.98), rgba(231, 237, 229, 0.94))',
      '--ml-pill-bg': 'rgba(242, 245, 240, 0.92)',
      '--ml-pill-muted-bg': 'rgba(220, 229, 218, 0.84)',
      '--ml-pill-text': '88 99 89',
      '--ml-pill-muted-text': '98 114 100',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(51, 68, 59, 1), rgba(24, 32, 27, 1))',
      '--ml-dark-panel-border': 'rgba(70, 90, 76, 0.85)',
      '--ml-dark-panel-text': '242 245 240',
      '--ml-accent': '109 138 111',
    },
  },
  'terracotta-ink': {
    label: 'Terracotta Ink',
    shortLabel: 'Terra',
    swatch: 'linear-gradient(135deg,#1F1D1E 0%,#393337 46%,#E9DDD5 46%,#F8F3EF 76%,#C76F4D 100%)',
    css: {
      '--ml-text': '31 29 30',
      '--ml-muted': '113 91 81',
      '--ml-border': '227 213 203',
      '--ml-surface': '248 243 239',
      '--ml-surface-2': '233 221 213',
      '--ml-primary': '31 29 30',
      '--ml-primary-hover': '20 18 19',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(233, 221, 213, 0.40), transparent 30%), radial-gradient(circle at top right, rgba(199, 111, 77, 0.12), transparent 24%), linear-gradient(180deg, rgba(248, 243, 239, 0.995) 0%, rgba(242, 234, 228, 1) 48%, rgba(235, 225, 217, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(239, 228, 220, 0.98), rgba(228, 214, 205, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(245, 236, 230, 0.98), rgba(233, 220, 211, 0.96))',
      '--ml-glow': '0 24px 72px rgba(31, 29, 30, 0.11)',
      '--ml-ring': 'rgba(199, 111, 77, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(57, 51, 55, 0.96), rgba(31, 29, 30, 0.98))',
      '--ml-header-border': 'rgba(78, 70, 75, 0.82)',
      '--ml-header-text': '248 243 239',
      '--ml-header-muted': '233 221 213',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(233, 221, 213, 1), rgba(217, 197, 186, 1))',
      '--ml-brand-fg': '31 29 30',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(57, 51, 55, 1), rgba(31, 29, 30, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(68, 61, 66, 1), rgba(38, 35, 37, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(239, 228, 220, 0.96), rgba(228, 214, 205, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(245, 236, 230, 0.98), rgba(233, 220, 211, 0.96))',
      '--ml-btn-secondary-text': '31 29 30',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(239, 228, 220, 0.94), rgba(228, 214, 205, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(248, 243, 239, 0.98), rgba(239, 228, 220, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(248, 243, 239, 0.98), rgba(241, 230, 223, 0.94))',
      '--ml-pill-bg': 'rgba(248, 243, 239, 0.92)',
      '--ml-pill-muted-bg': 'rgba(233, 221, 213, 0.84)',
      '--ml-pill-text': '113 91 81',
      '--ml-pill-muted-text': '126 98 86',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(57, 51, 55, 1), rgba(31, 29, 30, 1))',
      '--ml-dark-panel-border': 'rgba(78, 70, 75, 0.85)',
      '--ml-dark-panel-text': '248 243 239',
      '--ml-accent': '199 111 77',
    },
  },
  'monochrome-stone': {
    label: 'Monochrome Stone',
    shortLabel: 'Mono',
    swatch: 'linear-gradient(135deg,#181A1D 0%,#3B4148 46%,#DDE1E6 46%,#F6F7F8 76%,#9AA3AE 100%)',
    css: {
      '--ml-text': '28 31 35',
      '--ml-muted': '102 110 120',
      '--ml-border': '213 219 225',
      '--ml-surface': '246 247 248',
      '--ml-surface-2': '221 225 230',
      '--ml-primary': '24 26 29',
      '--ml-primary-hover': '16 18 21',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(221, 225, 230, 0.42), transparent 30%), radial-gradient(circle at top right, rgba(154, 163, 174, 0.12), transparent 24%), linear-gradient(180deg, rgba(246, 247, 248, 0.995) 0%, rgba(238, 241, 243, 1) 48%, rgba(229, 233, 237, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(234, 238, 241, 0.98), rgba(223, 228, 233, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(241, 244, 246, 0.98), rgba(230, 235, 239, 0.96))',
      '--ml-glow': '0 24px 72px rgba(24, 26, 29, 0.10)',
      '--ml-ring': 'rgba(154, 163, 174, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(59, 65, 72, 0.96), rgba(24, 26, 29, 0.98))',
      '--ml-header-border': 'rgba(81, 88, 97, 0.82)',
      '--ml-header-text': '246 247 248',
      '--ml-header-muted': '221 225 230',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(221, 225, 230, 1), rgba(199, 205, 212, 1))',
      '--ml-brand-fg': '24 26 29',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(59, 65, 72, 1), rgba(24, 26, 29, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(70, 77, 85, 1), rgba(32, 35, 39, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(234, 238, 241, 0.96), rgba(223, 228, 233, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(241, 244, 246, 0.98), rgba(230, 235, 239, 0.96))',
      '--ml-btn-secondary-text': '28 31 35',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(234, 238, 241, 0.94), rgba(223, 228, 233, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(246, 247, 248, 0.98), rgba(234, 238, 241, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(246, 247, 248, 0.98), rgba(235, 239, 242, 0.94))',
      '--ml-pill-bg': 'rgba(246, 247, 248, 0.92)',
      '--ml-pill-muted-bg': 'rgba(221, 225, 230, 0.84)',
      '--ml-pill-text': '102 110 120',
      '--ml-pill-muted-text': '114 122 132',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(59, 65, 72, 1), rgba(24, 26, 29, 1))',
      '--ml-dark-panel-border': 'rgba(81, 88, 97, 0.85)',
      '--ml-dark-panel-text': '246 247 248',
      '--ml-accent': '154 163 174',
    },
  },
  'alpine-teal': {
    label: 'Alpine Teal',
    shortLabel: 'Teal',
    swatch: 'linear-gradient(135deg,#102125 0%,#1F474F 46%,#D7E8E8 46%,#F1F7F7 76%,#3A8B8F 100%)',
    css: {
      '--ml-text': '18 34 37',
      '--ml-muted': '83 110 114',
      '--ml-border': '202 220 220',
      '--ml-surface': '241 247 247',
      '--ml-surface-2': '215 232 232',
      '--ml-primary': '16 33 37',
      '--ml-primary-hover': '10 24 27',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(215, 232, 232, 0.42), transparent 30%), radial-gradient(circle at top right, rgba(58, 139, 143, 0.13), transparent 24%), linear-gradient(180deg, rgba(241, 247, 247, 0.995) 0%, rgba(231, 241, 241, 1) 48%, rgba(221, 234, 234, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(227, 238, 238, 0.98), rgba(214, 228, 228, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(235, 243, 243, 0.98), rgba(222, 233, 233, 0.96))',
      '--ml-glow': '0 24px 72px rgba(16, 33, 37, 0.10)',
      '--ml-ring': 'rgba(58, 139, 143, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(31, 71, 79, 0.96), rgba(16, 33, 37, 0.98))',
      '--ml-header-border': 'rgba(46, 88, 95, 0.82)',
      '--ml-header-text': '241 247 247',
      '--ml-header-muted': '215 232 232',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(215, 232, 232, 1), rgba(186, 214, 214, 1))',
      '--ml-brand-fg': '16 33 37',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(31, 71, 79, 1), rgba(16, 33, 37, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(38, 87, 96, 1), rgba(20, 41, 46, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(227, 238, 238, 0.96), rgba(214, 228, 228, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(235, 243, 243, 0.98), rgba(222, 233, 233, 0.96))',
      '--ml-btn-secondary-text': '18 34 37',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(227, 238, 238, 0.94), rgba(214, 228, 228, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(241, 247, 247, 0.98), rgba(227, 238, 238, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(241, 247, 247, 0.98), rgba(229, 239, 239, 0.94))',
      '--ml-pill-bg': 'rgba(241, 247, 247, 0.92)',
      '--ml-pill-muted-bg': 'rgba(215, 232, 232, 0.84)',
      '--ml-pill-text': '83 110 114',
      '--ml-pill-muted-text': '70 122 124',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(31, 71, 79, 1), rgba(16, 33, 37, 1))',
      '--ml-dark-panel-border': 'rgba(46, 88, 95, 0.85)',
      '--ml-dark-panel-text': '241 247 247',
      '--ml-accent': '58 139 143',
    },
  },
  'orchid-dusk': {
    label: 'Orchid Dusk',
    shortLabel: 'Orchid',
    swatch: 'linear-gradient(135deg,#1C1625 0%,#433054 46%,#E8DFF0 46%,#F8F3FB 76%,#A56CC1 100%)',
    css: {
      '--ml-text': '34 24 45',
      '--ml-muted': '112 97 128',
      '--ml-border': '226 216 236',
      '--ml-surface': '248 243 251',
      '--ml-surface-2': '232 223 240',
      '--ml-primary': '28 22 37',
      '--ml-primary-hover': '18 14 25',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(232, 223, 240, 0.40), transparent 30%), radial-gradient(circle at top right, rgba(165, 108, 193, 0.12), transparent 24%), linear-gradient(180deg, rgba(248, 243, 251, 0.995) 0%, rgba(240, 233, 246, 1) 48%, rgba(232, 224, 239, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(237, 229, 243, 0.98), rgba(226, 217, 234, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(243, 236, 247, 0.98), rgba(232, 223, 239, 0.96))',
      '--ml-glow': '0 24px 72px rgba(28, 22, 37, 0.11)',
      '--ml-ring': 'rgba(165, 108, 193, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(67, 48, 84, 0.96), rgba(28, 22, 37, 0.98))',
      '--ml-header-border': 'rgba(88, 67, 108, 0.82)',
      '--ml-header-text': '248 243 251',
      '--ml-header-muted': '232 223 240',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(232, 223, 240, 1), rgba(214, 197, 226, 1))',
      '--ml-brand-fg': '28 22 37',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(67, 48, 84, 1), rgba(28, 22, 37, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(80, 58, 99, 1), rgba(37, 28, 48, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(237, 229, 243, 0.96), rgba(226, 217, 234, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(243, 236, 247, 0.98), rgba(232, 223, 239, 0.96))',
      '--ml-btn-secondary-text': '34 24 45',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(237, 229, 243, 0.94), rgba(226, 217, 234, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(248, 243, 251, 0.98), rgba(237, 229, 243, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(248, 243, 251, 0.98), rgba(239, 232, 245, 0.94))',
      '--ml-pill-bg': 'rgba(248, 243, 251, 0.92)',
      '--ml-pill-muted-bg': 'rgba(232, 223, 240, 0.84)',
      '--ml-pill-text': '112 97 128',
      '--ml-pill-muted-text': '125 96 146',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(67, 48, 84, 1), rgba(28, 22, 37, 1))',
      '--ml-dark-panel-border': 'rgba(88, 67, 108, 0.85)',
      '--ml-dark-panel-text': '248 243 251',
      '--ml-accent': '165 108 193',
    },
  },
  'ember-slate': {
    label: 'Ember Slate',
    shortLabel: 'Ember',
    swatch: 'linear-gradient(135deg,#201A19 0%,#453330 46%,#EADFDA 46%,#FAF4F1 76%,#D96D4C 100%)',
    css: {
      '--ml-text': '34 27 25',
      '--ml-muted': '116 92 84',
      '--ml-border': '229 216 210',
      '--ml-surface': '250 244 241',
      '--ml-surface-2': '234 223 218',
      '--ml-primary': '32 26 25',
      '--ml-primary-hover': '20 16 15',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(234, 223, 218, 0.40), transparent 30%), radial-gradient(circle at top right, rgba(217, 109, 76, 0.12), transparent 24%), linear-gradient(180deg, rgba(250, 244, 241, 0.995) 0%, rgba(244, 236, 232, 1) 48%, rgba(236, 226, 221, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(241, 231, 226, 0.98), rgba(230, 218, 212, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(246, 238, 234, 0.98), rgba(235, 223, 217, 0.96))',
      '--ml-glow': '0 24px 72px rgba(32, 26, 25, 0.11)',
      '--ml-ring': 'rgba(217, 109, 76, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(69, 51, 48, 0.96), rgba(32, 26, 25, 0.98))',
      '--ml-header-border': 'rgba(94, 72, 68, 0.82)',
      '--ml-header-text': '250 244 241',
      '--ml-header-muted': '234 223 218',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(234, 223, 218, 1), rgba(220, 202, 194, 1))',
      '--ml-brand-fg': '32 26 25',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(69, 51, 48, 1), rgba(32, 26, 25, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(82, 61, 57, 1), rgba(40, 32, 30, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(241, 231, 226, 0.96), rgba(230, 218, 212, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(246, 238, 234, 0.98), rgba(235, 223, 217, 0.96))',
      '--ml-btn-secondary-text': '34 27 25',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(241, 231, 226, 0.94), rgba(230, 218, 212, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(250, 244, 241, 0.98), rgba(241, 231, 226, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(250, 244, 241, 0.98), rgba(242, 233, 228, 0.94))',
      '--ml-pill-bg': 'rgba(250, 244, 241, 0.92)',
      '--ml-pill-muted-bg': 'rgba(234, 223, 218, 0.84)',
      '--ml-pill-text': '116 92 84',
      '--ml-pill-muted-text': '131 95 86',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(69, 51, 48, 1), rgba(32, 26, 25, 1))',
      '--ml-dark-panel-border': 'rgba(94, 72, 68, 0.85)',
      '--ml-dark-panel-text': '250 244 241',
      '--ml-accent': '217 109 76',
    },
  },
  'ink-porcelain': {
    label: 'Ink Porcelain',
    shortLabel: 'Porcel',
    swatch: 'linear-gradient(135deg,#15171B 0%,#2E3640 46%,#E3E8EE 46%,#FBFCFD 76%,#4E78A0 100%)',
    css: {
      '--ml-text': '24 29 35',
      '--ml-muted': '98 109 123',
      '--ml-border': '216 224 232',
      '--ml-surface': '251 252 253',
      '--ml-surface-2': '227 232 238',
      '--ml-primary': '21 23 27',
      '--ml-primary-hover': '13 15 18',
      '--ml-primary-contrast': '248 250 252',
      '--ml-bg-grad':
        'radial-gradient(circle at top left, rgba(227, 232, 238, 0.40), transparent 30%), radial-gradient(circle at top right, rgba(78, 120, 160, 0.12), transparent 24%), linear-gradient(180deg, rgba(251, 252, 253, 0.995) 0%, rgba(242, 245, 248, 1) 48%, rgba(232, 237, 242, 1) 100%)',
      '--ml-card-grad': 'linear-gradient(180deg, rgba(238, 242, 246, 0.98), rgba(226, 232, 238, 0.94))',
      '--ml-card-hover-grad': 'linear-gradient(180deg, rgba(244, 247, 249, 0.98), rgba(233, 238, 243, 0.96))',
      '--ml-glow': '0 24px 72px rgba(21, 23, 27, 0.10)',
      '--ml-ring': 'rgba(78, 120, 160, 0.22)',
      '--ml-header-bg': 'linear-gradient(180deg, rgba(46, 54, 64, 0.96), rgba(21, 23, 27, 0.98))',
      '--ml-header-border': 'rgba(68, 78, 91, 0.82)',
      '--ml-header-text': '251 252 253',
      '--ml-header-muted': '227 232 238',
      '--ml-brand-bg': 'linear-gradient(180deg, rgba(227, 232, 238, 1), rgba(206, 214, 223, 1))',
      '--ml-brand-fg': '21 23 27',
      '--ml-btn-primary-bg': 'linear-gradient(180deg, rgba(46, 54, 64, 1), rgba(21, 23, 27, 1))',
      '--ml-btn-primary-hover': 'linear-gradient(180deg, rgba(57, 67, 79, 1), rgba(29, 33, 39, 1))',
      '--ml-btn-secondary-bg': 'linear-gradient(180deg, rgba(238, 242, 246, 0.96), rgba(226, 232, 238, 0.94))',
      '--ml-btn-secondary-hover': 'linear-gradient(180deg, rgba(244, 247, 249, 0.98), rgba(233, 238, 243, 0.96))',
      '--ml-btn-secondary-text': '24 29 35',
      '--ml-surface-grad': 'linear-gradient(180deg, rgba(238, 242, 246, 0.94), rgba(226, 232, 238, 0.96))',
      '--ml-surface-muted-grad': 'linear-gradient(180deg, rgba(251, 252, 253, 0.98), rgba(238, 242, 246, 0.9))',
      '--ml-input-grad': 'linear-gradient(180deg, rgba(251, 252, 253, 0.98), rgba(241, 245, 248, 0.94))',
      '--ml-pill-bg': 'rgba(251, 252, 253, 0.92)',
      '--ml-pill-muted-bg': 'rgba(227, 232, 238, 0.84)',
      '--ml-pill-text': '98 109 123',
      '--ml-pill-muted-text': '88 112 137',
      '--ml-dark-panel-bg': 'linear-gradient(180deg, rgba(46, 54, 64, 1), rgba(21, 23, 27, 1))',
      '--ml-dark-panel-border': 'rgba(68, 78, 91, 0.85)',
      '--ml-dark-panel-text': '251 252 253',
      '--ml-accent': '78 120 160',
    },
  },
};

function isThemeKey(v: unknown): v is ThemeKey {
  return typeof v === 'string' && v in THEMES;
}

function applyTheme(theme: ThemeDefinition) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(theme.css).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useMarketLinkTheme() {
  const [theme, setTheme] = useState<ThemeKey>('coastal-indigo');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && isThemeKey(saved)) {
      setTheme(saved);
      return;
    }
    applyTheme(THEMES['coastal-indigo']);
  }, []);

  useEffect(() => {
    const active = THEMES[theme];
    applyTheme(active);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const t = useMemo(() => THEME_TOKENS, []);

  return {
    theme,
    t,
    themes: THEMES,
    set: setTheme,
  };
}

export default function ThemeToggle({ compact = false }: Readonly<{ compact?: boolean }>) {
  const { theme, themes, set } = useMarketLinkTheme();

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      {(Object.entries(themes) as [ThemeKey, ThemeDefinition][]).map(([key, value]) => (
        <button
          key={key}
          type="button"
          aria-label={`Switch to ${value.label}`}
          title={value.label}
          onClick={() => set(key)}
          className={`group relative h-7 w-7 rounded-full border transition ${theme === key ? 'scale-105 border-white/80 shadow-[0_0_0_2px_rgba(255,255,255,0.22)]' : 'border-black/10 opacity-85 hover:opacity-100'}`}
          style={{ background: value.swatch }}
        >
          {!compact ? (
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white group-hover:block">
              {value.shortLabel}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
