/**
 * 都道府県診断LP（/quiz）。広告からの新規獲得用。
 *
 *   広告・記事 → 診断 → おすすめの都道府県 → その土地の体験（提携先）
 *   → 「Save My Japan Map」→ 登録 → そのまま My Japan の地図へ
 *
 * **1URL・1枚で完結する。** 質問から結果まで画面遷移をせず、この中で段を
 * 切り替えるだけ（広告の着地から離脱するきっかけを作らないため）。
 *
 * 作りは components/Landing.web.tsx と同じで、RNのコンポーネントではなく
 * 実DOM＋CSSで書いている。理由も同じ ―― 出現やスクロールの演出がCSSの方が
 * 軽く、崩れない。日本地図だけは JapanSvgMap（react-native-svg）を使う。
 *
 * ここに書いていないもの
 *  - 質問と配点   … lib/quiz/questions.ts
 *  - 47県の素点   … lib/quiz/data.ts
 *  - 判定         … lib/quiz/score.ts
 *  - 写真         … lib/quiz/photos.ts
 *  - 体験の枠     … lib/quiz/affiliates.ts
 *  - 計測         … lib/quiz/funnel.ts
 *  - 文言         … lib/i18n.ts の QUIZ
 *
 * ハマりどころ（Landing.web.tsx と共通）
 *  - **opacity を演出で触らない。** 止まった瞬間に中身が消える
 *  - シェル(app/+html.tsx)は height:100dvh 固定で文書はスクロールしない。
 *    このページ自身を overflow-y:auto の器にする
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { ZoomPan } from '@/components/lp/ZoomPan';
import { contentHeight } from '@/lib/ugc/geo';
import { PREFECTURE_EN_BY_ID, prefectureName, prefectureMatchaUrl } from '@/lib/prefectures';
import { useI18n, localizeMatchaUrl, type Locale } from '@/lib/i18n';
import { QUESTIONS, type QuizQuestion } from '@/lib/quiz/questions';
import { recommend, weightsFor, type Answers, type Recommendation } from '@/lib/quiz/score';
import type { Axis } from '@/lib/quiz/data';
import { photoFor } from '@/lib/quiz/photos';
import { affiliatesFor, type AffiliateCard } from '@/lib/quiz/affiliates';
import { funnel } from '@/lib/quiz/funnel';
import { saveHandoff } from '@/lib/quiz/handoff';
import { captureUtm } from '@/lib/utm';
import { searchTourismAreas, type TourismArea } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authRedirectTo } from '@/lib/authRedirect';

/**
 * Apple でのログイン。
 * Supabase の Provider が未設定のうちは押しても失敗するので出さない
 * （管理画面で Apple を有効にしたら true にする）。
 */
const APPLE_ENABLED = false;

