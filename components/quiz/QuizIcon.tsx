/**
 * 診断の選択肢に添える絵。
 *
 * **既製のアイコンフォント（@expo/vector-icons）や絵文字は使わない。**
 * 線が太かったり色が固定だったりで、和紙の面から浮く。
 *
 * ---------------------------------------------------------------------------
 * 絵の入れ方
 * ---------------------------------------------------------------------------
 * 画像を `public/quiz-icons/<選択肢id>.svg` に置くだけ。ここを触る必要は無い。
 * 置いていない選択肢には何も出ない（欠けても崩れない）。
 * 選択肢の id は lib/quiz/questions.ts の QuizOption.id ―― ramen / sake /
 * sweets / shrines / castles / crafts / festivals / cityShopping / nightlife /
 * artMuseums / onsen / mountainHikes / snow / beaches / island / wildlife /
 * gardens / popCulture の18個。
 *
 * 仕様（発注するときはこのまま渡せる）
 *  - 版面 28×28。余白は上下左右 1px ずつ空け、絵は 26×26 に収める
 *  - 表示は 28×28 CSS px 固定。倍率は端末に任せる（最大3倍＝84px相当）
 *  - **SVGを推奨。** 線画なので拡大で滲まず、1ファイルで全倍率に足りる
 *  - ラスタで作るなら 84×84 以上（3倍端末のため）。透明背景のPNG。
 *    webpは web では問題ないが、**ネイティブのiOS/Androidで扱いが揺れる**ので
 *    避ける（このアプリはWeb運用が前提だが、同じ絵を後でアプリ側にも使う）
 *  - 線は 1.5px 相当・端と角は丸める（アプリの罫線と同じ表情）
 *  - 色は2色だけ。**輪郭は #4A453C（墨）、差し色は #69AF00（MATCHA green）**。
 *    朱色 #C4432B は御朱印専用なので使わない
 *  - 塗りは置かず線だけで持たせる（白い面に馴染み、暗い面でも効く）
 *  - 26pxで読めることが条件。器の中に細かい線を寄せると潰れる
 *    （自作した丼の絵で実際に「歯の生えた口」に見えた）
 */
import React from 'react';

/**
 * 絵を持っている選択肢と、その拡張子。
 * ここに足すと、その選択肢に `/quiz-icons/<id>.<拡張子>` が出る。
 * **ファイルを置いてから足すこと** ―― 無い画像を指すと枠だけ空く。
 *
 * ラスタで受け取ったものは `scripts/normalize-quiz-icons.mjs` を通す
 * （余白を落として96pxに揃える）。SVGはそのまま置ける。
 */
const ICONS: Record<string, 'svg' | 'png'> = {};

export function hasQuizIcon(id: string): boolean {
  return !!ICONS[id];
}

export function QuizIcon({ id, size = 28 }: { id: string; size?: number }) {
  const ext = ICONS[id];
  if (!ext) return null;
  return (
    <img
      src={`/quiz-icons/${id}.${ext}`}
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      style={{ display: 'block' }}
    />
  );
}
