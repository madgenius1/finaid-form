'use client';
import { SummarySection } from '@/lib/summary';

export default function Summary({ sections, onEdit }: { sections: SummarySection[]; onEdit?: (id: string) => void }) {
  return (
    <div className="summary">
      {sections.map((s) => (
        <section key={s.id} className="card sum-section">
          <div className="sum-head">
            <h3>{s.title}</h3>
            {onEdit && (
              <button type="button" className="btn small secondary no-print" onClick={() => onEdit(s.id)} aria-label={`Edit ${s.title}`}>
                Edit
              </button>
            )}
          </div>
          {s.items.map((it, i) => (
            <div key={i} className="sum-item">
              {it.heading && <h4>{it.heading}</h4>}
              {it.label !== undefined && (
                <div className="sum-row">
                  <div className="sum-label">{it.label}</div>
                  <div className={`sum-value ${it.value ? '' : 'empty'}`}>{it.value || 'Not answered'}</div>
                </div>
              )}
              {it.label === undefined && it.value && <div className="sum-value empty">{it.value}</div>}
              {it.table && (
                <div className="table-scroll">
                  <table className="sumtable">
                    <thead>
                      <tr>
                        {it.table.headers.map((h, hi) => (
                          <th key={hi}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {it.table.rows.map((r, ri) => (
                        <tr key={ri}>
                          {r.map((c, ci) => (ci === 0 && it.table!.headers[0] ? <th key={ci} scope="row">{c}</th> : <td key={ci}>{c || <span className="muted">—</span>}</td>))}
                        </tr>
                      ))}
                      {it.table.totalRow && (
                        <tr className="total">
                          {it.table.totalRow.map((c, ci) => (ci === 0 ? <th key={ci}>{c}</th> : <td key={ci}>{c}</td>))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
