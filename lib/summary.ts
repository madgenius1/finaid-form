import { Answers, Column, MatrixRow, cellType, mk, sectionLabel, visibleSections, FieldType } from './schema';
import { formatDate, formatNumber, parseAmount } from './util';

export interface SummaryItem {
  heading?: string;
  label?: string;
  value?: string;
  table?: { headers: string[]; rows: string[][]; totalRow?: string[]; rowLabels?: boolean };
}
export interface SummarySection {
  id: string;
  title: string;
  items: SummaryItem[];
}

export function fmt(type: FieldType | undefined, v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join('; ');
  if (type === 'consent') return v === true ? 'Agreed' : '';
  if (type === 'date') return formatDate(String(v));
  return String(v).trim();
}

export function buildSummary(a: Answers, hideEmpty = false): SummarySection[] {
  const sections: SummarySection[] = [];
  for (const s of visibleSections(a)) {
    const items: SummaryItem[] = [];
    for (const b of s.blocks) {
      if (b.kind === 'note') continue;
      if (b.showIf && !b.showIf(a)) continue;

      if (b.kind === 'fields') {
        const rows: SummaryItem[] = [];
        for (const f of b.fields) {
          if (f.showIf && !f.showIf(a)) continue;
          const value = fmt(f.type, a[f.id]);
          if (hideEmpty && !value) continue;
          rows.push({ label: f.type === 'consent' ? 'Declaration' : f.label, value });
        }
        if (rows.length) {
          if (b.title) items.push({ heading: b.title });
          items.push(...rows);
        }
      }

      if (b.kind === 'table') {
        const entries: any[] = Array.isArray(a[b.id]) ? a[b.id] : [];
        const rows = entries
          .filter((r) => b.columns.some((c) => String(r?.[c.id] ?? '').trim()))
          .map((r) => b.columns.map((c) => fmt(c.type, r?.[c.id])));
        if (hideEmpty && rows.length === 0) continue;
        if (b.title) items.push({ heading: b.title });
        if (rows.length === 0) items.push({ value: 'Nothing entered' });
        else items.push({ table: { headers: b.columns.map((c) => c.label), rows } });
      }

      if (b.kind === 'matrix') {
        const cell = (r: MatrixRow, c: Column) => fmt(cellType(r, c), a[mk(b.id, r.id, c.id)]);
        let rows = b.rows.map((r) => [r.label, ...b.columns.map((c) => cell(r, c))]);
        if (hideEmpty) rows = rows.filter((r) => r.slice(1).some(Boolean));
        if (hideEmpty && rows.length === 0) continue;
        let totalRow: string[] | undefined;
        if (b.totalRow) {
          totalRow = [
            'Total (auto-calculated)',
            ...b.columns.map((c) =>
              c.sum ? formatNumber(b.rows.reduce((t, r) => t + parseAmount(a[mk(b.id, r.id, c.id)]), 0)) : '',
            ),
          ];
        }
        if (b.title) items.push({ heading: b.title });
        items.push({ table: { headers: [b.rowHeader ?? '', ...b.columns.map((c) => c.label)], rows, totalRow, rowLabels: true } });
      }
    }
    if (items.length || !hideEmpty) sections.push({ id: s.id, title: sectionLabel(s), items });
  }
  return sections;
}

export function toText(sections: SummarySection[]): string {
  const lines: string[] = [];
  for (const s of sections) {
    lines.push('', s.title.toUpperCase(), '='.repeat(Math.min(s.title.length, 70)));
    for (const it of s.items) {
      if (it.heading) lines.push('', `-- ${it.heading} --`);
      if (it.label) lines.push(`${it.label}: ${it.value || '(blank)'}`);
      else if (it.value) lines.push(it.value);
      if (it.table) {
        for (const row of it.table.rows) {
          const start = it.table.rowLabels ? 1 : 0;
          const pairs = row
            .slice(start)
            .map((v, i) => (v ? `${it.table!.headers[i + start]}: ${v}` : ''))
            .filter(Boolean);
          lines.push(it.table.rowLabels ? `  * ${row[0]} -> ${pairs.join(' | ')}` : `  * ${pairs.join(' | ')}`);
        }
        if (it.table.totalRow) lines.push(`  * ${it.table.totalRow.filter(Boolean).join(' | ')}`);
      }
    }
  }
  return lines.join('\n').trim();
}
