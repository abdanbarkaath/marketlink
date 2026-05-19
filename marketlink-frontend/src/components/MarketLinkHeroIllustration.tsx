type Props = {
  compact?: boolean;
};

export default function MarketLinkHeroIllustration({ compact = false }: Props) {
  return (
    <div
      className={[
        'pointer-events-none relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,232,0.92))] shadow-[0_30px_70px_rgba(18,26,42,0.14)]',
        compact ? 'p-5' : 'p-6 sm:p-7',
      ].join(' ')}
      aria-hidden="true"
    >
      <div className="absolute inset-x-8 top-6 h-12 rounded-full bg-[radial-gradient(circle,rgba(255,214,183,0.75),rgba(255,214,183,0))]" />
      <div className="absolute -right-8 top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(180,224,255,0.8),rgba(180,224,255,0))]" />
      <div className="absolute -left-6 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,235,214,0.8),rgba(255,235,214,0))]" />

      <div className="relative grid gap-4">
        <div className="hero-command-bar inline-flex items-center gap-3 self-start rounded-full border border-white/75 bg-white/84 px-4 py-2 shadow-[0_14px_30px_rgba(18,26,42,0.09)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Search mode</span>
          <span className="hero-command-track inline-flex items-center gap-2 rounded-full bg-[#1f314d] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            Find nearby experts in Chicago
            <span className="hero-command-dot h-2 w-2 rounded-full bg-[#ffd8bd]" />
          </span>
        </div>

        <div className={compact ? '' : 'lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:gap-4'}>
        <div className="ml-glass-note hero-preview-panel rounded-[1.5rem] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Local shortlist</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">Compare experts around your business</div>
            </div>
            <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Preview
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {[
              ['SEO', 'Westmont, IL'],
              ['Creators', 'Naperville, IL'],
              ['Web', 'Oak Park, IL'],
            ].map(([service, location], index) => (
              <div
                key={`${service}-${location}`}
                className="hero-shortlist-card grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.2rem] bg-white/90 px-3 py-3 ring-1 ring-slate-200/80"
                style={{ animationDelay: `${index * 1.1}s`, ['--ml-shift' as string]: index === 1 ? '8px' : '0px' }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-[1rem] bg-[#1f314d] text-xs font-semibold text-white">
                  {service.slice(0, 1)}
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{service}</div>
                  <div className="text-xs text-slate-500">{location}</div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#e38360]" />
              </div>
            ))}
          </div>
        </div>

        <div className="hero-map-panel relative min-h-[260px] overflow-hidden rounded-[1.7rem] bg-[#233553] px-5 py-5 text-white shadow-[0_20px_60px_rgba(18,26,42,0.2)]">
          <div className="absolute left-6 top-6 rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/78">
            Map preview
          </div>
          <div className="absolute right-5 top-5 flex items-center gap-2">
            <span className="hero-view-pill rounded-full border border-white/16 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
              List
            </span>
            <span className="hero-view-pill hero-view-pill-active rounded-full border border-white/24 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f314d]">
              Map
            </span>
          </div>
          <div className="hero-map-search absolute left-6 top-16 z-20 rounded-full border border-white/16 bg-[#15233a]/88 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/78 shadow-[0_10px_24px_rgba(15,23,42,0.2)]">
            Search 60601
          </div>

          <svg viewBox="0 0 420 280" className="mt-10 h-full w-full" role="presentation">
            <defs>
              <linearGradient id="surface" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#fbfcff" />
                <stop offset="100%" stopColor="#f0f4fb" />
              </linearGradient>
              <linearGradient id="warm" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd8bd" />
                <stop offset="100%" stopColor="#e38360" />
              </linearGradient>
              <linearGradient id="cool" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#cae6ff" />
                <stop offset="100%" stopColor="#7ca6d8" />
              </linearGradient>
            </defs>

            <rect x="20" y="48" width="220" height="170" rx="26" fill="url(#surface)" />
            <path d="M50 90h160M50 118h120M50 145h140M50 172h110" stroke="#d8e0ec" strokeLinecap="round" strokeWidth="10" />
            <rect x="44" y="74" width="70" height="18" rx="9" fill="#233553" opacity="0.9" />
            <rect x="140" y="74" width="48" height="18" rx="9" fill="#ffd8bd" />

            <rect x="204" y="36" width="190" height="208" rx="32" fill="#f7f4ef" />
            <path
              d="M229 70c31-29 62-20 87 4 23 22 48 30 76 10v126c-31 28-59 20-84-2-24-22-48-27-79-10z"
              fill="#d7e9fb"
            />
            <path className="hero-map-route hero-map-route-one" d="M260 98c25 20 44 15 60 4" stroke="#94b2d3" strokeLinecap="round" strokeWidth="6" />
            <path className="hero-map-route hero-map-route-two" d="M244 170c34-24 60-20 82 5" stroke="#94b2d3" strokeLinecap="round" strokeWidth="6" />
            <path className="hero-map-route hero-map-route-three" d="M287 132c18 15 35 12 49 1" stroke="#94b2d3" strokeLinecap="round" strokeWidth="6" />

            {[
              [272, 108],
              [336, 92],
              [318, 168],
            ].map(([x, y], index) => (
              <g key={`${x}-${y}`} className={`hero-pin hero-pin-${index + 1}`}>
                <circle cx={x} cy={y} r={index === 0 ? 19 : 17} fill="#233553" />
                <circle cx={x} cy={y} r={7} fill="#fff" />
                <path d={`M${x} ${y + 18}l8 10h-16z`} fill="#233553" />
              </g>
            ))}

            <rect x="274" y="190" width="118" height="44" rx="18" fill="#fff" />
            <circle cx="300" cy="212" r="13" fill="url(#warm)" />
            <path d="M321 203h45M321 216h32" stroke="#d8e0ec" strokeLinecap="round" strokeWidth="8" />

            <circle cx="88" cy="244" r="38" fill="url(#warm)" opacity="0.55" />
            <circle cx="154" cy="252" r="28" fill="url(#cool)" opacity="0.55" />
          </svg>
          <span className="hero-search-pulse absolute right-[5.4rem] top-[6.1rem] h-12 w-12 rounded-full border border-white/55" />
          <span className="hero-search-pulse hero-search-pulse-delay absolute right-[5.1rem] top-[5.8rem] h-16 w-16 rounded-full border border-white/30" />
        </div>
        </div>

        <div className="ml-glass-note hero-flow-panel rounded-[1.5rem] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1">Search nearby</span>
            <span className="hero-flow-arrow text-slate-400">→</span>
            <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1">Find on map</span>
            <span className="hero-flow-arrow text-slate-400">→</span>
            <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1">Open shortlist</span>
            <span className="hero-flow-arrow text-slate-400">→</span>
            <span className="rounded-full border border-slate-200/80 bg-white/82 px-3 py-1">Contact the best fit</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-command-bar {
          animation: commandFloat 5.4s ease-in-out infinite;
        }

        .hero-command-track {
          position: relative;
          overflow: hidden;
        }

        .hero-command-track::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.18) 44%, transparent 72%);
          transform: translateX(-130%);
          animation: shimmerSweep 4.4s ease-in-out infinite;
        }

        .hero-command-dot {
          animation: pingDot 1.4s ease-in-out infinite;
        }

        .hero-preview-panel,
        .hero-map-panel,
        .hero-flow-panel {
          animation: panelFloat 8s ease-in-out infinite;
        }

        .hero-map-panel {
          animation-delay: 0.6s;
        }

        .hero-flow-panel {
          animation-delay: 1.1s;
        }

        .hero-shortlist-card {
          animation: shortlistPulse 6.6s ease-in-out infinite;
        }

        .hero-flow-arrow {
          animation: flowArrowPulse 4.8s ease-in-out infinite;
        }

        .hero-view-pill {
          animation: pillFade 6s ease-in-out infinite;
        }

        .hero-view-pill-active {
          animation: pillActive 6s ease-in-out infinite;
        }

        .hero-map-search {
          animation: searchPulse 4.8s ease-in-out infinite;
        }

        .hero-map-route {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: routeDraw 5.6s ease-in-out infinite;
        }

        .hero-map-route-two {
          animation-delay: 0.45s;
        }

        .hero-map-route-three {
          animation-delay: 0.9s;
        }

        .hero-pin {
          transform-origin: center;
          opacity: 0.3;
          animation: pinDrop 5.6s ease-in-out infinite;
        }

        .hero-pin-2 {
          animation-delay: 0.6s;
        }

        .hero-pin-3 {
          animation-delay: 1.1s;
        }

        .hero-search-pulse {
          animation: searchRing 2.6s ease-out infinite;
        }

        .hero-search-pulse-delay {
          animation-delay: 1.1s;
        }

        @keyframes commandFloat {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes shimmerSweep {
          0% {
            transform: translateX(-130%);
          }

          38%,
          100% {
            transform: translateX(135%);
          }
        }

        @keyframes pingDot {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.4);
            opacity: 0.78;
          }
        }

        @keyframes panelFloat {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes shortlistPulse {
          0%,
          100% {
            transform: translateX(var(--ml-shift, 0px)) scale(1);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          }

          18% {
            transform: translateX(calc(var(--ml-shift, 0px) + 4px)) scale(1.01);
            box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
          }

          36% {
            transform: translateX(var(--ml-shift, 0px)) scale(1);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          }
        }

        @keyframes pillFade {
          0%,
          24%,
          100% {
            opacity: 0.58;
          }

          12% {
            opacity: 1;
          }
        }

        @keyframes pillActive {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          }

          18% {
            transform: scale(1.04);
            box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
          }
        }

        @keyframes searchPulse {
          0%,
          100% {
            transform: translateX(0px);
            opacity: 0.78;
          }

          50% {
            transform: translateX(6px);
            opacity: 1;
          }
        }

        @keyframes routeDraw {
          0%,
          14% {
            stroke-dashoffset: 120;
            opacity: 0.08;
          }

          30%,
          72% {
            stroke-dashoffset: 0;
            opacity: 1;
          }

          100% {
            stroke-dashoffset: -120;
            opacity: 0.12;
          }
        }

        @keyframes pinDrop {
          0%,
          16%,
          100% {
            transform: translateY(-10px) scale(0.9);
            opacity: 0.2;
          }

          28%,
          70% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }

          36% {
            transform: translateY(2px) scale(1.07);
          }
        }

        @keyframes searchRing {
          0% {
            transform: scale(0.4);
            opacity: 0.65;
          }

          80% {
            transform: scale(1.12);
            opacity: 0;
          }

          100% {
            transform: scale(1.12);
            opacity: 0;
          }
        }

        @keyframes flowArrowPulse {
          0%,
          100% {
            opacity: 0.3;
            transform: translateX(0);
          }

          50% {
            opacity: 1;
            transform: translateX(3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-command-bar,
          .hero-command-track::after,
          .hero-command-dot,
          .hero-preview-panel,
          .hero-map-panel,
          .hero-flow-panel,
          .hero-view-pill,
          .hero-view-pill-active,
          .hero-map-search,
          .hero-map-route,
          .hero-pin,
          .hero-search-pulse,
          .hero-shortlist-card,
          .hero-flow-arrow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
