'use client';

const ORG = process.env.NEXT_PUBLIC_ORG_NAME;
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const DOC_GROUPS: { title: string; items: string[] }[] = [
  {
    title: 'Income and tax',
    items: [
      'Tax returns for both parents for the last two years, with filing receipts (signed, with English translation if needed)',
      "If no tax return is filed: official income statements, payslips, or an employer's letter showing yearly pay",
      'Business profit and loss statement and business bank statements, last two years and this year so far',
      'Proof that a job, contract, or funding ended (termination letter, contract end notice)',
    ],
  },
  {
    title: 'Savings, investments and property',
    items: [
      'Bank statements for every account, last 12 months',
      'Investment, brokerage, SACCO, and pension statements',
      'Home valuation or recent comparable sales; valuations for any other property',
    ],
  },
  {
    title: 'Debts and family costs',
    items: [
      'Mortgage and loan statements',
      'School and college fee statements and scholarship letters for each child',
      'Proof of money sent to parents, relatives, or others you support',
      'Medical bills and insurance statements for the last year',
    ],
  },
  {
    title: 'Family and identity papers',
    items: [
      'Divorce decree, separation agreement, or custody papers (if relevant)',
      'Guardianship or dependency papers, and a death certificate (if relevant)',
      "Copies of the student's and parents' passports or national IDs",
    ],
  },
  {
    title: 'From the colleges',
    items: [
      "Each college's own forms (for example, an international student certification of finances), signed",
      "Each college's CSS school code and deadlines (on its financial aid page)",
    ],
  },
];

export default function Intro({ onStart, onContinue, hasProgress }: { onStart: () => void; onContinue: () => void; hasProgress: boolean }) {
  return (
    <div className="intro-page">
      <header className="hero">
        {ORG && <div className="eyebrow">{ORG}</div>}
        <h1>AFEX Hub Financial Information Form</h1>
        <p className="lead">
          A worksheet for gathering the information needed for the <strong>CSS Profile</strong> (College Board) and for each
          college&rsquo;s financial aid documents.
        </p>
        <div className="cta-row">
          {hasProgress ? (
            <>
              <button className="btn primary big" onClick={onContinue}>
                Continue where you left off
              </button>
              <button className="btn secondary big" onClick={onStart}>
                Start from the beginning
              </button>
            </>
          ) : (
            <button className="btn primary big" onClick={onStart}>
              Start the form
            </button>
          )}
        </div>
      </header>

      <section className="card">
        <h2>What this form is for</h2>
        <p>
          Colleges use the CSS Profile to decide how much financial aid a family may receive. This worksheet follows the
          sections of the Profile so that answering it later is straightforward. It does <strong>not</strong> replace the Profile
          or any college&rsquo;s own requirements.
        </p>
        <p>
          It has about 17 short sections: the student, parents, household, work, income, assets, debts, costs, and any special
          circumstances. You can finish in several sittings. Allow roughly an hour if your documents are to hand.
        </p>
      </section>

      <section className="card">
        <h2>How it works</h2>
        <ul className="list-disc">
          <li>Complete one section at a time. The progress bar at the top shows where you are.</li>
          <li>Your answers are saved on this device as you type, so you can close the page and come back later.</li>
          <li>At the end you will see a <strong>preview of everything you entered</strong> and can edit any section before you submit.</li>
        </ul>
      </section>

      <section className="card">
        <h2>How to fill it in</h2>
        <ul className="list-disc">
          <li>Use the same currency throughout and write its name in the first section. Give whole-year amounts unless a box says otherwise.</li>
          <li>Use the exact figure from a document wherever you have one. Write &ldquo;estimate&rdquo; beside any figure you had to guess, and &ldquo;N/A&rdquo; where a question does not apply to you.</li>
          <li>The CSS Profile asks about the most recent completed tax year (&ldquo;last year&rdquo;), the year before it (&ldquo;two years ago&rdquo;), and your expected income this year. Write the actual calendar or tax years where asked.</li>
          <li>If the parents are divorced or separated, many colleges ask both parents for their financial information. An extra section for the other parent will appear automatically.</li>
          <li>Colleges may ask for extra documents or their own forms after you submit the Profile. Keep copies of everything.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Documents to prepare before you start</h2>
        <p>
          Having these to hand makes the form much quicker. You do not upload them here. Section 16 is a checklist so you can confirm
          what you have. Colleges usually ask for uploads through the College Board&rsquo;s IDOC service, so keep scans clear and
          complete. Documents not in English need an English translation.
        </p>
        <div className="doc-groups">
          {DOC_GROUPS.map((g) => (
            <div key={g.title} className="doc-group">
              <h3>{g.title}</h3>
              <ul className="list-disc">
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card privacy">
        <h2>Privacy</h2>
        <p>
          This form asks for sensitive personal and financial information. While you work, your answers are stored only in this
          browser on this device. Please do not use a shared or public computer. When you submit, your answers are sent securely to{' '}
          {ORG ?? 'the organiser'}.{' '}
          {CONTACT && (
            <>
              Questions? Contact <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </>
          )}
        </p>
      </section>

      {!hasProgress && (
        <div className="cta-row bottom">
          <button className="btn primary big" onClick={onStart}>
            Start the form
          </button>
        </div>
      )}
    </div>
  );
}
