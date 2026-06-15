import { useEffect, useRef, useState } from 'react';
import Sparkline from './Sparkline.jsx';
import { useTween } from '../lib/useTween.js';
import { fmtPrice, fmtSigned, fmtPct, fmtTime } from '../lib/format.js';

export default function StockCard({ data, onRemove, index = 0 }) {
  const up = (data.change ?? 0) >= 0;
  const tweened = useTween(data.price);
  const [flash, setFlash] = useState(null);
  const prevPrice = useRef(data.price);

  useEffect(() => {
    if (data.price > prevPrice.current) setFlash('up');
    else if (data.price < prevPrice.current) setFlash('down');
    prevPrice.current = data.price;
    const id = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(id);
  }, [data.price, data.ts]);

  return (
    <article
      className="rise group relative overflow-hidden rounded-[18px] border border-line bg-panel/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* gold gleam on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow text-faint">NASDAQ · USD</div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <h3 className="font-display text-[26px] font-semibold leading-none tracking-tight text-ink">
              {data.ticker}
            </h3>
            <span
              className={`tnum rounded-full border px-2 py-0.5 text-[11px] ${
                up ? 'border-up/25 bg-up/10 text-up' : 'border-down/25 bg-down/10 text-down'
              }`}
            >
              {up ? '↑' : '↓'} {fmtPct(data.changePct)}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] text-muted">{data.name}</p>
        </div>

        <button
          onClick={() => onRemove(data.ticker)}
          title="Remove from watchlist"
          aria-label={`Remove ${data.ticker}`}
          className="shrink-0 rounded-lg border border-transparent p-1.5 text-faint opacity-0 transition hover:border-line hover:bg-panel-2 hover:text-down focus:opacity-100 group-hover:opacity-100"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div
          className={`tnum rounded-md px-1 text-[34px] font-medium leading-none text-ink ${
            flash === 'up' ? 'wash-up' : flash === 'down' ? 'wash-down' : ''
          }`}
        >
          <span className="mr-0.5 align-top text-[18px] text-faint">$</span>
          {fmtPrice(tweened)}
        </div>
        <div className={`tnum pb-1 text-right text-[13px] ${up ? 'text-up' : 'text-down'}`}>
          {fmtSigned(data.change)}
        </div>
      </div>

      <div className="mt-4">
        <Sparkline data={data.history} up={up} />
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="eyebrow inline-flex items-center gap-1.5 text-faint" style={{ letterSpacing: '0.2em' }}>
          <span className="breathe h-1 w-1 rounded-full bg-up" />
          Live
        </span>
        <span className="tnum text-[11px] text-faint">{fmtTime(data.ts)}</span>
      </footer>
    </article>
  );
}
