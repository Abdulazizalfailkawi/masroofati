// Webhook for bank SMS. A phone automation (iPhone Shortcuts / Android) POSTs
// { "token": "...", "text": "<the SMS>" } here. The per-user token is the credential, so
// JWT verification is off for this function (the phone has no Supabase session).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parseSms } from './parser.ts';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const sha256hex = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
};

// Shortcuts can send JSON, form fields or plain text depending on how it is set up.
async function readBody(req: Request): Promise<Record<string, string>> {
  const raw = await req.text();
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object') return j as Record<string, string>;
  } catch (_) {}
  const params = new URLSearchParams(raw);
  if ([...params.keys()].length > 0 && raw.includes('=')) return Object.fromEntries(params);
  return { text: raw };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply({ ok: false, error: 'POST only' }, 405);

  const url = new URL(req.url);
  const body = await readBody(req);
  const token = String(req.headers.get('x-token') || url.searchParams.get('token') || body.token || '').trim();
  const text = String(body.text ?? body.message ?? body.body ?? '').trim().slice(0, 1000);

  if (!token) return reply({ ok: false, error: 'missing token' }, 401);
  if (!text) return reply({ ok: false, error: 'missing text' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data: owner, error: tokenErr } = await admin
    .from('masroofati_sms_tokens')
    .select('user_id')
    .eq('token_hash', await sha256hex(token))
    .maybeSingle();
  if (tokenErr) return reply({ ok: false, error: 'lookup failed' }, 500);
  if (!owner) return reply({ ok: false, error: 'invalid token' }, 401);

  const parsed = parseSms(text);
  // Transfers between the user's own accounts are neither income nor spending: drop them.
  if (parsed.kind === 'internal') return reply({ ok: true, ignored: 'internal transfer' });
  const occurredOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuwait' });

  const { error: insertErr } = await admin.from('masroofati_inbox').insert({
    user_id: owner.user_id,
    kind: parsed.kind,
    // Messages we couldn't read are kept for review but never imported automatically.
    status: parsed.kind === 'unparsed' ? 'ignored' : 'new',
    amount: parsed.amount,
    balance: parsed.balance,
    merchant: parsed.merchant,
    pay: parsed.pay,
    cat: parsed.cat,
    src: parsed.src,
    occurred_on: occurredOn,
    // Keep the original text only when we couldn't read it (so it can be reviewed). Once a
    // message is understood, its names/balances are not stored; only the hash for de-duplication.
    raw: parsed.kind === 'unparsed' ? text : '',
    msg_hash: await sha256hex(text),
  });

  if (insertErr) {
    // Same message delivered twice: treat as done.
    if (insertErr.code === '23505') return reply({ ok: true, duplicate: true });
    return reply({ ok: false, error: 'save failed' }, 500);
  }

  return reply({ ok: true, kind: parsed.kind, amount: parsed.amount });
});
