'use client';
import { Answers, Block, Section, cellOptions, cellType, mk } from '@/lib/schema';
import { formatNumber, parseAmount } from '@/lib/util';
import { Control, FieldRow } from './Fields';

interface Props {
  section: Section;
  answers: Answers;
  errors: Record<string, string>;
  set: (key: string, value: any) => void;
}

export default function SectionView({ section, answers, errors, set }: Props) {
  return (
    <div className="blocks">
      {section.intro && <p className="intro">{section.intro}</p>}
      {section.blocks.map((b, i) => {
        if (b.showIf && !b.showIf(answers)) return null;
        return <BlockView key={i} block={b} answers={answers} errors={errors} set={set} />;
      })}
    </div>
  );
}

function BlockView({ block: b, answers, errors, set }: { block: Block } & Omit<Props, 'section'>) {
  if (b.kind === 'note') return <p className="note">{b.text}</p>;

  if (b.kind === 'fields') {
    return (
      <div className="block">
        {b.title && <h3>{b.title}</h3>}
        {b.note && <p className="note">{b.note}</p>}
        <div className="fields-grid">
          {b.fields.map((f) =>
            f.showIf && !f.showIf(answers) ? null : (
              <div key={f.id} className={f.type === 'textarea' || f.type === 'checkboxes' || f.type === 'consent' || f.type === 'radio' ? 'span2' : ''}>
                <FieldRow
                  id={`f-${f.id}`}
                  type={f.type}
                  label={f.label}
                  hint={f.hint}
                  required={f.required}
                  options={f.options}
                  placeholder={f.placeholder}
                  value={answers[f.id]}
                  error={errors[f.id]}
                  onChange={(v) => set(f.id, v)}
                />
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (b.kind === 'table') {
    const blank = () => Object.fromEntries(b.columns.map((c) => [c.id, '']));
    const rows: Record<string, string>[] = Array.isArray(answers[b.id])
      ? answers[b.id]
      : Array.from({ length: b.initialRows }, blank);
    const update = (next: Record<string, string>[]) => set(b.id, next);
    return (
      <div className="block">
        {b.title && <h3>{b.title}</h3>}
        {b.note && <p className="note">{b.note}</p>}
        {rows.map((row, ri) => (
          <fieldset key={ri} className="entry">
            <legend>
              {b.entryLabel} {ri + 1}
            </legend>
            <div className="fields-grid">
              {b.columns.map((c) => (
                <FieldRow
                  key={c.id}
                  id={`t-${b.id}-${ri}-${c.id}`}
                  type={c.type ?? 'text'}
                  label={c.label}
                  options={c.options}
                  placeholder={c.placeholder}
                  value={row[c.id]}
                  onChange={(v) => update(rows.map((r, i) => (i === ri ? { ...r, [c.id]: v } : r)))}
                />
              ))}
            </div>
            {rows.length > 1 && (
              <button type="button" className="link-btn danger" onClick={() => update(rows.filter((_, i) => i !== ri))}>
                Remove {b.entryLabel.toLowerCase()} {ri + 1}
              </button>
            )}
          </fieldset>
        ))}
        {rows.length < b.maxRows && (
          <button type="button" className="btn secondary" onClick={() => update([...rows, blank()])}>
            + Add another {b.entryLabel.toLowerCase()}
          </button>
        )}
      </div>
    );
  }

  // matrix
  return (
    <div className="block">
      {b.title && <h3>{b.title}</h3>}
      {b.note && <p className="note">{b.note}</p>}
      <table className="matrix">
        <thead>
          <tr>
            <th scope="col">{b.rowHeader ?? ''}</th>
            {b.columns.map((c) => (
              <th key={c.id} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                {r.label}
                {r.hint && <div className="hint">{r.hint}</div>}
              </th>
              {b.columns.map((c) => {
                const key = mk(b.id, r.id, c.id);
                return (
                  <td key={c.id} data-label={c.label}>
                    <Control
                      id={`m-${key}`}
                      type={cellType(r, c)}
                      label={`${r.label}, ${c.label}`}
                      options={cellOptions(r, c)}
                      placeholder={r.placeholder ?? c.placeholder}
                      value={answers[key]}
                      error={errors[key]}
                      onChange={(v) => set(key, v)}
                    />
                    {errors[key] && (
                      <div className="error" id={`m-${key}-err`} role="alert">
                        {errors[key]}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {b.totalRow && (
            <tr className="total">
              <th scope="row">Total (auto-calculated)</th>
              {b.columns.map((c) => (
                <td key={c.id} data-label={c.label}>
                  {c.sum ? formatNumber(b.rows.reduce((t, r) => t + parseAmount(answers[mk(b.id, r.id, c.id)]), 0)) : ''}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
