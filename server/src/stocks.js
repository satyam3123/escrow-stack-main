import { EventEmitter } from 'node:events';

/**
 * The five supported stocks. Seed prices are only a realistic starting point —
 * actual values are produced by a random walk (the assignment explicitly allows
 * a random number generator instead of real market data).
 */
export const SUPPORTED = [
  { ticker: 'GOOG', name: 'Alphabet Inc.', seed: 175 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', seed: 250 },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', seed: 185 },
  { ticker: 'META', name: 'Meta Platforms, Inc.', seed: 505 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', seed: 122 },
];

export const SUPPORTED_TICKERS = SUPPORTED.map((s) => s.ticker);
export const isSupported = (t) => SUPPORTED_TICKERS.includes(t);

const round2 = (n) => Math.round(n * 100) / 100;
const HISTORY_LEN = 60; // points kept for the sparkline

/**
 * A single, server-side source of truth for prices.
 *
 * Why one central engine instead of generating prices in each browser?
 * Requirement #3 needs two users to see the SAME price for a shared stock while
 * their dashboards update independently. If each client rolled its own random
 * numbers they would disagree. So the server ticks once per interval and
 * broadcasts; clients only render.
 */
class PriceEngine extends EventEmitter {
  constructor() {
    super();
    this.timer = null;
    this.state = new Map();
    for (const s of SUPPORTED) {
      this.state.set(s.ticker, {
        ticker: s.ticker,
        name: s.name,
        open: s.seed, // session reference used for "day change"
        price: s.seed,
        prev: s.seed, // previous tick, used for up/down flash direction
        history: [],
      });
    }
    // Pre-roll history so sparklines are populated immediately on first load,
    // then anchor "open" to the current price so day-change starts near 0%.
    for (let i = 0; i < HISTORY_LEN; i++) this._step(false);
    for (const st of this.state.values()) st.open = st.price;
  }

  _step(emit = true, ts = Date.now()) {
    const cycle = [];
    for (const st of this.state.values()) {
      // Gentle random walk (±0.5%/tick) with a light pull back toward the
      // session open — believable intraday movement that won't drift to
      // unrealistic extremes over a long-running session.
      const noise = (Math.random() - 0.5) * 2 * 0.005;
      const reversion = ((st.open - st.price) / st.open) * 0.02;
      const next = Math.max(1, round2(st.price * (1 + noise + reversion)));
      st.prev = st.price;
      st.price = next;
      st.history.push(next);
      if (st.history.length > HISTORY_LEN) st.history.shift();
      if (emit) {
        const t = this._tick(st.ticker, ts);
        this.emit('tick', t); // per-stock — forwarded to that stock's room (watchlists)
        cycle.push(t);
      }
    }
    // One aggregate event per cycle — powers the ambient "market overview" ticker
    // tape that every client sees, independent of their own subscriptions.
    if (emit && cycle.length) this.emit('cycle', cycle);
  }

  _tick(ticker, ts = Date.now()) {
    const st = this.state.get(ticker);
    const change = round2(st.price - st.open);
    const changePct = round2((change / st.open) * 100);
    return {
      ticker: st.ticker,
      name: st.name,
      price: st.price,
      open: st.open,
      change,
      changePct,
      direction: st.price >= st.prev ? 'up' : 'down',
      ts,
    };
  }

  start(intervalMs = 1000) {
    if (this.timer) return;
    this.timer = setInterval(() => this._step(true), intervalMs);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /** Current tick payload for one ticker (used for instant feedback on subscribe). */
  currentTick(ticker) {
    return this.state.has(ticker) ? this._tick(ticker) : null;
  }

  /** Current tick for every stock — initial fill for the market ticker tape. */
  currentMarket() {
    return SUPPORTED_TICKERS.map((t) => this._tick(t));
  }

  /** Snapshot (incl. sparkline history) for a set of tickers. */
  snapshot(tickers = SUPPORTED_TICKERS) {
    const out = {};
    for (const t of tickers) {
      const st = this.state.get(t);
      if (!st) continue;
      out[t] = { ...this._tick(t), history: [...st.history] };
    }
    return out;
  }
}

export const engine = new PriceEngine();
