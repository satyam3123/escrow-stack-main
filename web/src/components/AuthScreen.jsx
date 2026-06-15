import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const INSTRUMENTS = [
  ['GOOG', 'Alphabet'],
  ['TSLA', 'Tesla'],
  ['AMZN', 'Amazon'],
  ['META', 'Meta'],
  ['NVDA', 'NVIDIA'],
];

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="atmosphere grain min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Editorial brand panel ───────────────────────────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line p-14 lg:flex">
        <Guilloche />
        <div className="relative rise">
          <Wordmark />
        </div>

        <div className="relative max-w-md space-y-8">
          <p className="rise font-display text-[34px] font-medium leading-[1.15] tracking-tight text-ink" style={{ animationDelay: '80ms' }}>
            Markets, held in confidence.
            <span className="block text-muted">Live prices, settled in real time.</span>
          </p>

          <ul className="rise space-y-3.5 text-[15px] text-muted" style={{ animationDelay: '160ms' }}>
            <Feature>Streaming quotes over WebSockets — never a refresh.</Feature>
            <Feature>A private watchlist that updates independently for every client.</Feature>
            <Feature>Bank-grade session security with password &amp; token auth.</Feature>
          </ul>

          <div className="rise" style={{ animationDelay: '240ms' }}>
            <div className="eyebrow mb-3 text-faint">Supported instruments</div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {INSTRUMENTS.map(([t, name]) => (
                <div key={t} className="flex items-center justify-between bg-panel px-3.5 py-2.5">
                  <span className="font-display text-[15px] font-semibold text-ink">{t}</span>
                  <span className="text-xs text-faint">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative eyebrow text-faint">Escrow Stack · Protected Markets</div>
      </aside>

      {/* ── Auth form ───────────────────────────────────────── */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>

          <div className="rise">
            <div className="eyebrow text-gold">{mode === 'login' ? 'Account access' : 'Open an account'}</div>
            <h1 className="mt-2 font-display text-[32px] font-medium tracking-tight text-ink">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {mode === 'login'
                ? 'Enter your credentials to open your live terminal.'
                : 'Register with an email and password to begin.'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="rise mt-8 space-y-4" style={{ animationDelay: '80ms' }}>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={mode === 'register' ? 'Minimum 6 characters.' : undefined}
            />

            {error && (
              <div className="tnum rounded-lg border border-down/30 bg-down/10 px-3 py-2.5 text-[13px] text-down">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group relative w-full overflow-hidden rounded-xl bg-gold px-4 py-3 font-semibold text-[#1a1206] transition hover:brightness-105 disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <div className="rise mt-6 text-sm text-muted" style={{ animationDelay: '140ms' }}>
            {mode === 'login' ? 'New to Escrow Stack? ' : 'Already registered? '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="font-semibold text-gold underline-offset-4 hover:underline"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmail('alice@demo.com');
              setPassword('password');
            }}
            className="rise mt-8 flex w-full items-center justify-between rounded-xl border border-dashed border-line px-3.5 py-3 text-left transition hover:border-gold/40"
            style={{ animationDelay: '200ms' }}
          >
            <span>
              <span className="eyebrow block text-faint">Demo account</span>
              <span className="tnum text-[13px] text-muted">alice@demo.com · password</span>
            </span>
            <span className="text-xs text-faint">use →</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/30 bg-gold/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.8">
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M16 8h5v5" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-display text-[19px] font-semibold tracking-tight text-ink">Escrow Stack</div>
        <div className="eyebrow text-faint">Live Markets</div>
      </div>
    </div>
  );
}

function Feature({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
      <span>{children}</span>
    </li>
  );
}

function Field({ label, hint, value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block text-faint">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-line bg-bg-2/60 px-3.5 py-3 text-ink outline-none transition placeholder:text-faint focus:border-gold/60 focus:bg-bg-2 focus:ring-2 focus:ring-gold/15"
      />
      {hint && <span className="mt-1.5 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

/* A faint concentric line-engraving — a nod to security/banknote printing. */
function Guilloche() {
  return (
    <svg
      className="pointer-events-none absolute -right-40 -top-24 h-[680px] w-[680px] opacity-[0.07]"
      viewBox="0 0 600 600"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="0.6"
      aria-hidden
    >
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx="300" cy="300" r={20 + i * 11} />
      ))}
      {Array.from({ length: 26 }).map((_, i) => (
        <ellipse key={`e${i}`} cx="300" cy="300" rx={300} ry={40 + i * 10} transform={`rotate(${i * 7} 300 300)`} opacity="0.5" />
      ))}
    </svg>
  );
}