const CSS = `
.mjq { --ink:#14120F; --paper:#FBFAF7; --matcha:#69AF00; --shu:#C4432B; --line:#E6E3DA;
  height:var(--vh,100svh); overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;
  background:var(--paper); color:var(--ink);
  font-family:'ZenKakuGothicNew_400Regular','Zen Kaku Gothic New',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; }
.mjq .mincho { font-family:'ShipporiMincho_700Bold','Shippori Mincho',serif; }
.mjq section { padding:clamp(52px,10vw,104px) 22px; }
.mjq .wrap { max-width:900px; margin:0 auto; }
.mjq .eyebrow { font-size:10px; letter-spacing:5px; color:var(--matcha); }
.mjq h1, .mjq h2, .mjq h3 { margin:0; font-weight:400; }
.mjq .lead { color:#5E5B57; font-size:clamp(14px,3.2vw,16.5px); line-height:1.85; margin-top:14px; max-width:36em; }

/* --- ヒーロー。既存LPと同じ「暗い写真の壁＋明朝の白文字」 --- */
.mjq .qHero { position:relative; min-height:var(--vh,100svh); display:flex; align-items:center;
  justify-content:center; overflow:hidden; background:#0B0F0A; padding:22px; }
/* 写真は1枚だけ。既存LPは壁一面に敷いているが、こちらは広告の着地で、
   開くのが1秒遅れるぶんがそのまま費用になる。12枚(約2.4MB)から1枚(約110KB)にした。
   Wikimediaは任意の幅を配信しないので、縮めて軽くする手は使えない（480pxは400が返る） */
.mjq .heroShot { position:absolute; inset:0; overflow:hidden; }
.mjq .heroShot img { width:100%; height:100%; object-fit:cover; opacity:.72; filter:saturate(1.05);
  animation:mjqKb 26s ease-in-out infinite alternate; }
@keyframes mjqKb { from { transform:scale(1) } to { transform:scale(1.1) } }
.mjq .heroVeil { position:absolute; inset:0;
  background:radial-gradient(120% 80% at 50% 40%, rgba(8,12,8,.30) 0%, rgba(8,12,8,.80) 55%, rgba(8,12,8,.95) 100%); }
.mjq .heroInner { position:relative; text-align:center; max-width:720px; }
.mjq .heroBrand { color:rgba(255,255,255,.72); font-size:11px; letter-spacing:7px; }
.mjq .heroTitle { color:#fff; font-size:clamp(36px,8vw,68px); line-height:1.18; margin-top:16px; white-space:pre-line; }
.mjq .heroBy { text-align:right; margin:2px 4% 0 0; color:rgba(255,255,255,.46); font-size:11px; letter-spacing:2.5px; }
.mjq .heroLead { color:rgba(255,255,255,.86); font-size:clamp(14px,3.4vw,17px); line-height:1.8;
  margin:20px auto 0; max-width:32em; }
.mjq .heroTime { color:rgba(255,255,255,.56); font-size:11.5px; letter-spacing:2px; margin-top:26px; }
.mjq .heroSignin { display:inline-block; margin-top:18px; color:rgba(255,255,255,.66); font-size:12.5px;
  background:none; border:0; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
.mjq .heroSignin:hover { color:#fff; }

/* --- ボタン。光らせない（既存LPと同じ判断） --- */
.mjq .cta { display:inline-flex; align-items:center; justify-content:center; gap:10px; border:0; cursor:pointer;
  background:var(--matcha); color:#fff; padding:16px 34px; border-radius:999px;
  font-size:15px; font-weight:600; font-family:inherit; transition:background .2s, opacity .2s; }
.mjq .cta:hover { background:#5E9C00; }
.mjq .cta:active { opacity:.86; }
.mjq .cta:disabled { opacity:.5; cursor:default; }
.mjq .ctaWide { width:100%; max-width:360px; }

/* --- 質問の段 --- */
.mjq .qStage { min-height:var(--vh,100svh); display:flex; flex-direction:column; justify-content:center;
  padding-top:clamp(72px,12vw,110px); }
.mjq .bar { position:fixed; top:0; left:0; right:0; height:3px; background:rgba(0,0,0,.06); z-index:5; }
.mjq .barFill { height:100%; background:var(--matcha); transition:width .3s cubic-bezier(.2,.7,.2,1); }
.mjq .step { font-size:10.5px; letter-spacing:3px; color:#9B978F; }
.mjq .qTitle { font-size:clamp(23px,5.2vw,38px); line-height:1.35; margin-top:12px; }
.mjq .qHint { color:#6B6862; font-size:13px; line-height:1.8; margin-top:12px; }
/* 選択肢は「押せる面」なので枠を持ってよい（説明文の箱は作らない）。
   興味の問いが18択になったので、220pxより少し詰めて多く並べられるようにした */
.mjq .opts { display:grid; gap:9px; margin-top:30px; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); }
.mjq .opt { display:flex; align-items:center; gap:11px; text-align:left; cursor:pointer;
  background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px;
  font-family:inherit; font-size:14.5px; color:var(--ink); line-height:1.4;
  transition:border-color .18s, background .18s, transform .18s; }
.mjq .opt:hover { border-color:#C9C4B4; transform:translateY(-2px); }
.mjq .opt.on { border-color:var(--matcha); background:#F4FAEA; }
.mjq .optMark { flex:0 0 auto; width:20px; height:20px; border-radius:50%; border:1px solid #D7D2C4;
  display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; }
.mjq .opt.on .optMark { background:var(--matcha); border-color:var(--matcha); }

/* --- 日数・予算のスライダー --- */
.mjq .sliderWrap { margin-top:30px; max-width:440px; }
.mjq .sliderValue { font-size:clamp(32px,7.4vw,48px); color:var(--ink); }
.mjq .slider { width:100%; margin-top:22px; -webkit-appearance:none; appearance:none;
  height:4px; border-radius:2px; background:var(--line); outline:none; cursor:pointer; }
.mjq .slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:28px; height:28px;
  border-radius:50%; background:var(--matcha); box-shadow:0 3px 10px rgba(0,0,0,.28); cursor:pointer;
  border:3px solid #fff; }
.mjq .slider::-moz-range-thumb { width:28px; height:28px; border-radius:50%; background:var(--matcha);
  border:3px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,.28); cursor:pointer; }
.mjq .sliderScale { display:flex; justify-content:space-between; margin-top:10px;
  font-size:11.5px; color:#9B978F; letter-spacing:.5px; }
.mjq .qNav { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:32px; }
.mjq .ghost { background:none; border:0; cursor:pointer; font-family:inherit; font-size:13.5px; color:#8F887A;
  padding:10px 2px; }
.mjq .ghost:hover { color:var(--ink); }
.mjq .ghost:disabled { opacity:.35; cursor:default; }

/* --- 訪問済みの地図 --- */
.mjq .quizMap { position:relative; margin:20px auto 8px; overflow:hidden; border-radius:12px;
  touch-action:none; cursor:grab; user-select:none; -webkit-user-select:none; background:#fff;
  border:1px solid var(--line); }
.mjq .quizMap.grabbing { cursor:grabbing; }
.mjq .quizMap > .pan { transform-origin:center center; will-change:transform; }
.mjq .quizMap > .pan.eased { transition:transform .2s ease-out; }
.mjq .zoomBtns { position:absolute; right:8px; bottom:8px; display:flex; flex-direction:column; gap:6px; z-index:3; }
.mjq .zoomBtns button { width:30px; height:30px; border-radius:8px; border:1px solid #E2DED2;
  background:rgba(255,255,255,.92); color:#3A3427; font-size:17px; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center; padding:0; }
.mjq .zoomBtns button:hover { background:#fff; }
.mjq .zoomBtns button:disabled { opacity:.4; cursor:default; }
.mjq .mapFoot { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.mjq .mapCount { font-size:13px; color:#6B6862; }
.mjq .mapCount b { font-size:20px; color:var(--matcha); font-family:'ShipporiMincho_700Bold',serif; }
.mjq .mapHint { font-size:10.5px; color:#9B978F; letter-spacing:1px; }
.mjq .picked { margin-top:8px; font-size:12px; line-height:1.7; color:#8F887A;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

/* --- 結果 --- */
.mjq .qResult { background:linear-gradient(180deg,#FBFAF7 0%,#F4F1E8 100%); }
.mjq .rHead { font-size:clamp(25px,5.4vw,42px); line-height:1.35; margin-top:12px; }
.mjq .card { background:#fff; border:1px solid #ECEAE3; border-radius:18px; overflow:hidden; margin-top:22px; }
.mjq .cardImg { position:relative; aspect-ratio:16/10; overflow:hidden; background:#EEEBE2; }
.mjq .cardImg img { width:100%; height:100%; object-fit:cover; display:block; }
.mjq .cardImg .place { position:absolute; left:0; right:0; bottom:0; padding:22px 14px 10px; color:#fff;
  font-size:11px; letter-spacing:1.6px; background:linear-gradient(180deg,transparent,rgba(0,0,0,.66)); }
.mjq .rank { position:absolute; top:12px; left:12px; background:rgba(255,255,255,.9); color:#3A3427;
  font-size:10px; letter-spacing:2px; padding:5px 10px; border-radius:999px; }
.mjq .cardBody { padding:20px 20px 24px; }
.mjq .prefName { font-size:clamp(22px,4.6vw,30px); line-height:1.3; }
.mjq .prefEn { font-size:10.5px; letter-spacing:3.5px; color:#9B978F; margin-top:6px; }
.mjq .chips { display:flex; flex-wrap:wrap; gap:7px; margin-top:14px; }
.mjq .chip { font-size:11.5px; color:#4A6B00; background:#F0F6E4; border-radius:999px; padding:5px 11px; }
.mjq .why { color:#5E5B57; font-size:14px; line-height:1.9; margin-top:14px; }
.mjq .facts { margin-top:12px; padding-top:12px; border-top:1px solid var(--line);
  font-size:12.5px; line-height:1.9; color:#6B6862; }
.mjq .spots { margin-top:16px; }
.mjq .spotsTitle { font-size:10px; letter-spacing:3px; color:#9B978F; }
.mjq .spot { display:flex; align-items:baseline; gap:10px; padding:10px 0; border-bottom:1px solid var(--line);
  color:inherit; text-decoration:none; }
.mjq .spot:last-child { border-bottom:0; }
.mjq .spot b { font-size:14px; font-weight:500; }
.mjq .spot span { font-size:11.5px; color:#9B978F; }
.mjq .spot em { margin-left:auto; font-style:normal; font-size:10px; letter-spacing:1.5px; color:var(--matcha); }
.mjq .also { margin-top:44px; font-size:10px; letter-spacing:4px; color:#9B978F; }
.mjq .alsoGrid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); }
.mjq .alsoGrid .card { margin-top:12px; }
.mjq .alsoGrid .cardBody { padding:16px 16px 20px; }
.mjq .alsoGrid .prefName { font-size:20px; }

/* --- 体験（提携先）。診断中には出さない --- */
.mjq .affs { display:grid; gap:12px; margin-top:20px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); }
.mjq .aff { display:block; background:#fff; border:1px solid #ECEAE3; border-radius:16px; padding:18px;
  text-decoration:none; color:inherit; transition:transform .25s, box-shadow .25s; }
.mjq .aff:hover { transform:translateY(-3px); box-shadow:0 14px 32px rgba(0,0,0,.08); }
.mjq .affImg { height:120px; border-radius:10px; overflow:hidden; margin:-4px -4px 14px; }
.mjq .affImg img { width:100%; height:100%; object-fit:cover; }
.mjq .affBrand { font-size:10px; letter-spacing:2.5px; color:#9B978F; }
.mjq .affTitle { font-size:14.5px; line-height:1.6; margin-top:8px; }
.mjq .affMeta { font-size:12px; color:var(--matcha); margin-top:10px; }
.mjq .disclosure { font-size:11px; color:#9B978F; line-height:1.8; margin-top:16px; }

/* --- 締め（登録） --- */
.mjq .save { background:var(--ink); color:#fff; }
.mjq .save .lead { color:rgba(255,255,255,.74); }
.mjq .save h2 { font-size:clamp(24px,5vw,38px); line-height:1.35; margin-top:12px; }
.mjq .saveMap { display:flex; justify-content:center; margin:26px 0 6px; }
.mjq .saveCount { text-align:center; font-size:13px; color:rgba(255,255,255,.7); }
.mjq .saveCount b { font-size:22px; color:#8FC93A; font-family:'ShipporiMincho_700Bold',serif; }
.mjq .authBtns { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:26px; }
.mjq .oauth { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; max-width:360px;
  background:#fff; color:#14120F; border:0; border-radius:999px; padding:15px 24px; cursor:pointer;
  font-family:inherit; font-size:14.5px; font-weight:600; }
.mjq .oauth:hover { background:#F0EEE8; }
.mjq .oauth:disabled { opacity:.6; cursor:default; }
.mjq .oauthGhost { background:transparent; color:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.34); }
.mjq .oauthGhost:hover { background:rgba(255,255,255,.08); }
.mjq .noReenter { font-size:12px; color:rgba(255,255,255,.6); margin-top:14px; text-align:center; }
.mjq .err { color:#E2745F; font-size:12.5px; margin-top:12px; text-align:center; }
.mjq .haveAcc { text-align:center; margin-top:22px; font-size:12.5px; color:rgba(255,255,255,.6); }
.mjq .haveAcc button { background:none; border:0; color:#8FC93A; cursor:pointer; font-family:inherit;
  font-size:12.5px; text-decoration:underline; text-underline-offset:3px; }
.mjq footer { padding:34px 22px 48px; color:#9B978F; font-size:10.5px; letter-spacing:2.6px; }

@media (max-width:560px) {
  .mjq .opts { grid-template-columns:1fr; }
  .mjq section { padding-top:clamp(40px,9vw,64px); }
}
@media (prefers-reduced-motion: reduce) {
  .mjq .heroGrid img { animation:none; }
  .mjq .opt:hover, .mjq .aff:hover { transform:none; }
}
`;

