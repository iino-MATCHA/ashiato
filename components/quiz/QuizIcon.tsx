/**
 * 診断の選択肢に添える絵。
 *
 * **既製のアイコンフォントは使わない。** このアプリの線の太さ・角の丸み・
 * 抹茶色の置きどころに合わせて、1つずつ手で描いてある（@expo/vector-icons や
 * 絵文字は、線が太かったり色が固定だったりで、和紙の面から浮く）。
 *
 * 描き方の決まり
 *  - viewBox は 28x28。線は 1.5、角と端は丸める（アプリの罫線と同じ表情）
 *  - 色は2色だけ。輪郭は currentColor（＝文字と同じ墨）、差し色は抹茶
 *    `--matcha`。**朱色は使わない**（御朱印専用と決めてある）
 *  - 塗りは置かない。線だけで持たせる ―― 白い面に馴染み、暗い面でも効く
 *
 * まだ ramen だけ。残りは絵の出来を見てから足す。
 * 持っていない id には null を返すので、足りないぶんは何も出ない。
 */
import React from 'react';

const INK = 'currentColor';
const MATCHA = '#69AF00';

/** 共通の線の表情 */
const S = {
  fill: 'none' as const,
  stroke: INK,
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * ラーメン。丼を正面から見た構図。
 *
 * 下から順に、高台 → 器の胴 → 縁（手前の稜線だけ）→ 盛り上がった麺 →
 * 葱 → 湯気。**器の中には何も描かない。** 縁の帯に具を描き込むと、
 * 小さくしたときに線が寄り集まって「歯の生えた口」に見えた（実際に描いて確認）。
 *
 * 麺の山は輪郭の頂きを凸凹にして表す ―― 滑らかな半円にすると丼飯や
 * 鍋の蓋に見える。葱は抹茶色の丸3つ。海苔の四角も試したが、
 * 26pxでは荷札のように見えたので採らなかった。
 */
function Ramen() {
  return (
    <>
      {/* 湯気。2筋、長さを少し違えて自然に見せる */}
      <path d="M10.6 6.6C9.4 5.2 11.5 4.2 10.4 2.7" stroke={MATCHA} strokeWidth={1.3} strokeLinecap="round" fill="none" />
      <path d="M16.2 6.2C15 4.6 17.1 3.6 16 1.9" stroke={MATCHA} strokeWidth={1.3} strokeLinecap="round" fill="none" />

      {/* 盛り上がった麺。頂きの凸凹で「山盛り」を出す */}
      <path d="M6.8 15.1c.8-2.9 3-4.5 4.9-3.7 1.2.5 1.5-1 3.1-1s2.1 1.4 3.3 1c1.7-.6 2.5 1.1 3.1 3.7" {...S} />
      {/* 葱 */}
      <circle cx={10.9} cy={13.2} r={0.9} fill={MATCHA} />
      <circle cx={14.2} cy={12.3} r={0.9} fill={MATCHA} />
      <circle cx={17.4} cy={13.3} r={0.9} fill={MATCHA} />

      {/* 縁（手前の稜線）と器の胴。両端を同じ点にして継ぎ目を作らない */}
      <path d="M4.8 15.4Q14 17.4 23.2 15.4" {...S} />
      <path d="M4.8 15.4C5.4 21.3 9.1 24.9 14 24.9s8.6-3.6 9.2-9.5" {...S} />
      {/* 高台 */}
      <path d="M10.8 26.4h6.4M12.4 24.9L12 26.4M15.6 24.9l.4 1.5" {...S} />
    </>
  );
}

/** 選択肢id → 絵。無いものは null（何も出さない） */
const ICONS: Record<string, () => React.ReactElement> = {
  ramen: Ramen,
};

export function hasQuizIcon(id: string): boolean {
  return !!ICONS[id];
}

export function QuizIcon({ id, size = 28 }: { id: string; size?: number }) {
  const Draw = ICONS[id];
  if (!Draw) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden focusable="false">
      <Draw />
    </svg>
  );
}
