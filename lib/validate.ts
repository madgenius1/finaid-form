import { Answers, Section, mk, cellType, visibleSections } from './schema';

export interface Issue {
  sectionId: string;
  key: string;
  label: string;
  message: string;
}

const isEmpty = (v: unknown) =>
  v == null || (Array.isArray(v) ? v.length === 0 : typeof v === 'boolean' ? !v : String(v).trim() === '');
const EMAIL = /^\S+@\S+\.\S+$/;

export function validateSection(s: Section, a: Answers): Issue[] {
  const out: Issue[] = [];
  const push = (key: string, label: string, message: string) => out.push({ sectionId: s.id, key, label, message });

  for (const b of s.blocks) {
    if (b.showIf && !b.showIf(a)) continue;
    if (b.kind === 'fields') {
      for (const f of b.fields) {
        if (f.showIf && !f.showIf(a)) continue;
        const v = a[f.id];
        const lbl = f.type === 'consent' ? 'Declaration (tick the box to confirm)' : f.label;
        if (f.required && isEmpty(v)) push(f.id, lbl, 'This is required.');
        else if (f.type === 'email' && !isEmpty(v) && !EMAIL.test(String(v).trim()))
          push(f.id, f.label, 'Enter a valid email address.');
      }
    }
    if (b.kind === 'matrix') {
      for (const r of b.rows) {
        for (const c of b.columns) {
          const key = mk(b.id, r.id, c.id);
          const v = a[key];
          const label = `${r.label} (${c.label})`;
          if (r.requiredCols?.includes(c.id) && isEmpty(v)) push(key, label, 'This is required.');
          else if (cellType(r, c) === 'email' && !isEmpty(v) && !EMAIL.test(String(v).trim()))
            push(key, label, 'Enter a valid email address.');
        }
      }
    }
  }
  if (s.custom) for (const i of s.custom(a)) push(i.key, i.label, i.message);
  return out;
}

export function validateAll(a: Answers): Issue[] {
  return visibleSections(a).flatMap((s) => validateSection(s, a));
}