/**
 * ヒーローの写真。
 * 富士山と海が1枚に入っていて、どこの国の話かが一目で分かる。
 * 47件の中でいちばん軽い（約110KB）のもここに置いた理由。
 */
const HERO_SHOT = photoFor(22);

/**
 * 軸 → 観光エリアの area_type。
 * 「効いた軸に合うエリア」を上に出すために使う（マスタの実データ）。
 *
 * **選択肢のidではなく、計算済みの軸の重み(weightsFor)から引く。**
 * 以前は answers.interest / answers.terrain の生の選択肢idをキーにしていたが、
 * 選択肢を増減させるたびにここも直す必要があり、抜けると静かに壊れる
 * （実際、選択肢を6→18・terrain→sceneに作り替えたときに合わせ忘れかけた）。
 * 軸は questions.ts がどう変わっても score.ts が必ず計算してくれるので、
 * こちらを参照すれば選択肢の増減に引きずられない。
 */
const TYPES_BY_AXIS: Partial<Record<Axis, string[]>> = {
  onsen: ['hot_spring'],
  nature: ['nature', 'lake', 'mountain', 'scenic_area', 'volcano', 'park', 'scenic_route', 'coastal_area'],
  history: ['historic_area', 'shrine_temple', 'historic_route'],
  craft: ['craft_area'],
  city: ['district', 'market', 'theme_park'],
  island: ['island', 'island_group', 'beach', 'resort'],
  food: ['market', 'district'],
  sea: ['coastal_area', 'beach', 'island', 'island_group'],
  mountain: ['mountain', 'nature', 'lake'],
  wildlife: ['nature', 'island', 'coastal_area'],
};

