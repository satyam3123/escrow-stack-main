export const fmtPrice = (n) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtSigned = (n) => `${(n ?? 0) >= 0 ? '+' : ''}${Number(n ?? 0).toFixed(2)}`;

export const fmtPct = (n) => `${(n ?? 0) >= 0 ? '+' : ''}${Number(n ?? 0).toFixed(2)}%`;

export const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';
