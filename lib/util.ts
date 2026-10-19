export const todayISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Reads the first number in free text such as "1,200,000 (estimate)". Used only for auto-totals. */
export function parseAmount(s: unknown): number {
  if (typeof s !== 'string') return 0;
  const m = s.replace(/\s/g, '').match(/-?\d[\d,.]*/);
  if (!m) return 0;
  let t = m[0].replace(/[.,]+$/, '');
  if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, ''); // 1.200.000 style
  t = t.replace(/,/g, '');
  const n = parseFloat(t);
  return Number.isNaN(n) ? 0 : n;
}

export const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDate(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
}