type Stage = 'hero' | 'quiz' | 'result';

export function QuizLanding() {
  const { t, locale } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<Stage>('hero');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Recommendation[]>([]);
  const [spots, setSpots] = useState<Record<number, TourismArea[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 体験の枠を数えた県。同じ結果で二重に数えないための目印 */
  const affSeen = useRef<number | null>(null);

  // 流入元を預かる。LP表示を1回だけ数える
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    captureUtm();
    funnel.view();
  }, []);

  /** 段が変わったら先頭へ。前の段のスクロール位置が残ると迷子になる */
  const toTop = useCallback(() => {
    try {
      rootRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}
  }, []);
  useEffect(() => { toTop(); }, [stage, step, toTop]);

  /**
   * スライダーの問いに、触る前から既定値を入れておく。
   * 触らずに「次へ」を押しても answers[q.id] が空のままだと、判定側が
   * その問いを無視してしまう（=「何も答えていない」と同じ扱いになる）。
   */
  useEffect(() => {
    if (stage !== 'quiz') return;
    const cur = QUESTIONS[step];
    if (cur?.kind === 'slider' && !(answers[cur.id]?.length) && cur.default != null) {
      setAnswers((a) => ({ ...a, [cur.id]: [String(cur.default)] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, step]);

  const q: QuizQuestion = QUESTIONS[step];
  const total = QUESTIONS.length;
  const picked = answers[q?.id] ?? [];
  const canGo = q?.kind === 'prefectures' ? true : picked.length > 0;

  const start = () => {
    funnel.start();
    setStage('quiz');
    setStep(0);
  };

  const choose = (optId: string) => {
    if (!q) return;
    if (q.kind === 'single') {
      setAnswers((a) => ({ ...a, [q.id]: [optId] }));
      funnel.answer(q.id, step, total, optId);
      // 1つ選べば次へ。押した手応えが残るように少しだけ待つ
      window.setTimeout(() => advance({ ...answers, [q.id]: [optId] }), 180);
      return;
    }
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      const on = cur.includes(optId);
      if (on) return { ...a, [q.id]: cur.filter((x) => x !== optId) };
      if (q.max && cur.length >= q.max) return a; // 上限。黙って足さない
      return { ...a, [q.id]: [...cur, optId] };
    });
  };

  const advance = (a: Answers = answers) => {
    // single は選んだ時点で数えてある。それ以外はここで（最後の問いも取りこぼさない）
    if (q && q.kind !== 'single') {
      const value = q.kind === 'prefectures' ? String(visited.size) : (a[q.id] ?? []).join('|');
      funnel.answer(q.id, step, total, value);
    }
    if (step + 1 < total) {
      setStep(step + 1);
      return;
    }
    finish(a);
  };

  const finish = (a: Answers = answers) => {
    const codes = Array.from(visited);
    funnel.complete(codes.length);
    const list = recommend(a, codes, 3);
    setResults(list);
    setStage('result');
    // 診断で選んだ県は、この時点で預けておく。CTAを押す前に離れても残る
    saveHandoff(codes, list.map((r) => r.code));
    funnel.resultView(
      list.map((r) => r.code),
      list.map((r) => PREFECTURE_EN_BY_ID[r.code] ?? String(r.code)),
      codes.length
    );
  };

  /**
   * もう一度答える。
   * **前の答えを消してから始める。** 残したまま戻ると、複数選択の問いが
   * 前回の選択に足す形になり、選んでいない軸が結果の理由に出てしまう（実測）。
   * 訪問済みの県は答えではなく事実なので、そのまま残す。
   */
  const retake = () => {
    setAnswers({});
    setResults([]);
    setSpots({});
    affSeen.current = null;
    setStage('quiz');
    setStep(0);
  };

  const toggle = (code: number) => {
    setVisited((cur) => {
      const next = new Set(cur);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  /** 結果の県ごとに、興味に合う観光エリアを取りに行く */
  useEffect(() => {
    if (stage !== 'result' || !results.length) return;
    let alive = true;
    // 効いた軸（重みが乗っているもの）から、合うエリアのarea_typeを集める
    const w = weightsFor(answers);
    const wanted = new Set<string>();
    (Object.keys(w) as Axis[])
      .filter((a) => (w[a] ?? 0) > 0)
      .forEach((a) => (TYPES_BY_AXIS[a] ?? []).forEach((tp) => wanted.add(tp)));

    (async () => {
      const out: Record<number, TourismArea[]> = {};
      for (const r of results) {
        const en = PREFECTURE_EN_BY_ID[r.code];
        if (!en) continue;
        try {
          const areas = await searchTourismAreas(en);
          // 興味に合う型を前に。あとは元の並び（名前順）
          const sorted = [...areas].sort((x, y) => {
            const a = wanted.has(x.areaType) ? 0 : 1;
            const b = wanted.has(y.areaType) ? 0 : 1;
            return a - b;
          });
          out[r.code] = sorted.slice(0, 4);
        } catch {
          out[r.code] = [];
        }
      }
      if (alive) setSpots(out);
    })();
    return () => { alive = false; };
  }, [stage, results, answers]);

  const lead = results[0] ?? null;
  const affiliates: AffiliateCard[] = useMemo(
    () => (lead ? affiliatesFor(lead.code, PREFECTURE_EN_BY_ID[lead.code] ?? '', locale as Locale) : []),
    [lead, locale]
  );

  /**
   * 体験の枠が出たことを1回だけ数える。
   * IntersectionObserver は描画されていないと発火しないので使わない
   * （結果を出した時点で画面に入っている作りにしてある）。
   */
  useEffect(() => {
    if (stage !== 'result' || !lead || !affiliates.length) return;
    if (affSeen.current === lead.code) return;
    affSeen.current = lead.code;
    funnel.affiliateImpression(
      lead.code,
      PREFECTURE_EN_BY_ID[lead.code] ?? '',
      affiliates.map((a) => a.providerId)
    );
  }, [stage, lead, affiliates]);

  // --- 登録 ------------------------------------------------------------
  const handoff = () => saveHandoff(Array.from(visited), results.map((r) => r.code));

  const signUpGoogle = async () => {
    setError(null);
    handoff();
    funnel.saveMapClick(visited.size, 'google');
    if (!isSupabaseConfigured) return router.push('/(auth)/login?signup=1');
    setBusy(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: authRedirectTo } });
      // ここでブラウザがGoogleへ飛ぶ。戻り先は '/' で、認証ゲートが引き継ぐ
    } catch (e: any) {
      setBusy(false);
      setError(t('quiz.cta.failed'));
    }
  };

  const signUpApple = async () => {
    setError(null);
    handoff();
    funnel.saveMapClick(visited.size, 'apple');
    setBusy(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: authRedirectTo } });
    } catch (e: any) {
      setBusy(false);
      setError(t('quiz.cta.failed'));
    }
  };

  const signUpEmail = () => {
    handoff();
    funnel.saveMapClick(visited.size, 'email');
    router.push('/(auth)/login?signup=1');
  };

  const signIn = () => {
    // ログインする人も、選んだ県は持って行く（既存の地図に足される）
    handoff();
    router.push('/(auth)/login');
  };

  // --- 文の組み立て ----------------------------------------------------
  const tagsFor = (r: Recommendation) =>
    r.matched.map((a) => t(`quiz.axis.${a}`)).filter(Boolean);

  const listNames = (rs: Recommendation[]) =>
    rs.map((r) => prefectureName(r.code, locale)).join(locale === 'en' ? ', ' : '・');

  const seasonLabel = () => {
    const s = (answers.season ?? [])[0];
    return s && s !== 'undecided' ? t(`quiz.o.${s}`) : null;
  };

  /**
   * 日数の目安を出してよいか。
   *
   * 「3日」とスライダーで答えた人に「5日ほど取ってください」と返すと、
   * 聞いた意味が無くなる（実際に北海道でそうなった）。答えた日数を
   * 少し超える程度（+1日）までは許容し、それより収まらない土地では
   * 日数の話をしない ―― 土地としては勧められるので、結果自体は出す。
   */
  const daysFits = (days: number) => {
    const chosen = Number((answers.days ?? [])[0]);
    if (!Number.isFinite(chosen) || chosen <= 0) return true;
    return days <= chosen + 1;
  };

  // --- 地図の寸法 ------------------------------------------------------
  /**
   * ZoomPan は窓の大きさを数値で要る（切り抜きの計算に使う）ので、
   * CSSに任せず自分で測る。左右の余白(22px×2)を引いて、狭い端末でも
   * はみ出さないようにする（320px幅の端末で横にスクロールしていた）。
   */
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 375 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const mapW = Math.max(240, Math.min(340, vw - 44));
  const mapH = Math.round((mapW * contentHeight()) / 860);

  return (
    <div className="mjq" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ============================================================ ヒーロー */}
      {stage === 'hero' && (
        <section className="qHero">
          {!!HERO_SHOT && (
            <div className="heroShot" aria-hidden>
              <img src={HERO_SHOT.url} alt="" fetchPriority="high" />
            </div>
          )}
          <div className="heroVeil" aria-hidden />
          <div className="heroInner">
            <div className="heroBrand">M Y&nbsp; J A P A N</div>
            <h1 className="heroTitle mincho">{t('quiz.hero.title')}</h1>
            <div className="heroBy">{t('quiz.hero.byMatcha')}</div>
            <p className="heroLead">{t('quiz.hero.lead')}</p>
            <div style={{ marginTop: 30 }}>
              <button type="button" className="cta" onClick={start}>
                {t('quiz.hero.cta')} →
              </button>
            </div>
            <div className="heroTime">{t('quiz.hero.time')}</div>
            <button type="button" className="heroSignin" onClick={signIn}>
              {t('quiz.hero.signin')}
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ 質問 */}
      {stage === 'quiz' && q && (
        <>
          <div className="bar">
            <div className="barFill" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <section className="qStage">
            <div className="wrap">
              <div className="step">{t('quiz.progress', { n: step + 1, total })}</div>
              <h2 className="qTitle mincho">{t(q.titleKey)}</h2>
              {!!q.hintKey && <p className="qHint">{t(q.hintKey)}</p>}
              {q.kind === 'multi' && !!q.max && (
                <p className="qHint" style={{ marginTop: 6 }}>
                  {t('quiz.pickUpTo', { n: q.max })} · {t('quiz.chosen', { n: picked.length })}
                </p>
              )}

              {q.kind === 'prefectures' ? (
                <>
                  <ZoomPan width={mapW} height={mapH}>
                    <JapanSvgMap
                      visited={visited}
                      onToggle={toggle}
                      width={mapW}
                      okinawaInset
                      // LPは常に明るい地なので、テーマに寄らせず固定する
                      emptyFill="#EDEAE1"
                      strokeFill="#B9B3A4"
                      tint="#69AF00"
                    />
                  </ZoomPan>
                  <div className="mapFoot">
                    <div className="mapCount">
                      <b>{visited.size}</b> / 47
                    </div>
                    <div className="mapHint">{t('quiz.pinchHint')}</div>
                  </div>
                  <p className="picked">
                    {visited.size
                      ? Array.from(visited)
                          .sort((a, b) => a - b)
                          .map((c) => prefectureName(c, locale))
                          .join(' · ')
                      : t('quiz.visitedNone')}
                  </p>
                </>
              ) : q.kind === 'slider' ? (
                <SliderQuestion
                  q={q}
                  value={Number(picked[0] ?? q.default ?? q.sliderMin ?? 0)}
                  onChange={(n) => setAnswers((a) => ({ ...a, [q.id]: [String(n)] }))}
                  t={t}
                />
              ) : (
                <div className="opts">
                  {(q.options ?? []).map((o) => {
                    const on = picked.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`opt${on ? ' on' : ''}`}
                        onClick={() => choose(o.id)}
                        aria-pressed={on}
                      >
                        <span className="optMark">{on ? '✓' : ''}</span>
                        <span>{t(o.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="qNav">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => (step === 0 ? setStage('hero') : setStep(step - 1))}
                >
                  ← {t('quiz.back')}
                </button>
                {q.kind !== 'single' && (
                  <button type="button" className="cta" disabled={!canGo} onClick={() => advance()}>
                    {step + 1 === total ? t('quiz.seeResult') : t('quiz.next')} →
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============================================================ 結果 */}
      {stage === 'result' && (
        <>
          <section className="qResult">
            <div className="wrap">
              <div className="eyebrow">{t('quiz.result.eyebrow')}</div>
              <h2 className="rHead mincho">
                {/* 47県すべて行っている人には勧める先が無い。地図の保存へ回す */}
                {!lead
                  ? t('quiz.result.none')
                  : results.length === 1
                    ? t('quiz.result.headline1', { name: prefectureName(lead.code, locale) })
                    : t('quiz.result.headlineN', { names: listNames(results) })}
              </h2>

              {/* いちばんのおすすめ */}
              {lead && (
                <PrefectureCard
                  r={lead}
                  rank={1}
                  locale={locale}
                  t={t}
                  tags={tagsFor(lead)}
                  season={seasonLabel()}
                  showDays={daysFits(lead.days)}
                  areas={spots[lead.code] ?? []}
                  onMatcha={(area) =>
                    funnel.matchaClick(lead.code, PREFECTURE_EN_BY_ID[lead.code] ?? '', area)
                  }
                />
              )}

              {/* 2件目以降 */}
              {results.length > 1 && (
                <>
                  <div className="also">{t('quiz.result.also', {})}</div>
                  <div className="alsoGrid">
                    {results.slice(1).map((r, i) => (
                      <PrefectureCard
                        key={r.code}
                        r={r}
                        rank={i + 2}
                        compact
                        locale={locale}
                        t={t}
                        tags={tagsFor(r)}
                        season={seasonLabel()}
                        showDays={daysFits(r.days)}
                        areas={spots[r.code] ?? []}
                        onMatcha={(area) => funnel.matchaClick(r.code, PREFECTURE_EN_BY_ID[r.code] ?? '', area)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ------------------------------------------------ 体験（提携先） */}
          {!!lead && !!affiliates.length && (
            <section style={{ background: '#fff' }}>
              <div className="wrap">
                <div className="eyebrow">EXPERIENCES</div>
                <h2 className="rHead mincho" style={{ fontSize: 'clamp(22px,4.6vw,32px)' }}>
                  {t('quiz.aff.title', { name: prefectureName(lead.code, locale) })}
                </h2>
                <p className="lead">{t('quiz.aff.lead')}</p>
                <div className="affs">
                  {affiliates.map((a) => (
                    <a
                      key={a.key}
                      className="aff"
                      href={a.url}
                      target="_blank"
                      rel="noopener sponsored"
                      onClick={() =>
                        funnel.affiliateClick(
                          lead.code,
                          PREFECTURE_EN_BY_ID[lead.code] ?? '',
                          a.providerId,
                          a.title,
                          a.isSearch
                        )
                      }
                    >
                      {!!a.image && (
                        <div className="affImg">
                          <img src={a.image} alt="" loading="lazy" />
                        </div>
                      )}
                      <div className="affBrand">{a.providerName}</div>
                      <div className="affTitle">
                        {a.isSearch
                          ? t('quiz.aff.search', { name: prefectureName(lead.code, locale) })
                          : a.title}
                      </div>
                      <div className="affMeta">
                        {a.priceFrom
                          ? t('quiz.aff.from', { price: a.priceFrom.toLocaleString() })
                          : '→'}
                      </div>
                    </a>
                  ))}
                </div>
                <p className="disclosure">{t('quiz.aff.disclosure')}</p>
              </div>
            </section>
          )}

          {/* ------------------------------------------------ 登録 */}
          <section className="save">
            <div className="wrap">
              <div className="eyebrow">{t('quiz.cta.eyebrow')}</div>
              <h2 className="mincho">{t('quiz.cta.title')}</h2>
              <p className="lead">
                {visited.size ? t('quiz.cta.lead', { n: visited.size }) : t('quiz.cta.leadEmpty')}
              </p>

              <div className="saveMap">
                <JapanSvgMap
                  visited={visited}
                  width={Math.min(mapW, 300)}
                  okinawaInset
                  emptyFill="#3A362E"
                  strokeFill="#5C564A"
                  tint="#8FC93A"
                />
              </div>
              <div className="saveCount">
                <b>{visited.size}</b> / 47 · {t('quiz.result.mapLead')}
              </div>

              <div className="authBtns">
                <button type="button" className="oauth" disabled={busy} onClick={signUpGoogle}>
                  {t('quiz.cta.google')}
                </button>
                {APPLE_ENABLED && (
                  <button type="button" className="oauth" disabled={busy} onClick={signUpApple}>
                    {t('quiz.cta.apple')}
                  </button>
                )}
                <button type="button" className="oauth oauthGhost" disabled={busy} onClick={signUpEmail}>
                  {t('quiz.cta.email')}
                </button>
              </div>
              <p className="noReenter">{t('quiz.cta.noReenter')}</p>
              {!!error && <p className="err">{error}</p>}

              <p className="haveAcc">
                {t('quiz.cta.have')}{' '}
                <button type="button" onClick={signIn}>{t('quiz.cta.signin')}</button>
              </p>

              <p style={{ textAlign: 'center', marginTop: 26 }}>
                <button
                  type="button"
                  className="ghost"
                  style={{ color: 'rgba(255,255,255,.5)' }}
                  onClick={retake}
                >
                  {t('quiz.result.retake')}
                </button>
              </p>
            </div>
          </section>
        </>
      )}

      <footer>MY JAPAN BY MATCHA, INC. · ALL RIGHTS RESERVED</footer>
    </div>
  );
}

/**
 * 日数・予算のスライダー。
 * 表示中の数値だけ id で出し分ける（2種類だけなので、汎用の書式化は作らない）。
 */
function SliderQuestion({
  q,
  value,
  onChange,
  t,
}: {
  q: QuizQuestion;
  value: number;
  onChange: (n: number) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const fmt = (n: number) =>
    q.id === 'days' ? t('quiz.slider.daysValue', { n }) : t('quiz.slider.budgetValue', { n: n.toLocaleString() });
  return (
    <div className="sliderWrap">
      <div className="sliderValue mincho">{fmt(value)}</div>
      <input
        type="range"
        className="slider"
        min={q.sliderMin}
        max={q.sliderMax}
        step={q.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="sliderScale">
        <span>{fmt(q.sliderMin ?? 0)}</span>
        <span>{fmt(q.sliderMax ?? 0)}</span>
      </div>
    </div>
  );
}

/** 結果の1件ぶん。写真・理由・日数・その土地で行くところ */
function PrefectureCard({
  r,
  rank,
  compact,
  locale,
  t,
  tags,
  season,
  showDays,
  areas,
  onMatcha,
}: {
  r: Recommendation;
  rank: number;
  compact?: boolean;
  locale: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  tags: string[];
  season: string | null;
  /** 日数の目安を出すか（答えた日数と食い違うときは出さない） */
  showDays: boolean;
  areas: TourismArea[];
  onMatcha: (area: string) => void;
}) {
  const name = prefectureName(r.code, locale);
  const photo = photoFor(r.code);
  const en = PREFECTURE_EN_BY_ID[r.code] ?? '';
  const tagList = tags.slice(0, 3).join(locale === 'en' ? ', ' : '・');
  const prefMatcha = localizeMatchaUrl(prefectureMatchaUrl(r.code));

  return (
    <div className="card">
      {!!photo && (
        <div className="cardImg">
          <img src={photo.url} alt={name} loading={rank === 1 ? 'eager' : 'lazy'} />
          <div className="rank">{`0${rank}`}</div>
          <div className="place">{photo.title}</div>
        </div>
      )}
      <div className="cardBody">
        <div className="prefName mincho">{name}</div>
        <div className="prefEn">{en.toUpperCase()}</div>

        {!!tags.length && (
          <div className="chips">
            {tags.map((x) => (
              <span className="chip" key={x}>{x}</span>
            ))}
          </div>
        )}

        <p className="why">{t('quiz.result.whyTags', { tags: tagList, name })}</p>

        {/* 出すものが無ければ罫線ごと出さない（空の枠を残さない） */}
        {(showDays || (!!season && r.seasonFits)) && (
          <div className="facts">
            {showDays ? t('quiz.result.days', { n: r.days }) : ''}
            {season && r.seasonFits ? ` ${t('quiz.result.season', { season })}` : ''}
          </div>
        )}

        {!compact && (
          <div className="spots">
            <div className="spotsTitle">{t('quiz.result.spots', { name })}</div>
            {/*
              観光エリアが1件も無い県（秋田・福井・滋賀）でも、県単位のMATCHAの
              一覧は必ず出せる。「準備中」で終わらせない。
            */}
            {!areas.length && !!prefMatcha && (
              <a
                className="spot"
                href={prefMatcha}
                target="_blank"
                rel="noopener"
                onClick={() => onMatcha(en)}
              >
                <b>{t('quiz.aff.matchaTitle', { name })}</b>
                <em>MATCHA →</em>
              </a>
            )}
            {areas.length ? (
              areas.map((a) => {
                const url = localizeMatchaUrl(a.matchaUrl);
                const inner = (
                  <>
                    <b>{a.name}</b>
                    <span>{a.municipality}</span>
                    {!!url && <em>MATCHA →</em>}
                  </>
                );
                return url ? (
                  <a
                    key={a.id}
                    className="spot"
                    href={url}
                    target="_blank"
                    rel="noopener"
                    onClick={() => onMatcha(a.name)}
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="spot" key={a.id}>{inner}</div>
                );
              })
            ) : !prefMatcha ? (
              <p className="why" style={{ marginTop: 8 }}>{t('quiz.result.spotsNone', { name })}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
