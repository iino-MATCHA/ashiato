/**
 * 題を指定の幅で折り返す。
 *
 * SVGにもcanvasにも自動折り返しが無いので、文字幅を見積もって自分で切る。
 * 英字は単語の切れ目で、日本語（切れ目が無い）は文字単位で折る。
 * 正確な実測はしない ―― プレビューと書き出しで同じ結果になることのほうが大事。
 */

/** 1文字あたりのおおよその幅（フォントサイズに対する比） */
function charWidth(ch: string): number {
  // 全角（CJK・全角記号）はほぼ正方形、英数字は半分強
  return /[\u3000-\u30ff\u3400-\u9fff\uff00-\uff60]/.test(ch) ? 1.0 : 0.52;
}

export function measure(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) w += charWidth(ch) * fontSize;
  return w;
}

/** maxWidth に収まるよう最大 maxLines 行に折る。溢れたぶんは最終行に … を付けて切る */
export function wrapText(text: string, fontSize: number, maxWidth: number, maxLines = 2): string[] {
  if (!text) return [''];
  if (measure(text, fontSize) <= maxWidth) return [text];

  const lines: string[] = [];
  let line = '';
  // 英字は語のまとまりを保ち、それ以外は1文字ずつ
  const tokens = text.match(/[A-Za-z0-9''’.,!?-]+\s*|\s+|[\s\S]/g) ?? [];

  for (const tk of tokens) {
    const next = line + tk;
    if (measure(next, fontSize) > maxWidth && line) {
      lines.push(line.trimEnd());
      line = tk.trimStart();
      if (lines.length === maxLines - 1) {
        // 最終行。残り全部を入れて、溢れたら削って … を付ける
        let rest = text.slice(text.indexOf(line));
        while (rest && measure(rest + '…', fontSize) > maxWidth) rest = rest.slice(0, -1);
        lines.push(rest === text.slice(text.indexOf(line)) ? rest : rest + '…');
        return lines;
      }
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.slice(0, maxLines);
}
