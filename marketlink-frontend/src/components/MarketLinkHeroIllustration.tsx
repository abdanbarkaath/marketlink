type Props = {
  compact?: boolean;
};

export default function MarketLinkHeroIllustration({ compact = false }: Props) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,232,0.92))] shadow-[0_30px_70px_rgba(18,26,42,0.14)]',
        compact ? 'p-5' : 'p-6 sm:p-7',
      ].join(' ')}
      aria-hidden="true"
    >
      <div className="absolute inset-x-8 top-6 h-12 rounded-full bg-[radial-gradient(circle,rgba(255,214,183,0.75),rgba(255,214,183,0))]" />
      <div className="absolute -right-8 top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(180,224,255,0.8),rgba(180,224,255,0))]" />
      <div className="absolute -left-6 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,235,214,0.8),rgba(255,235,214,0))]" />

      <div className={`relative grid gap-4 ${compact ? '' : 'lg:grid-cols-[1.05fr_0.95fr]'}`}>
        <div className="ml-glass-note rounded-[1.5rem] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Local shortlist</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">Compare experts around your business</div>
            </div>
            <span className="rounded-full bg-[#1f314d] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              Nearby
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
                className={[
                  'grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.2rem] bg-white/90 px-3 py-3 ring-1 ring-slate-200/80',
                  index === 1 ? 'translate-x-2' : '',
                ].join(' ')}
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

        <div className="relative min-h-[260px] overflow-hidden rounded-[1.7rem] bg-[#233553] px-5 py-5 text-white shadow-[0_20px_60px_rgba(18,26,42,0.2)]">
          <div className="absolute left-6 top-6 rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/78">
            Map preview
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
            <path d="M260 98c25 20 44 15 60 4M244 170c34-24 60-20 82 5M287 132c18 15 35 12 49 1" stroke="#94b2d3" strokeLinecap="round" strokeWidth="6" />

            {[
              [272, 108],
              [336, 92],
              [318, 168],
            ].map(([x, y], index) => (
              <g key={`${x}-${y}`}>
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
        </div>
      </div>
    </div>
  );
}
