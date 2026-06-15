import { fmtPrice, fmtPct } from '../lib/format.js';

/**
 * A continuously scrolling market overview of every supported stock — the
 * signature "terminal" element. Fed by the ambient `market` socket event, so it
 * stays live regardless of what the user has subscribed to. Pauses on hover.
 */
export default function TickerTape({ market }) {
  if (!market || market.length === 0) return null;
  const row = [...market, ...market]; // duplicated for a seamless loop

  return (
    <div className="ticker-mask relative overflow-hidden border-y border-line bg-bg-2/60">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-2 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-2 to-transparent" />
      <div className="ticker-track flex w-max items-center gap-8 py-2.5">
        {row.map((s, i) => {
          const up = (s.changePct ?? 0) >= 0;
          return (
            <span key={`${s.ticker}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="text-[13px] font-semibold tracking-wide text-ink">{s.ticker}</span>
              <span className="tnum text-[13px] text-muted">{fmtPrice(s.price)}</span>
              <span className={`tnum text-[12px] ${up ? 'text-up' : 'text-down'}`}>
                {up ? '▲' : '▼'} {fmtPct(s.changePct)}
              </span>
              <span className="ml-5 h-3 w-px bg-line-2" aria-hidden />
            </span>
          );
        })}
      </div>
    </div>
  );
}
