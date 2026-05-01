'use client';

type HomepageDiscoveryAnimationProps = {
  compact?: boolean;
};

export function HomepageDiscoveryAnimation({ compact = false }: HomepageDiscoveryAnimationProps) {
  return (
    <div
      data-testid={compact ? 'mobile-homepage-discovery-animation' : 'desktop-homepage-discovery-animation'}
      className={[
        'overflow-hidden rounded-[1.75rem] bg-white/82 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80',
        compact ? 'mt-6 p-4' : 'mt-1 max-w-2xl p-5',
      ].join(' ')}
      aria-label="Find local experts, compare best fits, and get real results"
    >
      <div
        className={[
          'motion-stage relative overflow-hidden rounded-[1.35rem] bg-slate-50 ring-1 ring-slate-200/75',
          compact ? 'min-h-[190px]' : 'min-h-[250px]',
        ].join(' ')}
      >
        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm ring-1 ring-slate-200/70">
          MarketLink flow
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(219,242,255,0.92),rgba(248,250,252,0.68)_48%,rgba(248,250,252,0)_70%)]" />
        <div className={compact ? 'hidden' : 'absolute left-[23%] top-[42%] h-[34%] w-[54%] rounded-full border-b-2 border-r-2 border-sky-200/90'} />

        {compact ? (
          <div className="relative z-10 flex min-h-[190px] flex-col justify-end gap-2 px-4 pb-4 pt-12">
            <div
              data-testid="mobile-homepage-discovery-visual-label"
              className="stage-card rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80"
            >
              <div className="text-[11px] font-semibold text-slate-500">Business need</div>
              <div className="mt-1 text-sm font-semibold leading-tight text-slate-950">Find local experts</div>
            </div>

            <div
              data-testid="mobile-homepage-discovery-visual-label"
              className="stage-card stage-compare ml-5 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80"
            >
              <div className="text-[11px] font-semibold text-slate-500">Shortlist</div>
              <div className="mt-1 text-sm font-semibold leading-tight text-slate-950">Compare best fits</div>
            </div>

            <div
              data-testid="mobile-homepage-discovery-visual-label"
              className="stage-result ml-10 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm ring-2 ring-emerald-500/70"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">OK</span>
              Get real results
            </div>
          </div>
        ) : (
          <>
            <div
              data-testid="desktop-homepage-discovery-visual-label"
              className="stage-card stage-find absolute left-[7%] top-[24%] z-10 w-[45%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80"
            >
              <div className="text-[11px] font-semibold text-slate-500">Business need</div>
              <div className="mt-2 text-sm font-semibold leading-tight text-slate-950">Find local experts</div>
              <div className="mt-3 h-2 w-20 rounded-full bg-slate-200" />
            </div>

            <div
              data-testid="desktop-homepage-discovery-visual-label"
              className="stage-card stage-compare absolute left-[34%] top-[46%] z-10 w-[48%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80"
            >
              <div className="text-[11px] font-semibold text-slate-500">Shortlist</div>
              <div className="mt-2 text-sm font-semibold leading-tight text-slate-950">Compare best fits</div>
              <div className="mt-3 grid gap-2">
                <span className="h-2 w-28 rounded-full bg-blue-200" />
                <span className="h-2 w-20 rounded-full bg-rose-200" />
              </div>
            </div>

            <div
              data-testid="desktop-homepage-discovery-visual-label"
              className="stage-result absolute bottom-[10%] right-[8%] z-20 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm ring-2 ring-emerald-500/70"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">OK</span>
              Get real results
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .motion-stage {
          contain: layout paint;
        }

        .stage-card,
        .stage-result {
          animation: stageIn 520ms ease-out both;
        }

        .stage-compare {
          animation-delay: 120ms;
        }

        .stage-result {
          animation-delay: 240ms;
        }

        @keyframes stageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stage-card,
          .stage-result {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
