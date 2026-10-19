import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { validateAll } from '@/lib/validate';
import { buildSummary, toText } from '@/lib/summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 500_000;

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Submission is too large.' }, { status: 413 });

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (body?.website) return NextResponse.json({ ok: true, reference: 'FFIF-000000' });

  const answers = body?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers))
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });

  const issues = validateAll(answers);
  if (issues.length)
    return NextResponse.json(
      { ok: false, error: 'Some required answers are missing.', issues: issues.map((i) => i.label) },
      { status: 422 },
    );

  const reference = 'FFIF-' + randomBytes(3).toString('hex').toUpperCase();
  const submittedAt = new Date().toISOString();
  const summaryText = toText(buildSummary(answers, true));
  const payload = { reference, submittedAt, answers, summaryText };

  const results: boolean[] = [];
  let configured = 0;

  // Option A: email via Resend
  const { RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM, WEBHOOK_URL, WEBHOOK_SECRET } = process.env;
  if (RESEND_API_KEY && NOTIFY_EMAIL_TO && NOTIFY_EMAIL_FROM) {
    configured++;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: NOTIFY_EMAIL_FROM,
          to: NOTIFY_EMAIL_TO.split(',').map((s) => s.trim()),
          subject: `Family Financial Information Form: ${answers.student_name ?? 'Student'} (${reference})`,
          text: `Reference: ${reference}\nSubmitted: ${submittedAt}\n\n${summaryText}`,
          attachments: [
            { filename: `${reference}.json`, content: Buffer.from(JSON.stringify(payload, null, 2)).toString('base64') },
          ],
        }),
      });
      results.push(res.ok);
      if (!res.ok) console.error('Resend error', res.status, await res.text());
    } catch (e) {
      console.error('Resend failed', e);
      results.push(false);
    }
  }

  // Option B: webhook
  if (WEBHOOK_URL) {
    configured++;
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(WEBHOOK_SECRET ? { Authorization: `Bearer ${WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      results.push(res.ok);
      if (!res.ok) console.error('Webhook error', res.status);
    } catch (e) {
      console.error('Webhook failed', e);
      results.push(false);
    }
  }

  // Local development fallback: save to ./.submissions
  if (configured === 0) {
    if (process.env.NODE_ENV !== 'production') {
      const dir = path.join(process.cwd(), '.submissions');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${reference}.json`), JSON.stringify(payload, null, 2));
      return NextResponse.json({ ok: true, reference });
    }
    console.error('No submission destination configured (set RESEND_* or WEBHOOK_URL).');
    return NextResponse.json(
      { ok: false, error: 'This form is not fully set up yet. Your answers have NOT been sent. Please contact the organiser.' },
      { status: 503 },
    );
  }

  if (!results.some(Boolean))
    return NextResponse.json(
      { ok: false, error: 'We could not send your answers just now. Please try again in a few minutes. Your answers are still saved on this device.' },
      { status: 502 },
    );

  return NextResponse.json({ ok: true, reference });
}
