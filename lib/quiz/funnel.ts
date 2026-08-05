/**
 * 診断LPの計測。
 *
 * **イベント名を増やすときはここに関数を足す。** 画面側は
 * `funnel.resultView(...)` のように呼ぶだけで、GA4 と Meta Pixel の
 * 両方に同じ内容が飛ぶ。流入元（UTM）は毎回自動で乗る。
 *
 * GA4 の名前は snake_case、Pixel は標準イベントに寄せてある:
 *
 *  | 何を                  | GA4                | Meta Pixel            |
 *  |----------------------|--------------------|-----------------------|
 *  | LP表示                | quiz_view          | PageView（初期化時）    |
 *  | 診断開始              | quiz_start         | QuizStart（独自）       |
 *  | 各問の回答            | quiz_answer        | —                     |
 *  | 診断完了              | quiz_complete      | Lead                  |
 *  | 結果表示              | quiz_result_view   | ViewContent           |
 *  | Affiliate表示         | affiliate_impression | AffiliateImpression（独自） |
 *  | Affiliateクリック      | affiliate_click    | AffiliateClick（独自）   |
 *  | Save My Japan Map     | save_map_click     | SaveMapClick（独自）     |
 *  | 登録完了              | sign_up_complete   | CompleteRegistration  |
 */
import { track } from '@/lib/analytics';
import { initPixel, pixelTrack, pixelTrackCustom } from '@/lib/pixel';
import { getUtm } from '@/lib/utm';

/** 診断の出どころ。他のLPからも診断を出すときに分けて見られるようにする */
const SOURCE = 'prefecture_quiz';

function send(ga: string, params: Record<string, unknown> = {}) {
  track(ga, { source: SOURCE, ...getUtm(), ...params });
}

export const funnel = {
  /** LPが表示された。Pixelの初期化もここで済ませる */
  view() {
    initPixel();
    send('quiz_view');
  },

  /** 「診断をはじめる」が押された */
  start() {
    send('quiz_start');
    pixelTrackCustom('QuizStart', getUtm());
  },

  /** 1問答えた。どこで離脱しているかを見るため */
  answer(questionId: string, index: number, total: number, value?: string) {
    send('quiz_answer', { question_id: questionId, step: index + 1, total, value });
  },

  /** 全問終わった（結果の計算前） */
  complete(visitedCount: number) {
    send('quiz_complete', { visited_count: visitedCount });
    pixelTrack('Lead', { content_category: SOURCE, visited_count: visitedCount });
  },

  /** 結果が出た */
  resultView(codes: number[], names: string[], visitedCount: number) {
    send('quiz_result_view', {
      prefecture_codes: codes.join(','),
      prefectures: names.join(','),
      result_count: codes.length,
      visited_count: visitedCount,
    });
    pixelTrack('ViewContent', {
      content_type: 'prefecture',
      content_ids: codes.map(String),
      content_name: names.join(','),
    });
  },

  /** 体験の枠が画面に入った（結果を出したあと1回だけ） */
  affiliateImpression(prefectureCode: number, prefecture: string, providers: string[]) {
    send('affiliate_impression', {
      prefecture_code: prefectureCode,
      prefecture,
      providers: providers.join(','),
      slots: providers.length,
    });
    pixelTrackCustom('AffiliateImpression', { prefecture, providers: providers.join(',') });
  },

  /** 体験の枠が押された */
  affiliateClick(prefectureCode: number, prefecture: string, provider: string, title: string, isSearch: boolean) {
    send('affiliate_click', {
      prefecture_code: prefectureCode,
      prefecture,
      provider,
      item: title,
      link_type: isSearch ? 'search' : 'product',
    });
    pixelTrackCustom('AffiliateClick', { prefecture, provider, item: title });
  },

  /** MATCHAの記事へ出た（自社導線。アフィリエイトとは分けて数える） */
  matchaClick(prefectureCode: number, prefecture: string, area: string) {
    send('matcha_click', { prefecture_code: prefectureCode, prefecture, area });
  },

  /** 「Save My Japan Map」が押された */
  saveMapClick(visitedCount: number, method: string) {
    send('save_map_click', { visited_count: visitedCount, method });
    pixelTrackCustom('SaveMapClick', { visited_count: visitedCount, method });
  },

  /**
   * 登録が完了した。
   * 診断から来た人だけ source が付くよう、handoff の有無を渡す。
   */
  signUpComplete(method: string, fromQuiz: boolean, visitedCount: number) {
    send('sign_up_complete', { method, from_quiz: fromQuiz, visited_count: visitedCount });
    pixelTrack('CompleteRegistration', {
      content_name: fromQuiz ? SOURCE : 'app',
      status: true,
      visited_count: visitedCount,
    });
  },
};
