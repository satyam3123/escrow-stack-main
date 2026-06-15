import { fmtPrice, fmtPct } from '../lib/format.js';

/** Elegant chips for the supported stocks the user hasn't subscribed to yet. */
export default function AddStockBar({ catalog, subscribed, market, onAdd }) {
  const available = catalog.filter((s) => !subscribed.includes(s.ticker));
  if (catalog.length === 0) return null;

  // Prefer the live market price when we have it.
  const liveBy = Object.fromEntries((market || []).map((m) => [m.ticker, m]));

  return (
    <section>
      <div className="eyebrow mb-3 text-faint">Add to watchlist</div>

      {available.length === 0 ? (
        <p className="text-sm text-muted">You're tracking all {catalog.length} supported instruments.</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {available.map((s) => {
            const live = liveBy[s.ticker];
            const pct = live?.changePct;
            const up = (pct ?? 0) >= 0;
            return (
              <button
                key={s.ticker}
                onClick={() => onAdd(s.ticker)}
                className="group flex items-center gap-3 rounded-xl border border-line bg-panel/60 py-2 pl-3.5 pr-3 transition hover:border-gold/40 hover:bg-panel-2"
              >
                <span className="font-display text-[15px] font-semibold text-ink">{s.ticker}</span>
                <span className="tnum text-xs text-muted">{fmtPrice(live?.price ?? s.price)}</span>
                {pct != null && (
                  <span className={`tnum text-[11px] ${up ? 'text-up' : 'text-down'}`}>{fmtPct(pct)}</span>
                )}
                <span className="grid h-5 w-5 place-items-center rounded-full border border-line text-faint transition group-hover:border-gold/50 group-hover:text-gold">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
