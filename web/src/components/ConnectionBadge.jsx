const MAP = {
  connected: { label: 'Live', color: 'var(--color-up)', pulse: true },
  connecting: { label: 'Connecting', color: 'var(--color-gold)', pulse: true },
  disconnected: { label: 'Offline', color: 'var(--color-down)', pulse: false },
  error: { label: 'Error', color: 'var(--color-down)', pulse: false },
};

export default function ConnectionBadge({ status }) {
  const s = MAP[status] || MAP.connecting;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1.5">
      <span className="relative flex h-1.5 w-1.5">
        {s.pulse && (
          <span className="breathe absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: s.color }} />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      </span>
      <span className="eyebrow text-muted" style={{ letterSpacing: '0.18em' }}>{s.label}</span>
    </span>
  );
}
