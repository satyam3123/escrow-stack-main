import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import StockCard from './StockCard.jsx';
import AddStockBar from './AddStockBar.jsx';
import ConnectionBadge from './ConnectionBadge.jsx';
import TickerTape from './TickerTape.jsx';
import { fmtTime } from '../lib/format.js';

const MAX_HISTORY = 60;

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const socketRef = useRef(null);

  const [status, setStatus] = useState('connecting');
  const [subscriptions, setSubscriptions] = useState([]);
  const [prices, setPrices] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [market, setMarket] = useState([]);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    api.stocks().then(setCatalog).catch(() => {});
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));
    socket.io.on('reconnect_attempt', () => setStatus('connecting'));

    socket.on('snapshot', ({ subscriptions: subs, prices: snap }) => {
      setSubscriptions(subs);
      setPrices((prev) => ({ ...prev, ...snap }));
    });
    socket.on('subscriptions', (list) => {
      setSubscriptions(list);
      setPrices((prev) => Object.fromEntries(Object.entries(prev).filter(([t]) => list.includes(t))));
    });
    socket.on('price', (tick) => {
      setPrices((prev) => {
        const existing = prev[tick.ticker];
        const history = existing?.history ? [...existing.history, tick.price].slice(-MAX_HISTORY) : [tick.price];
        return { ...prev, [tick.ticker]: { ...existing, ...tick, history } };
      });
    });
    socket.on('market', (all) => setMarket(all));

    return () => socket.close();
  }, [token]);

  const subscribe = (ticker) => socketRef.current?.emit('subscribe', { ticker });
  const unsubscribe = (ticker) => socketRef.current?.emit('unsubscribe', { ticker });

  const cards = useMemo(() => subscriptions.map((t) => prices[t]).filter(Boolean), [subscriptions, prices]);

  return (
    <div className="atmosphere grain min-h-screen">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-gold/30 bg-gold/10">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.8">
                <path d="M3 17l5-5 4 4 8-8" />
                <path d="M16 8h5v5" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="font-display text-[18px] font-semibold tracking-tight text-ink">Escrow Stack</div>
              <div className="eyebrow text-faint">Live Markets</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <ConnectionBadge status={status} />
            <div className="hidden text-right sm:block">
              <div className="eyebrow text-faint">Account</div>
              <div className="max-w-[190px] truncate text-[13px] text-muted">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-line bg-panel/60 px-3 py-1.5 text-[13px] text-muted transition hover:border-gold/40 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
        <TickerTape market={market} />
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">
        {/* Section heading */}
        <div className="rise flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-gold">Portfolio</div>
            <h1 className="mt-1.5 font-display text-[30px] font-medium tracking-tight text-ink">Your watchlist</h1>
          </div>
          <div className="text-right">
            <div className="tnum text-[15px] text-ink">{fmtTime(clock)}</div>
            <div className="eyebrow text-faint">
              {subscriptions.length} tracked · 1s refresh
            </div>
          </div>
        </div>

        <div className="rule-gold" />

        <div className="rise" style={{ animationDelay: '60ms' }}>
          <AddStockBar catalog={catalog} subscribed={subscriptions} market={market} onAdd={subscribe} />
        </div>

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((data, i) => (
              <StockCard key={data.ticker} data={data} onRemove={unsubscribe} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rise grid place-items-center rounded-2xl border border-dashed border-line bg-panel/30 px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-gold/20 bg-gold/5 text-gold">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 3 3 5-5" />
        </svg>
      </div>
      <h3 className="mt-5 font-display text-[20px] font-medium text-ink">Your terminal is quiet</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted">
        Add an instrument above and its price will begin streaming, live, in real time.
      </p>
    </div>
  );
}
