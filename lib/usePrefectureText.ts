/**
 * 県の紹介文を出すための入口。
 *
 * 文は prefecture_texts（0028）に置いてある ―― 消したり書き足したりできる
 * ようにするため。**手元の lib/quiz/descriptions.ts は控え**で、DBに行が
 * 無いときと、まだ引けていない最初のフレームだけそちらを出す。
 * こうしないと県のカードを開いた瞬間に説明が空白になる。
 */
import { useEffect, useState } from 'react';
import { fetchPrefectureText } from '@/lib/api';
import { prefectureDescription } from '@/lib/quiz/descriptions';
import type { Locale } from '@/lib/i18n';

export function usePrefectureText(code: number, locale: Locale): string {
  const fallback = prefectureDescription(code, locale);
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let alive = true;
    setText(prefectureDescription(code, locale));
    fetchPrefectureText(code, locale)
      .then((t) => { if (alive && t) setText(t); })
      .catch(() => {});
    return () => { alive = false; };
  }, [code, locale]);

  return text;
}
