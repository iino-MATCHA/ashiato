/**
 * /quiz — 「あなたにおすすめの都道府県診断」。
 *
 * 広告（Meta / Google）とMATCHAの記事からの着地専用のLP。
 * 1URL・1枚で、診断から結果・体験の紹介・登録まで完結する。
 * 中身は components/quiz/QuizLanding（.web / .native をMetroが出し分ける）。
 *
 * ログイン状態は見ない。**ログイン済みの人が来ても診断はできる**
 * （記事から来た既存ユーザーが弾かれないように）。診断で選んだ県は
 * そのまま本人の地図へ足される。
 */
import { QuizLanding } from '@/components/quiz/QuizLanding';

export default function QuizScreen() {
  return <QuizLanding />;
}
