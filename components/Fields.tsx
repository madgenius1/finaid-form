'use client';
import { FieldType } from '@/lib/schema';

interface InputProps {
  id: string;
  type: FieldType;
  value: any;
  onChange: (v: any) => void;
  label: string;
  options?: string[];
  placeholder?: string;
  error?: string;
}

/** Renders the right control for a field type. Labels are provided by the wrapper. */
export function Control({ id, type, value, onChange, label, options = [], placeholder, error }: InputProps) {
  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-err` : undefined,
  } as const;

  switch (type) {
    case 'textarea':
      return (
        <textarea {...common} rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      );
    case 'select':
      return (
        <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div role="radiogroup" aria-label={label} className="choices inline" {...(error ? { 'aria-invalid': true } : {})} id={id}>
          {options.map((o) => (
            <label key={o} className="choice">
              <input type="radio" name={id} checked={value === o} onChange={() => onChange(o)} />
              <span>{o}</span>
            </label>
          ))}
          {value ? (
            <button type="button" className="link-btn clear" onClick={() => onChange('')} aria-label={`Clear answer for ${label}`}>
              Clear
            </button>
          ) : null}
        </div>
      );
    case 'checkboxes': {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="choices" role="group" aria-label={label} id={id}>
          {options.map((o) => (
            <label key={o} className="choice">
              <input
                type="checkbox"
                checked={arr.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
    }
    case 'consent':
      return (
        <label className="choice consent">
          <input {...common} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span>{label}</span>
        </label>
      );
    case 'number':
      return (
        <input {...common} type="number" min={0} inputMode="numeric" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      );
    default:
      return (
        <input
          {...common}
          type={type}
          inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
          autoComplete="off"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function FieldRow(props: InputProps & { hint?: string; required?: boolean }) {
  const { id, type, label, hint, required, error } = props;
  const isGroup = type === 'radio' || type === 'checkboxes' || type === 'consent';
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      {type !== 'consent' &&
        (isGroup ? (
          <div className="label">
            {label}
            {required && <span className="req"> *</span>}
          </div>
        ) : (
          <label className="label" htmlFor={id}>
            {label}
            {required && <span className="req"> *</span>}
          </label>
        ))}
      {hint && <div className="hint">{hint}</div>}
      <Control {...props} />
      {error && (
        <div className="error" id={`${id}-err`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
