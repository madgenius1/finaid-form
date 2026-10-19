'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Answers, sectionLabel, visibleSections } from '@/lib/schema';
import { validateAll, validateSection } from '@/lib/validate';
import { buildSummary } from '@/lib/summary';
import { todayISO } from '@/lib/util';
import Intro from './Intro';
import SectionView from './SectionView';
import Summary from './Summary';

type Stage = 'intro' | 'section' | 'review' | 'done';
const KEY = 'ffif-draft-v1';

export default function FormApp() {
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [resume, setResume] = useState<{ stage: 'section' | 'review'; sectionId: string } | null>(null);
  const [sectionId, setSectionId] = useState('basics');
  const [answers, setAnswers] = useState<Answers>({});
  const [visited, setVisited] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [hp, setHp] = useState('');
  const [submit, setSubmit] = useState<{ state: 'idle' | 'sending' | 'error' | 'done'; message?: string; reference?: string }>({ state: 'idle' });

  /* ---- load saved draft ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setAnswers(d.answers ?? { date_completed: todayISO() });
        setVisited(d.visited ?? []);
        setSectionId(d.sectionId ?? 'basics');
        if (d.stage === 'section' || d.stage === 'review') setResume({ stage: d.stage, sectionId: d.sectionId ?? 'basics' });
      } else {
        setAnswers({ date_completed: todayISO() });
      }
    } catch {
      setAnswers({ date_completed: todayISO() });
    }
    setHydrated(true);
  }, []);

  /* ---- autosave ---- */
  useEffect(() => {
    if (!hydrated || submit.state === 'done') return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers, visited, sectionId, stage }));
    } catch {
      /* storage full or blocked: form still works, just won't persist */
    }
  }, [hydrated, answers, visited, sectionId, stage, submit.state]);

  const sections = useMemo(() => visibleSections(answers), [answers]);
  const idx = Math.max(0, sections.findIndex((s) => s.id === sectionId));
  const current = sections[idx];
  const issuesAll = useMemo(() => validateAll(answers), [answers]);
  const summary = useMemo(() => buildSummary(answers), [answers]);

  const errors = useMemo(() => {
    if (!showErrors || !current) return {};
    return Object.fromEntries(validateSection(current, answers).map((i) => [i.key, i.message]));
  }, [showErrors, current, answers]);

  const hasProgress = hydrated && (visited.length > 0 || Object.keys(answers).some((k) => k !== 'date_completed' && answers[k] !== ''));

  const set = useCallback((key: string, value: any) => setAnswers((a) => ({ ...a, [key]: value })), []);
  const markVisited = (id: string) => setVisited((v) => (v.includes(id) ? v : [...v, id]));
  const toTop = () => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' });

  function go(id: string, review = false) {
    if (stage === 'section' && current) markVisited(current.id);
    setSectionId(id);
    setStage('section');
    setShowErrors(false);
    setFromReview(review);
    setNavOpen(false);
    toTop();
  }
  function goReview() {
    if (stage === 'section' && current) markVisited(current.id);
    setVisited(sections.map((s) => s.id));
    setStage('review');
    setFromReview(false);
    setShowErrors(false);
    setNavOpen(false);
    toTop();
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus?.();
    });
  }

  function next() {
    if (!current) return;
    if (validateSection(current, answers).length) {
      setShowErrors(true);
      focusFirstError();
      return;
    }
    markVisited(current.id);
    if (fromReview) return goReview();
    if (idx < sections.length - 1) go(sections[idx + 1].id);
    else goReview();
  }
  function back() {
    if (fromReview) return goReview();
    if (idx > 0) go(sections[idx - 1].id);
    else {
      setStage('intro');
      toTop();
    }
  }

  function startOver() {
    if (!confirm('This will erase everything you have entered on this device. Continue?')) return;
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setAnswers({ date_completed: todayISO() });
    setVisited([]);
    setResume(null);
    setSectionId('basics');
    setStage('intro');
    setSubmit({ state: 'idle' });
    toTop();
  }

  async function submitForm() {
    if (issuesAll.length) return;
    setSubmit({ state: 'sending' });
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, website: hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      try {
        localStorage.removeItem(KEY);
      } catch {}
      setSubmit({ state: 'done', reference: data.reference });
      setStage('done');
      toTop();
    } catch (e: any) {
      setSubmit({ state: 'error', message: e?.message || 'Network problem. Please try again.' });
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify({ reference: submit.reference, answers }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-financial-form-${submit.reference ?? 'copy'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return <main className="page"><p className="muted center">Loading…</p></main>;

  if (stage === 'intro')
    return (
      <main className="page narrow">
        <Intro
          hasProgress={hasProgress}
          onStart={() => go(sections[0].id)}
          onContinue={() => (resume?.stage === 'review' ? goReview() : go(resume?.sectionId ?? sections[0].id))}
        />
      </main>
    );

  /* ---- progress ---- */
  const totalSteps = sections.length + 1; // + review
  const step = stage === 'review' || stage === 'done' ? totalSteps : idx + 1;
  const pct = Math.round((step / totalSteps) * 100);
  const doneCount = sections.filter((s) => visited.includes(s.id) && validateSection(s, answers).length === 0).length;
  const stepLabel = stage === 'section' && current ? `Section ${idx + 1} of ${sections.length}` : stage === 'review' ? 'Review and submit' : 'Submitted';

  const status = (id: string) => {
    const s = sections.find((x) => x.id === id)!;
    if (!visited.includes(id)) return 'todo';
    return validateSection(s, answers).length ? 'issues' : 'done';
  };

  return (
    <div className="shell">
      <aside className={`side no-print ${navOpen ? 'open' : ''}`} aria-label="Form sections">
        <div className="side-title">Sections</div>
        <ol>
          {sections.map((s, i) => {
            const st = status(s.id);
            const isCurrent = stage === 'section' && s.id === current?.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`nav-item ${isCurrent ? 'current' : ''} ${st}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={stage === 'done'}
                  onClick={() => go(s.id)}
                >
                  <span className="dot" aria-hidden>
                    {st === 'done' ? '✓' : st === 'issues' ? '!' : i + 1}
                  </span>
                  <span className="nav-label">{sectionLabel(s)}</span>
                  <span className="sr-only">{st === 'done' ? ' (completed)' : st === 'issues' ? ' (needs attention)' : ''}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className={`nav-item ${stage === 'review' ? 'current' : ''}`} disabled={stage === 'done'} onClick={goReview}>
              <span className="dot" aria-hidden>★</span>
              <span className="nav-label">Review and submit</span>
            </button>
          </li>
        </ol>
        {stage !== 'done' && (
          <button type="button" className="link-btn danger start-over" onClick={startOver}>
            Erase my answers and start over
          </button>
        )}
      </aside>

      <main className="main">
        <div className="progress-wrap no-print">
          <div className="progress-top">
            <button type="button" className="link-btn sections-toggle" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen}>
              ☰ Sections
            </button>
            <strong>{stepLabel}</strong>
            <span className="muted">
              {pct}% · {doneCount} of {sections.length} sections complete
            </span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Form progress">
            <div className="bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {stage === 'section' && current && (
          <article className="card section-card">
            <div className="eyebrow">{current.number ? `Section ${current.number}` : 'Getting started'}</div>
            <h2 tabIndex={-1}>{current.title}</h2>
            <SectionView section={current} answers={answers} errors={errors} set={set} />
            {showErrors && Object.keys(errors).length > 0 && (
              <div className="alert" role="alert">
                Please complete the {Object.keys(errors).length} highlighted {Object.keys(errors).length === 1 ? 'answer' : 'answers'} to continue.
              </div>
            )}
            <div className="nav-row">
              <button type="button" className="btn secondary" onClick={back}>
                {fromReview ? 'Cancel' : 'Back'}
              </button>
              <span className="saved muted">Saved on this device</span>
              <button type="button" className="btn primary" onClick={next}>
                {fromReview ? 'Save and return to review' : idx === sections.length - 1 ? 'Review my answers' : 'Next'}
              </button>
            </div>
          </article>
        )}

        {stage === 'review' && (
          <>
            <article className="card">
              <div className="eyebrow">Final step</div>
              <h2>Review your answers</h2>
              <p className="intro">
                Check everything below. Use <strong>Edit</strong> beside any section to change it. You will come straight back here
                afterwards. Nothing is sent until you press <strong>Submit</strong>.
              </p>
              {issuesAll.length > 0 && (
                <div className="alert" role="alert">
                  <strong>A few answers are still needed before you can submit:</strong>
                  <ul>
                    {issuesAll.map((i) => (
                      <li key={i.key}>
                        {i.label}:{' '}
                        <button type="button" className="link-btn" onClick={() => { go(i.sectionId, true); setShowErrors(true); }}>
                          fix this
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <Summary sections={summary} onEdit={(id) => go(id, true)} />

            <article className="card no-print">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />
              {submit.state === 'error' && <div className="alert" role="alert">{submit.message}</div>}
              <div className="nav-row">
                <button type="button" className="btn secondary" onClick={() => go(sections[sections.length - 1].id)}>
                  Back
                </button>
                <button type="button" className="btn secondary" onClick={() => window.print()}>
                  Print / save as PDF
                </button>
                <button type="button" className="btn primary" disabled={issuesAll.length > 0 || submit.state === 'sending'} onClick={submitForm}>
                  {submit.state === 'sending' ? 'Submitting…' : 'Submit my answers'}
                </button>
              </div>
            </article>
          </>
        )}

        {stage === 'done' && (
          <>
            <article className="card success">
              <div className="check" aria-hidden>✓</div>
              <h2>Thank you. Your form has been submitted.</h2>
              <p>
                Your reference number is <strong>{submit.reference}</strong>. Please keep it for your records. Keep copies of your
                documents too, as colleges may ask for them.
              </p>
              <div className="nav-row no-print">
                <button type="button" className="btn primary" onClick={() => window.print()}>
                  Print / save a copy as PDF
                </button>
                <button type="button" className="btn secondary" onClick={download}>
                  Download a data copy
                </button>
              </div>
            </article>
            <Summary sections={summary} />
          </>
        )}
      </main>
    </div>
  );
}
