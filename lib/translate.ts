/**
 * ユーザーが書いた本文の機械翻訳（stop詳細の「翻訳」ボタン用）。
 * Google翻訳の非公式エンドポイント(gtx)を使う。キー不要・CORS可で、
 * MVPの規模なら十分。将来は公式API（DeepL等）に差し替えられるよう
 * この1ファイルに閉じ込めてある。
 */
import type { Locale } from './i18n';

/** UIロケール → 翻訳先の言語コード */
const TARGET: Record<Locale, string> = {
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};

const cache = new Map<string, string>();

export async function translateText(text: string, locale: Locale): Promise<string | null> {
  const body = text.trim();
  if (!body) return null;
  const target = TARGET[locale] ?? 'en';
  const key = `${target}:${body}`;
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t' +
      `&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(body)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // data[0] = [[訳文, 原文, ...], ...] の配列
    const out = (data?.[0] ?? [])
      .map((seg: any) => seg?.[0] ?? '')
      .join('');
    if (!out) return null;
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
