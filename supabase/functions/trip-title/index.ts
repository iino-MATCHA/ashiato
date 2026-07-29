/**
 * 写真から起こした旅に、AIで題をつける。
 *
 * Gemini の鍵をクライアントへ置かないためのごく薄い中継。
 * 鍵は Edge Function のシークレット(GEMINI_API_KEY)に置き、ブラウザには出さない。
 * 呼び出しは Supabase の JWT で守られる（verify_jwt）。
 *
 * 受け取るのは場所と日付だけ。写真そのものは送らない。
 */
// エイリアスにしておく。世代が上がってもここを触らずに追随できる。
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  let payload: { places?: string[]; start?: string; end?: string; days?: number; locale?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ title: null, reason: 'bad request' }, 400);
  }

  const places = (payload.places ?? []).filter(Boolean).slice(0, 12);
  if (!places.length) return json({ title: null, reason: 'no places' });
  if (!key) return json({ title: null, reason: 'no key' });

  const prompt = [
    'You name travel journals. Give ONE title for this trip in Japan.',
    `Places visited, in order: ${places.join(' -> ')}.`,
    payload.start ? `Dates: ${payload.start}${payload.end && payload.end !== payload.start ? ` to ${payload.end}` : ''}.` : '',
    payload.days ? `Length: ${payload.days} day(s).` : '',
    `Write it in ${localeName(payload.locale)}.`,
    'Rules: at most 6 words (or 20 characters for Japanese/Chinese/Korean).',
    'Evocative, not a list of place names. No quotes, no punctuation at the end,',
    'no emoji, no explanation. Return the title only.',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 64 },
        }),
      },
    );
    if (!res.ok) return json({ title: null, reason: `gemini ${res.status}` });
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const title = String(raw).split('\n')[0].replace(/^["'「『]|["'」』]$/g, '').trim().slice(0, 60);
    return json({ title: title || null });
  } catch (e) {
    return json({ title: null, reason: String(e).slice(0, 120) });
  }
});

function localeName(l?: string): string {
  switch (l) {
    case 'ja': return 'Japanese';
    case 'ko': return 'Korean';
    case 'zh-Hans': return 'Simplified Chinese';
    case 'zh-Hant': return 'Traditional Chinese';
    default: return 'English';
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
