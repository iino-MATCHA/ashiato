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
import { PREFECTURE_EN_BY_ID, PREFECTURE_JA_BY_ID, prefectureName, prefectureMatchaUrl } from '@/lib/prefectures';
import { useI18n, localizeMatchaUrl, type Locale } from '@/lib/i18n';
import { QUESTIONS, type QuizQuestion } from '@/lib/quiz/questions';
import { recommend, weightsFor, type Answers, type Recommendation } from '@/lib/quiz/score';
import type { Axis } from '@/lib/quiz/data';
import { photoFor, PREFECTURE_PHOTO } from '@/lib/quiz/photos';
import { QuizIcon, hasQuizIcon } from '@/components/quiz/QuizIcon';
import { usePrefectureText } from '@/lib/usePrefectureText';
import { affiliatesFor, type AffiliateCard } from '@/lib/quiz/affiliates';
import { funnel } from '@/lib/quiz/funnel';
import { saveHandoff, clearHandoff } from '@/lib/quiz/handoff';
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

/**
 * 設問ごとの背景（日本の観光地）。
 * 白い紙のままでは診断が事務的に見える、という指摘で入れた。
 * 写真は結果カードと同じ PREFECTURE_PHOTO（実際に200が返るもの）を使い回す。
 * 設問の順に、雰囲気の合う土地を並べてある。文字の可読性は上の
 * 白いベール（.qBg::after）が受け持つ。
 */
const QUESTION_BG: number[] = [
  0,  // 興味        … 背景なし。bento のコマ自身が写真や緑の面を持つので、下にも敷くと騒がしい
  21, // 目覚めの景色 … 白川郷
  26, // 予約派か    … 伏見稲荷
  20, // 歩く旅か    … 上高地
  27, // 夜の街か    … 道頓堀
  17, // 静けさか    … 兼六園
  13, // 定番か穴場か … 浅草寺
  22, // 日数        … 三保松原
  10, // 予算        … 草津の湯畑
  2,  // 季節        … 弘前城の桜
  45, // 来日歴      … 高千穂峡
  0,  // 訪問済み    … 背景なし。地図は紙の上にそのまま置く（写真の上だと県境が読めない）
];

/**
 * 興味の問い（bento）。**全部ただの長方形。**
 * L字（clip-path:path()）は一度作ったが「難しく見える」で長方形だけに戻した。
 *
 * コマは2種類を**ごちゃまぜ**に置く（交互でも塊でもなく、不規則に）:
 *  - 写真コマ … 写真の上に磨りガラス（ぼかし＋緑の被膜）。字はその上
 *  - 色コマ   … 写真なし。緑系の淡いグラデーションだけ。**ぼかしは掛けない**
 *
 * - photo: 下に敷く写真（PREFECTURE_PHOTO のコード）。**無いコマは色コマ**
 * - wide: 横長2コマ / tall: 縦長2コマ / big: 2×2の見せ場
 * - tint: 被膜の色。抹茶・若葉・青磁・若菜・千歳緑・柳鼠（g0〜g5）
 * - **並び順もここで決めている。** 4列(PC)でも2列(スマホ)でも dense で
 *   ちょうど埋まる並び（合計32マス＝4×8段＝2×16段）。増減させるときは
 *   両方の列数で欠けが出ないか目で確かめること
 */
const BENTO: {
  id: string;
  /** 下に敷く写真。省略したコマは色コマ（磨りガラスなし） */
  photo?: number;
  wide?: boolean;
  tall?: boolean;
  big?: boolean;
  tint: number;
}[] = [
  { id: 'shrines', photo: 26, wide: true, tint: 5 },   // 伏見稲荷
  { id: 'ramen', tint: 0 },
  { id: 'sake', tint: 3 },
  { id: 'onsen', photo: 10, big: true, tint: 4 },      // 草津の湯畑（見せ場）
  { id: 'cityShopping', photo: 27, tint: 1 },          // 道頓堀
  { id: 'sweets', tint: 2 },
  { id: 'castles', photo: 28, wide: true, tint: 2 },   // 姫路城
  { id: 'nightlife', tall: true, tint: 5 },
  { id: 'crafts', tint: 1 },
  { id: 'wildlife', photo: 36, tint: 0 },              // 祖谷渓
  { id: 'island', photo: 46, tall: true, tint: 3 },    // 桜島
  { id: 'gardens', wide: true, tint: 4 },
  { id: 'beaches', photo: 47, big: true, tint: 2 },    // 川平湾（見せ場）
  { id: 'festivals', photo: 13, wide: true, tint: 3 }, // 浅草
  { id: 'snow', wide: true, tint: 0 },
  { id: 'popCulture', tint: 1 },
  { id: 'mountainHikes', photo: 20, wide: true, tint: 5 }, // 上高地
  { id: 'artMuseums', tint: 4 },
];

const CSS = `
.mjq { --ink:#14120F; --paper:#FBFAF7; --matcha:#69AF00; --shu:#C4432B; --line:#E6E3DA;
  height:var(--vh,100svh); overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;
  background:var(--paper); color:var(--ink);
  font-family:'ZenKakuGothicNew_400Regular','Zen Kaku Gothic New',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
  /* iOSのタップで灰色や緑の残像が出ないように。押した手応えは .on / :active が持つ */
  -webkit-tap-highlight-color:transparent; }
.mjq .mincho { font-family:'ShipporiMincho_700Bold','Shippori Mincho',serif; }
.mjq section { padding:clamp(52px,10vw,104px) 22px; }
.mjq .wrap { max-width:900px; margin:0 auto; }
.mjq .eyebrow { font-size:10px; letter-spacing:5px; color:var(--matcha); }
.mjq h1, .mjq h2, .mjq h3 { margin:0; font-weight:400; }
.mjq .lead { color:#5E5B57; font-size:clamp(14px,3.2vw,16.5px); line-height:1.85; margin-top:14px; max-width:36em; }

/* --- ヒーロー。明るい観光地のモザイクの上に、白いベールと墨の明朝 ---
   （以前は暗い写真の壁＋白文字。入口が暗いという指摘で明るくした） */
.mjq .qHero { position:relative; min-height:var(--vh,100svh); display:flex; align-items:center;
  justify-content:center; overflow:hidden; background:var(--paper); padding:22px; }
.mjq .heroMosaic { position:absolute; inset:0; display:grid;
  grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(2,1fr); gap:3px; }
.mjq .heroMosaic img { width:100%; height:100%; object-fit:cover; filter:saturate(1.08) brightness(1.04);
  animation:mjqKb 26s ease-in-out infinite alternate; }
@keyframes mjqKb { from { transform:scale(1) } to { transform:scale(1.08) } }
@media (max-width:560px) { .mjq .heroMosaic { grid-template-columns:repeat(2,1fr); grid-template-rows:repeat(3,1fr); } }
/* 文字が乗る中央だけ白を強く。縁は写真を見せる */
.mjq .heroVeil { position:absolute; inset:0;
  background:radial-gradient(115% 85% at 50% 46%, rgba(251,250,247,.94) 0%, rgba(251,250,247,.82) 46%, rgba(251,250,247,.38) 100%); }
.mjq .heroInner { position:relative; text-align:center; max-width:720px; }
.mjq .heroBrand { color:#69AF00; font-size:11px; letter-spacing:7px; }
/* 見出しはふわっと入る（下から少し浮き上がりながら現れる）。
   スクロール連動ではなく表示時に1回だけの動きなので、opacity を触っても
   「止まった瞬間に消える」問題は起きない（both で 1 に落ち着く） */
.mjq .heroTitle { color:var(--ink); font-size:clamp(36px,8vw,68px); line-height:1.18; margin-top:16px; white-space:pre-line;
  animation:mjqHeroIn .8s cubic-bezier(.16,.84,.28,1) .12s both; }
@keyframes mjqHeroIn { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
.mjq .heroBy { text-align:right; margin:2px 4% 0 0; color:#8F887A; font-size:11px; letter-spacing:2.5px; }
.mjq .heroLead { color:#4A453C; font-size:clamp(14px,3.4vw,17px); line-height:1.8;
  margin:20px auto 0; max-width:32em; }
.mjq .heroTime { color:#8F887A; font-size:11.5px; letter-spacing:2px; margin-top:26px; }
.mjq .heroSignin { display:inline-block; margin-top:18px; color:#6B6862; font-size:12.5px;
  background:none; border:0; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
.mjq .heroSignin:hover { color:var(--ink); }

/* --- ボタン。光らせない（既存LPと同じ判断） --- */
.mjq .cta { display:inline-flex; align-items:center; justify-content:center; gap:10px; border:0; cursor:pointer;
  background:var(--matcha); color:#fff; padding:16px 34px; border-radius:999px;
  font-size:15px; font-weight:600; font-family:inherit; transition:background .2s, opacity .2s; }
.mjq .cta:hover { background:#5E9C00; }
.mjq .cta:active { opacity:.86; }
.mjq .cta:disabled { opacity:.5; cursor:default; }
.mjq .ctaWide { width:100%; max-width:360px; }

/* --- 質問の段 ---
   min-height はパディング込み(border-box)にする。content-box のままだと
   段の実高が 100svh+パディングになり、justify-content:center の中心が
   画面の中心より下へ沈む（スマホで「中央に来ていない」と指摘された原因）。
   上下のパディングも同じ値にして、真ん中に落ちるようにする。 */
.mjq .qStage { box-sizing:border-box; min-height:var(--vh,100svh); position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:center;
  padding-top:clamp(72px,12vw,110px); padding-bottom:clamp(72px,12vw,110px); }
/* 設問の背景（日本の観光地）。紙の白は上のベールが守る */
.mjq .qBg { position:absolute; inset:0; background-size:cover; background-position:center;
  animation:mjqBgIn .9s ease-out both; }
.mjq .qBg::after { content:''; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(251,250,247,.82) 0%, rgba(251,250,247,.90) 45%, rgba(251,250,247,.97) 100%); }
@keyframes mjqBgIn { from { opacity:0; } to { opacity:1; } }
.mjq .qStage .wrap { position:relative; }
.mjq .bar { position:fixed; top:0; left:0; right:0; height:3px; background:rgba(0,0,0,.06); z-index:5; }
.mjq .barFill { height:100%; background:var(--matcha); transition:width .3s cubic-bezier(.2,.7,.2,1); }
/* 設問が切り替わるときの入場。覆いが引いたあと、**ひと呼吸おいて**
   下からふわっと浮き上がる（即座に出すと事務的に見える、という指摘） */
.mjq .qIn { animation:mjqStep .55s cubic-bezier(.16,.84,.28,1) .22s both; }
@keyframes mjqStep { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }

/* --- 押した所から広がる面（旅を開くときと同じ作り） ---
   lib/transition.tsx と同じ考え方。**薄い輪を散らすのではなく、色の面が
   タップ点から膨らんで画面を覆う。** 覆いきった下で設問を差し替え、
   面が引くのと入れ違いに次の設問が下から入る。
   最初は緑の輪を3重に広げるだけにしていたが、白い紙の上では動きが
   目に入らなかった（「全く分からない」と指摘された）―― 覆う面が要る。

   色は選択肢を選んだときと同じ薄い抹茶(#F4FAEA)。紙(#FBFAF7)と同色では
   広がりが見えず、濃い色では診断の途中で画面が暗転して驚かせる。

   位置は fixed。この面自身がスクロールの器なので、絶対配置だと
   スクロール量ぶんずれる。進捗の帯(z-index:5)より下に置いて、
   覆っている間も残りの問数が見えるようにする。 */
.mjq .splash { position:fixed; z-index:4; width:0; height:0; pointer-events:none; }
.mjq .splash b { position:absolute; left:0; top:0; display:block; border-radius:50%;
  width:var(--d); height:var(--d); margin-left:calc(var(--d) / -2); margin-top:calc(var(--d) / -2);
  background:#F4FAEA; transform:scale(0);
  /* 膨らみは加速（ease-in）、引きは減速（ease-out）。別々の動きなので2本に分ける */
  animation:mjqWipeGrow .26s cubic-bezier(.4,0,1,1) forwards,
            mjqWipeFade .24s cubic-bezier(0,0,.4,1) .3s forwards; }
@keyframes mjqWipeGrow { from { transform:scale(0); } to { transform:scale(1); } }
@keyframes mjqWipeFade { from { opacity:1; } to { opacity:0; } }
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
/* hoverの浮き上がりはマウスにだけ。タッチだと:hoverが張り付いて、
   変形した層が残像になることがある（iOSで実際に緑の欠片が残った） */
@media (hover:hover) { .mjq .opt:hover { border-color:#C9C4B4; transform:translateY(-2px); } }
.mjq .opt.on { border-color:var(--matcha); background:#F4FAEA; }
.mjq .optMark { flex:0 0 auto; width:20px; height:20px; border-radius:50%; border:1px solid #D7D2C4;
  display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; }
.mjq .opt.on .optMark { background:var(--matcha); border-color:var(--matcha); }
/* 自作の絵（components/quiz/QuizIcon）。墨より少し退かせて、字を主役にする */
.mjq .optIcon { flex:0 0 auto; display:flex; align-items:center; color:#4A453C; opacity:.9; }
.mjq .opt.on .optIcon { color:var(--ink); opacity:1; }

/* --- 興味の問いの bento ---
   コマは全部長方形。写真コマ（磨りガラス付き）と色コマ（緑の淡い面だけ）を
   ごちゃまぜに並べる。緑は g0〜g5 でコマごとに変える。選択の合図は
   **枠線の色と、被膜の透明度がわずかに変わること** ―― ✓印は置かない。
   dense で穴を埋めるので、順番どおりでなくても隙間ができない */
.mjq .bento { display:grid; gap:10px; margin-top:28px;
  grid-template-columns:repeat(4,1fr); grid-auto-rows:96px; grid-auto-flow:dense; }
/* コマ本体が唯一の切り抜き枠。写真もガラスも**この中に inset:0 で敷く**。
   角丸と overflow:hidden はここだけに持たせ、中の層は radius:inherit で
   同じ角に沿わせる ―― 写真と被膜が1pxもずれない・にじみが外に漏れない */
.mjq .btile { position:relative; border:0; border-radius:18px; overflow:hidden; cursor:pointer;
  padding:0; font-family:inherit; text-align:left; background:transparent;
  transition:transform .18s, box-shadow .22s; }
@media (hover:hover) { .mjq .btile:hover { transform:translateY(-2px); } }
.mjq .btile.wide { grid-column:span 2; }
.mjq .btile.tall { grid-row:span 2; }
.mjq .btile.big { grid-column:span 2; grid-row:span 2; }
/* 緑の家族。抹茶・若葉・青磁・若菜・千歳緑・柳鼠 */
.mjq .btile.g0 { --bt:hsla(78,55%,86%,.5); --btOn:hsla(78,60%,84%,.72); }
.mjq .btile.g1 { --bt:hsla(105,42%,86%,.5); --btOn:hsla(105,48%,83%,.72); }
.mjq .btile.g2 { --bt:hsla(140,36%,86%,.5); --btOn:hsla(140,42%,82%,.72); }
.mjq .btile.g3 { --bt:hsla(62,50%,87%,.5); --btOn:hsla(62,55%,83%,.72); }
.mjq .btile.g4 { --bt:hsla(160,30%,85%,.5); --btOn:hsla(160,36%,81%,.72); }
.mjq .btile.g5 { --bt:hsla(90,22%,88%,.5); --btOn:hsla(90,28%,84%,.72); }
/* 写真コマ。写真(.ph)を敷き、その上のガラス(::after)が緑の被膜で
   写真を洗って字を立たせる。ぼかしを持つのは写真コマ**だけ**。
   ぼかしは backdrop-filter ではなく**写真自身に filter:blur** を掛ける ――
   backdrop だとコマの縁で外の紙まで混ざり、内側に白い縁取りがにじむ（実測）。
   その分写真を四方へ 14px はみ出させ（inset:-14px）、ぼけて薄くなる端を
   コマの overflow:hidden の外へ追い出す。切り抜きはコマの角丸そのもの
   なので、写真と被膜がずれようがない */
.mjq .btile .ph { position:absolute; inset:-10px;
  background-size:cover; background-position:center;
  filter:blur(1.5px) saturate(1.06); transition:filter .25s; }
/* 被膜はさらに薄く。**まだ濃くて写真が見えない**と二度目の指摘を受けた。
   ぼかし 3px→1.5px、被膜 .5→.32。
   色コマ(.flat)は同じ --bt を濃いまま使うので、ここは色そのものを
   薄めず opacity で下げる ―― そうしないと色コマまで紙が透ける。
   枠線は被膜と分けてコマ自身に持たせる（opacity で薄まらないように） */
.mjq .btile.hasPhoto { box-shadow: inset 0 0 0 1.2px rgba(255,255,255,.4); }
.mjq .btile.hasPhoto::after { content:''; position:absolute; inset:0; border-radius:inherit;
  background:var(--bt); opacity:.32; transition:opacity .25s; }
/* 札の下だけ紙色に沈める帯。被膜を薄くしたぶん、賑やかな写真の上でも
   字が読めるようにする。写真の上半分は覆わないので、絵は見えたまま。
   選んでも消さない ―― 選択で写真が冴えるぶん、字はより守りたい */
.mjq .btile .scrim { position:absolute; left:0; right:0; bottom:0; height:38%;
  border-radius:inherit; pointer-events:none;
  background:linear-gradient(to top, rgba(251,248,240,.88), rgba(251,248,240,.34) 52%, rgba(251,248,240,0)); }
/* 色コマ。写真なし・**ぼかしなし**。同じ緑の家族の淡いグラデーションだけ */
.mjq .btile.flat { background:linear-gradient(160deg, var(--btOn), var(--bt));
  box-shadow: inset 0 0 0 1.2px rgba(255,255,255,.55); }
/* 写真が見えるぶん字の下が賑やかになるので、白い滲みを一段強くする */
.mjq .btLabel { position:absolute; z-index:1; left:14px; right:12px; bottom:12px;
  font-size:13.5px; line-height:1.3; color:var(--ink);
  text-shadow:0 1px 2px rgba(255,255,255,.95), 0 1px 6px rgba(255,255,255,.85), 0 2px 14px rgba(255,255,255,.7); }
/* 選択（✓は出さない）。
   **選んだかどうかが全く分からない**という指摘を受けて作り直した。
   以前は枠線2pxと被膜のわずかな差だけで、写真コマは選ぶほど暗くなる
   （被膜が濃くなる）という逆向きの動きだった。いまは:
     ・選んだ写真コマは**被膜が引いて写真が冴える**（.32 → .10、ぼかしも抜く）
     ・選んだ色コマは**はっきり抹茶に寄る**
     ・どちらも太い抹茶の枠(3px)と抹茶の影が付き、札が太字になる
   色を見分けにくい人にも、太さ・明るさ・字の太さの3つで伝わる */
.mjq .btile.on { transform:translateY(-2px); }
.mjq .btile.on .btLabel { font-weight:700; }
.mjq .btile.hasPhoto.on { box-shadow: inset 0 0 0 3px var(--matcha), 0 10px 24px rgba(105,175,0,.32); }
.mjq .btile.hasPhoto.on::after { opacity:.10; }
.mjq .btile.hasPhoto.on .ph { filter:blur(0px) saturate(1.18); }
.mjq .btile.flat.on { background:linear-gradient(160deg, rgba(105,175,0,.46), rgba(105,175,0,.26));
  box-shadow: inset 0 0 0 3px var(--matcha), 0 10px 24px rgba(105,175,0,.32); }
@media (max-width:560px) {
  .mjq .bento { grid-template-columns:repeat(2,1fr); grid-auto-rows:88px; }
}

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

/* --- 訪問済みの地図 ---
   枠も塗りも持たせない。紙(--paper)の上に地図がそのまま置いてある見え方にする
   （箱に入れると「ボックスに入っていてダサい」―― ユーザー指摘）。 */
.mjq .quizMap { position:relative; margin:20px auto 8px; overflow:hidden;
  touch-action:none; cursor:grab; user-select:none; -webkit-user-select:none; }
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

/* --- 性格の5段階（当てはまる〜当てはまらない） --- */
.mjq .likert { display:flex; align-items:center; justify-content:space-between; gap:6px;
  margin:38px auto 0; max-width:520px; }
.mjq .likert button { flex:0 0 auto; border-radius:50%; background:#fff; cursor:pointer; padding:0;
  border:2px solid #D7D2C4; transition:border-color .15s, background .15s, transform .15s; }
@media (hover:hover) { .mjq .likert button:hover { transform:scale(1.08); } }
/* 端ほど大きい丸。左（当てはまる）は抹茶、右（当てはまらない）は墨 */
.mjq .likert button:nth-child(1) { width:56px; height:56px; border-color:#A5CE63; }
.mjq .likert button:nth-child(2) { width:44px; height:44px; border-color:#C2DC94; }
.mjq .likert button:nth-child(3) { width:32px; height:32px; }
.mjq .likert button:nth-child(4) { width:44px; height:44px; border-color:#B9B3A4; }
.mjq .likert button:nth-child(5) { width:56px; height:56px; border-color:#8F887A; }
.mjq .likert button.on:nth-child(-n+2) { background:var(--matcha); border-color:var(--matcha); }
.mjq .likert button.on:nth-child(3) { background:#B9B3A4; border-color:#B9B3A4; }
.mjq .likert button.on:nth-child(n+4) { background:#5E5B57; border-color:#5E5B57; }
.mjq .likertEnds { display:flex; justify-content:space-between; margin:10px auto 0; max-width:520px;
  font-size:12px; }
.mjq .likertEnds span:first-child { color:var(--matcha); }
.mjq .likertEnds span:last-child { color:#8F887A; }

/* --- 結果 --- */
.mjq .qResult { background:linear-gradient(180deg,#FBFAF7 0%,#F4F1E8 100%); }
.mjq .rHead { font-size:clamp(23px,5vw,38px); line-height:1.4; margin-top:12px; }
/* 「◯◯県」だけ抹茶色で一回り大きく（ユーザー指定） */
.mjq .rHead .prefBig { color:var(--matcha); font-size:1.35em; font-weight:700; padding:0 .06em; }

/* カバーフロー。中央のカードが前に出て、両脇は奥へ沈む */
.mjq .flowWrap { margin:26px -22px 0; overflow:hidden; }
.mjq .flow { position:relative; perspective:1000px; touch-action:pan-y; user-select:none; -webkit-user-select:none; }
.mjq .flowCard { position:absolute; top:0; left:50%; padding:0; text-align:left; cursor:pointer;
  background:#fff; border:1px solid #ECEAE3; border-radius:16px; overflow:hidden; font-family:inherit;
  box-shadow:0 18px 40px rgba(20,18,15,.12);
  transition:transform .45s cubic-bezier(.2,.7,.2,1), filter .45s, opacity .45s; }
/* 脇のカードは彩度と明るさを落とす。「アクティブなカードだけ色が濃い」見せ方 */
.mjq .flowCard:not(.on) { filter:saturate(.35) brightness(.92); opacity:.55; }
.mjq .flowImg { position:relative; aspect-ratio:16/10; overflow:hidden; background:#EEEBE2; }
.mjq .flowImg img { width:100%; height:100%; object-fit:cover; display:block; }
.mjq .flowImg .place { position:absolute; left:0; right:0; bottom:0; padding:20px 12px 8px; color:#fff;
  font-size:10px; letter-spacing:1.4px; background:linear-gradient(180deg,transparent,rgba(0,0,0,.6)); }
.mjq .rank { position:absolute; top:10px; left:10px; background:rgba(255,255,255,.9); color:#3A3427;
  font-size:10px; letter-spacing:2px; padding:4px 9px; border-radius:999px; }
.mjq .flowBody { padding:12px 14px 16px; }
.mjq .flowName { font-size:19px; line-height:1.3; color:var(--ink); }
.mjq .flowCard.on .flowName { color:var(--matcha); }
.mjq .flowEn { font-size:9.5px; letter-spacing:3px; color:#9B978F; margin-top:4px; }
/* 英語表示のときの添え書き（漢字の県名）。ローマ字ほど字間を空けない */
.mjq .flowJa { font-size:11px; letter-spacing:1px; color:#9B978F; margin-top:4px; }

/* --- 結果を出す前のため（judging） --- */
.mjq .judgeWrap { box-sizing:border-box; min-height:var(--vh,100svh); display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:24px; }
.mjq .judgeSpin { width:46px; height:46px; border-radius:50%;
  border:3px solid var(--line); border-top-color:var(--matcha);
  animation:mjqSpin .8s linear infinite; }
@keyframes mjqSpin { to { transform:rotate(360deg); } }
.mjq .judgeText { color:#6B6862; font-size:14px; letter-spacing:.5px;
  animation:mjqPulse 1.6s ease-in-out infinite; }
@keyframes mjqPulse { 0%,100% { opacity:.55; } 50% { opacity:1; } }
.mjq .flowDots { display:flex; justify-content:center; gap:8px; margin-top:16px; }
.mjq .flowDots button { width:8px; height:8px; border-radius:50%; border:0; padding:0; cursor:pointer;
  background:#D7D2C4; transition:background .2s, transform .2s; }
.mjq .flowDots button.on { background:var(--matcha); transform:scale(1.25); }
.mjq .swipeHint { text-align:center; font-size:11px; letter-spacing:1px; color:#9B978F; margin-top:8px; }

/* アクティブな県の中身（紹介文と「行くなら」） */
.mjq .detail { margin-top:28px; animation:mjqIn .35s ease-out; }
@keyframes mjqIn { from { transform:translateY(8px); } to { transform:none; } }
.mjq .why { color:#5E5B57; font-size:14.5px; line-height:2.0; margin-top:10px; }
.mjq .spots { margin-top:22px; }
.mjq .spotsTitle { font-size:10px; letter-spacing:3px; color:#9B978F; }
.mjq .spot { display:flex; align-items:baseline; gap:10px; padding:10px 0; border-bottom:1px solid var(--line);
  color:inherit; text-decoration:none; }
.mjq .spot:last-child { border-bottom:0; }
.mjq .spot b { font-size:14px; font-weight:500; }
.mjq .spot span { font-size:11.5px; color:#9B978F; }
.mjq .spot em { margin-left:auto; font-style:normal; font-size:10px; letter-spacing:1.5px; color:var(--matcha);
  white-space:nowrap; }

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

/* --- 「Keep your footprint」の中央モーダル ---
   3枚目のカードまで見た＝結果を見終わった人にだけ、保存への導線を1回出す。
   中身は下の save セクションと同じ暗い紙＋日本地図。 */
.mjq .keepVeil { position:fixed; inset:0; z-index:50; background:rgba(12,10,8,.62);
  display:flex; align-items:center; justify-content:center; padding:22px;
  animation:mjqFade .25s ease-out both; }
@keyframes mjqFade { from { opacity:0; } to { opacity:1; } }
.mjq .keepCard { position:relative; width:100%; max-width:360px; background:var(--ink); color:#fff;
  border-radius:20px; padding:32px 24px 26px; text-align:center;
  box-shadow:0 24px 70px rgba(0,0,0,.42); animation:mjqPop .35s cubic-bezier(.2,.7,.2,1) both; }
@keyframes mjqPop { from { opacity:0; transform:translateY(18px) scale(.95); } to { opacity:1; transform:none; } }
.mjq .keepCard h3 { font-size:22px; margin-top:10px; }
.mjq .keepMap { display:flex; justify-content:center; margin:18px 0 8px; }
.mjq .keepCount { font-size:12.5px; color:rgba(255,255,255,.7); }
.mjq .keepCount b { font-size:20px; color:#8FC93A; font-family:'ShipporiMincho_700Bold',serif; }
.mjq .keepCard .cta { width:100%; margin-top:18px; }
.mjq .keepClose { position:absolute; top:10px; right:10px; width:34px; height:34px; padding:0;
  border:0; border-radius:50%; background:rgba(255,255,255,.12); color:rgba(255,255,255,.85);
  font-size:15px; line-height:1; cursor:pointer; }
.mjq .keepClose:hover { background:rgba(255,255,255,.2); }

@media (max-width:560px) {
  .mjq .opts { grid-template-columns:1fr; }
  .mjq section { padding-top:clamp(40px,9vw,64px); }
}
@media (prefers-reduced-motion: reduce) {
  .mjq .heroGrid img { animation:none; }
  .mjq .opt:hover, .mjq .likert button:hover { transform:none; }
  .mjq .flowCard { transition:none; }
  .mjq .detail, .mjq .qIn, .mjq .keepVeil, .mjq .keepCard, .mjq .heroTitle { animation:none; }
  .mjq .splash { display:none; }
}
`;

/**
 * ヒーローの写真。
 * 富士山と海が1枚に入っていて、どこの国の話かが一目で分かる。
 * 47件の中でいちばん軽い（約110KB）のもここに置いた理由。
 */
/**
 * ヒーローの背景。**明るい観光地を数枚並べたモザイク**にする。
 * 以前は三保松原1枚に暗いベールを重ねていて、入口が暗かった（指摘を受けた）。
 * 写真は設問の背景（QUESTION_BG）とも bento とも**かぶらせない**:
 * 富良野のラベンダー・ひたち海浜公園のネモフィラ・夫婦岩・祐徳稲荷・
 * 栗林公園・由布院
 */
const HERO_MOSAIC = [1, 8, 24, 41, 37, 44]
  .map((c) => photoFor(c))
  .filter((p): p is NonNullable<ReturnType<typeof photoFor>> => !!p);

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

type Stage = 'hero' | 'quiz' | 'judging' | 'result';

/** 結果を見せる前にためる時間。答えた直後に出ると軽く見える（ユーザー指摘） */
const JUDGING_MS = 1800;

/**
 * 覆いの円が画面を覆いきる直径。
 * タップ点からいちばん遠い角までの距離を半径にする（lib/transition.tsx と同じ）。
 */
function coverDiameter(x: number, y: number): number {
  if (typeof window === 'undefined') return 2000;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return (Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 40) * 2;
}

export function QuizLanding() {
  const { t, locale } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<Stage>('hero');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Recommendation[]>([]);
  /** カバーフローで前に出ているカード。見出し・紹介文・「行くなら」はこの県のもの */
  const [active, setActive] = useState(0);
  const [spots, setSpots] = useState<Record<number, TourismArea[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 体験の枠を数えた県。同じ県を二重に数えないための目印 */
  const affSeen = useRef<Set<number>>(new Set());
  /**
   * 押した所から広がる水面。座標と、毎回作り直すための番号を持つ。
   * 番号を key にして要素を作り直さないと、2問目以降でCSSの動きが走らない。
   */
  const [splash, setSplash] = useState<{ x: number; y: number; n: number } | null>(null);
  const splashN = useRef(0);
  /** 「Keep your footprint」モーダル。最後のカードまで見た人に1回だけ出す */
  const [keepOpen, setKeepOpen] = useState(false);
  const keepShown = useRef(false);
  const saveRef = useRef<HTMLElement | null>(null);

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

  /**
   * 押した点から面を広げる。
   * **覆いきってから設問を差し替える。** 早すぎると差し替えが見えてしまい、
   * 遅すぎると覆いが引いたあとに古い設問が残って見える。
   * 覆い(.26s) → 差し替え(.28s) → 引き(.3s〜.54s) の順で、全体 約0.55秒。
   */
  const RIPPLE_MS = 280;
  const ripple = (e?: { clientX: number; clientY: number }) => {
    if (!e) return;
    splashN.current += 1;
    setSplash({ x: e.clientX, y: e.clientY, n: splashN.current });
    // 動きが終わったら片付ける（残しておくと次の面と重なる）
    window.setTimeout(() => setSplash(null), 580);
  };

  const choose = (optId: string, e?: { clientX: number; clientY: number }) => {
    if (!q) return;
    // 5段階(scale)も「1つ選べば次へ」は single と同じ
    if (q.kind === 'single' || q.kind === 'scale') {
      setAnswers((a) => ({ ...a, [q.id]: [optId] }));
      funnel.answer(q.id, step, total, optId);
      ripple(e);
      window.setTimeout(() => advance({ ...answers, [q.id]: [optId] }), RIPPLE_MS);
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
    // single/scale は選んだ時点で数えてある。それ以外はここで（最後の問いも取りこぼさない）
    if (q && q.kind !== 'single' && q.kind !== 'scale') {
      const value = q.kind === 'prefectures' ? String(visited.size) : (a[q.id] ?? []).join('|');
      funnel.answer(q.id, step, total, value);
    }
    // skipIf が真の問いは素通りする（初来日の人に訪問済みを聞かない、など）
    let next = step + 1;
    while (next < total && QUESTIONS[next].skipIf?.(a)) next += 1;
    if (next < total) {
      setStep(next);
      return;
    }
    finish(a);
  };

  /** 戻るときも skipIf の問いは素通りする（行きに出なかった問いを帰りに出さない） */
  const goBack = () => {
    let prev = step - 1;
    while (prev >= 0 && QUESTIONS[prev].skipIf?.(answers)) prev -= 1;
    if (prev < 0) setStage('hero');
    else setStep(prev);
  };

  /**
   * 画面に出す訪問済みの県。
   * 「初めての来日」と答えた人に訪問済みは無い。地図の問いは飛ばしているが、
   * 「経験あり」で県を選んだあと戻って「初めて」に変えると選択が残るので、
   * 出すときにも空にする ―― 最後の登録の画面の日本地図が、答えと食い違って
   * 光ったままになる。結果の計算（finish）と同じ扱いに揃えている
   */
  const shownVisited = useMemo(
    () => ((answers.experience ?? [])[0] === 'first' ? new Set<number>() : visited),
    [answers.experience, visited]
  );

  const finish = (a: Answers = answers) => {
    /**
     * 初来日の人に訪問済みは無い。地図の問いは飛ばしているが、
     * 「経験あり」で county を選んだあと戻って「初めて」に変えた場合に
     * 古い選択が残るので、ここでも空にする（結果から除外させない）。
     */
    const codes = (a.experience ?? [])[0] === 'first' ? [] : Array.from(visited);
    funnel.complete(codes.length);
    const list = recommend(a, codes, 3);
    setResults(list);
    setActive(0);
    // 計算は一瞬で終わるが、すぐ出すと占いの軽さになる。少しためてから開く
    setStage('judging');
    window.setTimeout(() => setStage('result'), JUDGING_MS);
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
   *
   * **訪問済みの県も消す。** 以前は「答えではなく事実だから」と残していたが、
   * 前回「経験あり」で選んだ県が残ったまま今回「初めての来日」と答えると、
   * 最後の登録の画面の日本地図にその県が光ったまま出る（実際に起きた）。
   * 初来日の人に訪問済みは無いので、画面が答えと食い違う。
   *
   * localStorage の預かりも一緒に消す。あれは前回の結果を持っており、
   * 消さないまま登録すると、選び直したはずの県がアカウントに入る。
   */
  const retake = () => {
    setAnswers({});
    setResults([]);
    setActive(0);
    setSpots({});
    setVisited(new Set());
    clearHandoff();
    affSeen.current = new Set();
    keepShown.current = false;
    setKeepOpen(false);
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

  /** いま前に出ているカードの県。見出し・紹介文・「行くなら」はこの県で組む */
  const current = results[active] ?? results[0] ?? null;
  // 紹介文はDB（prefecture_texts）から。無ければ手元の文にさがる
  const currentText = usePrefectureText(current?.code ?? 1, locale as Locale);

  /**
   * 「行くなら」の一覧に混ぜる GetYourGuide の枠（1〜2件）。
   * 提携先はGYGだけに絞った ―― 独立した「体験」セクションは置かない
   * （枠が多いほど良いわけではない、というユーザー判断）。
   */
  const gygLinks: AffiliateCard[] = useMemo(
    () =>
      current
        ? affiliatesFor(current.code, PREFECTURE_EN_BY_ID[current.code] ?? '', locale as Locale)
            .filter((a) => a.providerId === 'getyourguide')
            .slice(0, 2)
        : [],
    [current, locale]
  );

  /**
   * 体験の枠が出たことを県ごとに1回だけ数える。
   * IntersectionObserver は描画されていないと発火しないので使わない
   * （結果を出した時点で画面に入っている作りにしてある）。
   */
  useEffect(() => {
    if (stage !== 'result' || !current || !gygLinks.length) return;
    if (affSeen.current.has(current.code)) return;
    affSeen.current.add(current.code);
    funnel.affiliateImpression(
      current.code,
      PREFECTURE_EN_BY_ID[current.code] ?? '',
      gygLinks.map((a) => a.providerId)
    );
  }, [stage, current, gygLinks]);

  /**
   * 最後のカードまで送った＝結果を見終わった合図。少し置いてモーダルを出す。
   * 出すのは結果1回につき1度だけ（カードを行き来しても再表示しない）。
   */
  useEffect(() => {
    if (stage !== 'result') return;
    if (results.length < 2 || active !== results.length - 1 || keepShown.current) return;
    keepShown.current = true;
    const id = window.setTimeout(() => setKeepOpen(true), 550);
    return () => window.clearTimeout(id);
  }, [stage, active, results.length]);

  /** モーダルの「Keep your footprint」。閉じて save セクションへ滑らかに送る */
  const goKeep = () => {
    setKeepOpen(false);
    try {
      saveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  };

  // --- 登録 ------------------------------------------------------------
  const handoff = () => saveHandoff(Array.from(shownVisited), results.map((r) => r.code));

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

  const signIn = () => {
    // ログインする人も、選んだ県は持って行く（既存の地図に足される）
    handoff();
    router.push('/(auth)/login');
  };

  // --- 文の組み立て ----------------------------------------------------
  /**
   * 見出しの「◯◯県」だけ色と大きさを変えるため、訳文を県名の前後で割る。
   * 訳文側は {name} のまま保ち、ここで番兵文字に置換して切る
   * （言語ごとに語順が違うので、前後どちらに県名が来ても崩れない）。
   */
  const headlineParts = (): [string, string] => {
    const SENTINEL = '\u0000';
    const s = t('quiz.result.headline1', { name: SENTINEL });
    const i = s.indexOf(SENTINEL);
    if (i < 0) return [s, ''];
    return [s.slice(0, i), s.slice(i + 1)];
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
  // PCでは340pxだと余白の海に浮いて小さく見えた。枠を外したのと合わせて520pxまで広げる
  const mapW = Math.max(240, Math.min(520, vw - 44));
  const mapH = Math.round((mapW * contentHeight()) / 860);
  // カバーフローのカード。脇のカードの端が見える幅にする
  const cardW = Math.max(200, Math.min(320, Math.round(vw * 0.62)));
  const flowH = Math.round((cardW * 10) / 16) + 78;

  return (
    <div className="mjq" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ============================================================ ヒーロー */}
      {stage === 'hero' && (
        <section className="qHero">
          {HERO_MOSAIC.length > 0 && (
            <div className="heroMosaic" aria-hidden>
              {HERO_MOSAIC.map((p, i) => (
                <img key={p.url} src={p.url} alt="" fetchPriority={i < 3 ? 'high' : undefined} />
              ))}
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
            {/* 設問ごとの背景（日本の観光地）。key で問いごとに焚き直す。
                QUESTION_BG が 0 の設問（bento と訪問済みの地図）は紙のまま */}
            {!!QUESTION_BG[step] && PREFECTURE_PHOTO[QUESTION_BG[step]] && (
              <div
                className="qBg"
                key={`bg${step}`}
                style={{ backgroundImage: `url(${PREFECTURE_PHOTO[QUESTION_BG[step]].url})` }}
              />
            )}
            {/* key=step で問いごとに作り直し、入場の動き(qIn)を毎回走らせる */}
            <div className="wrap qIn" key={step}>
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
              ) : q.kind === 'scale' ? (
                <>
                  {/* 端ほど大きい5つの丸。左が「当てはまる」、右が「当てはまらない」 */}
                  <div className="likert">
                    {(q.options ?? []).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={picked.includes(o.id) ? 'on' : ''}
                        aria-label={t(o.labelKey)}
                        aria-pressed={picked.includes(o.id)}
                        onClick={(e) => choose(o.id, e)}
                      />
                    ))}
                  </div>
                  <div className="likertEnds">
                    <span>{t('quiz.scale.agree2')}</span>
                    <span>{t('quiz.scale.disagree2')}</span>
                  </div>
                </>
              ) : (
                q.id === 'interest' ? (
                  /* 興味の問いは bento。並び・形・写真・色は BENTO が決める */
                  <div className="bento">
                    {BENTO.map((cfg) => {
                      const o = (q.options ?? []).find((x) => x.id === cfg.id);
                      if (!o) return null;
                      const on = picked.includes(o.id);
                      const photo = cfg.photo != null ? PREFECTURE_PHOTO[cfg.photo] : null;
                      const cls = [
                        'btile',
                        photo ? 'hasPhoto' : 'flat',
                        cfg.big ? 'big' : cfg.wide ? 'wide' : cfg.tall ? 'tall' : '',
                        `g${cfg.tint}`,
                        on ? 'on' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <button
                          key={o.id}
                          type="button"
                          className={cls}
                          onClick={(e) => choose(o.id, e)}
                          aria-pressed={on}
                        >
                          {/* 写真はコマの中に敷く（コマ自身の角丸と overflow:hidden で切られる） */}
                          {!!photo && (
                            <>
                              <span className="ph" aria-hidden style={{ backgroundImage: `url(${photo.url})` }} />
                              {/* 札の下だけ紙色に沈める帯。写真より後に置く
                                  （::before だと写真の下に隠れて効かなかった） */}
                              <span className="scrim" aria-hidden />
                            </>
                          )}
                          <span className="btLabel">{t(o.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                <div className="opts">
                  {(q.options ?? []).map((o) => {
                    const on = picked.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`opt${on ? ' on' : ''}`}
                        onClick={(e) => choose(o.id, e)}
                        aria-pressed={on}
                      >
                        <span className="optMark">{on ? '✓' : ''}</span>
                        {hasQuizIcon(o.id) && (
                          <span className="optIcon">
                            <QuizIcon id={o.id} />
                          </span>
                        )}
                        <span>{t(o.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
                )
              )}

              <div className="qNav">
                <button type="button" className="ghost" onClick={goBack}>
                  ← {t('quiz.back')}
                </button>
                {q.kind !== 'single' && q.kind !== 'scale' && (
                  <button
                    type="button"
                    className="cta"
                    disabled={!canGo}
                    onClick={(e) => {
                      // 複数選択・スライダー・地図も「次へ」を押した点から波紋を出す
                      ripple(e);
                      window.setTimeout(() => advance(), RIPPLE_MS);
                    }}
                  >
                    {step + 1 === total ? t('quiz.seeResult') : t('quiz.next')} →
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============================================================ ため */}
      {stage === 'judging' && (
        <section className="judgeWrap">
          <div className="judgeSpin" aria-hidden />
          <p className="judgeText">{t('quiz.judging')}</p>
        </section>
      )}

      {/* ============================================================ 結果 */}
      {stage === 'result' && (
        <>
          <section className="qResult">
            <div className="wrap">
              <div className="eyebrow">{t('quiz.result.eyebrow')}</div>
              <h2 className="rHead mincho">
                {/* 47県すべて行っている人には勧める先が無い。地図の保存へ回す */}
                {!current ? (
                  t('quiz.result.none')
                ) : (
                  // 「◯◯県」だけ抹茶色で大きく。前に出ているカードの県に追随する
                  <>
                    {headlineParts()[0]}
                    <span className="prefBig">{prefectureName(current.code, locale)}</span>
                    {headlineParts()[1]}
                  </>
                )}
              </h2>

              {/* カバーフロー。前に出ているカードだけ色が濃い */}
              {!!results.length && (
                <>
                  <ResultFlow
                    results={results}
                    active={active}
                    onActive={setActive}
                    cardW={cardW}
                    height={flowH}
                    locale={locale}
                  />
                  {results.length > 1 && (
                    <>
                      <div className="flowDots">
                        {results.map((r, i) => (
                          <button
                            key={r.code}
                            type="button"
                            className={i === active ? 'on' : ''}
                            aria-label={prefectureName(r.code, locale)}
                            onClick={() => setActive(i)}
                          />
                        ))}
                      </div>
                      <div className="swipeHint">{t('quiz.result.swipeHint')}</div>
                    </>
                  )}
                </>
              )}

              {/* 前に出ている県の紹介と「行くなら」。カードを送ると差し替わる */}
              {current && (
                <div className="detail" key={current.code}>
                  <p className="why">{currentText}</p>

                  <div className="spots">
                    <div className="spotsTitle">
                      {t('quiz.result.spots', { name: prefectureName(current.code, locale) })}
                    </div>
                    {(() => {
                      const en = PREFECTURE_EN_BY_ID[current.code] ?? '';
                      const areas = spots[current.code] ?? [];
                      const prefMatcha = localizeMatchaUrl(prefectureMatchaUrl(current.code));
                      return (
                        <>
                          {/*
                            観光エリアが1件も無い県（秋田・福井・滋賀）でも、県単位の
                            MATCHAの一覧は必ず出せる。「準備中」で終わらせない。
                          */}
                          {!areas.length && !!prefMatcha && (
                            <a
                              className="spot"
                              href={prefMatcha}
                              target="_blank"
                              rel="noopener"
                              onClick={() => funnel.matchaClick(current.code, en, en)}
                            >
                              <b>{t('quiz.aff.matchaTitle', { name: prefectureName(current.code, locale) })}</b>
                              <em>MATCHA →</em>
                            </a>
                          )}
                          {areas.map((a) => {
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
                                onClick={() => funnel.matchaClick(current.code, en, a.name)}
                              >
                                {inner}
                              </a>
                            ) : (
                              <div className="spot" key={a.id}>{inner}</div>
                            );
                          })}
                          {/* MATCHAの記事に続けて、GetYourGuideの枠を1〜2件だけ混ぜる */}
                          {gygLinks.map((a) => (
                            <a
                              key={a.key}
                              className="spot"
                              href={a.url}
                              target="_blank"
                              rel="noopener sponsored"
                              onClick={() =>
                                funnel.affiliateClick(current.code, en, a.providerId, a.title, a.isSearch)
                              }
                            >
                              <b>
                                {a.isSearch
                                  ? t('quiz.aff.gyg', { name: prefectureName(current.code, locale) })
                                  : a.title}
                              </b>
                              {!!a.priceFrom && (
                                <span>{t('quiz.aff.from', { price: a.priceFrom.toLocaleString() })}</span>
                              )}
                              <em>{a.providerName} →</em>
                            </a>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------ 登録 */}
          <section className="save" ref={saveRef}>
            <div className="wrap">
              <div className="eyebrow">{t('quiz.cta.eyebrow')}</div>
              <h2 className="mincho">{t('quiz.cta.title')}</h2>
              <p className="lead">
                {shownVisited.size ? t('quiz.cta.lead', { n: shownVisited.size }) : t('quiz.cta.leadEmpty')}
              </p>

              <div className="saveMap">
                <JapanSvgMap
                  visited={shownVisited}
                  width={Math.min(mapW, 300)}
                  okinawaInset
                  emptyFill="#3A362E"
                  strokeFill="#5C564A"
                  tint="#8FC93A"
                />
              </div>
              <div className="saveCount">
                <b>{shownVisited.size}</b> / 47
              </div>

              <div className="authBtns">
                {/* ボタンは1つに絞る（中身はGoogleでの登録）。メールの経路は置かない */}
                <button type="button" className="oauth" disabled={busy} onClick={signUpGoogle}>
                  {t('quiz.cta.keep')}
                </button>
                {APPLE_ENABLED && (
                  <button type="button" className="oauth" disabled={busy} onClick={signUpApple}>
                    {t('quiz.cta.apple')}
                  </button>
                )}
              </div>
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

      {/*
        押した所から広がる面。
        画面のどこを押されても四隅まで届くよう、いちばん遠い角までの距離から
        直径を出す（決め打ちの倍率だと、隅を押したときに覆いきれない）。
      */}
      {!!splash && (
        <div
          className="splash"
          key={splash.n}
          aria-hidden
          style={
            {
              left: splash.x,
              top: splash.y,
              '--d': `${Math.round(coverDiameter(splash.x, splash.y))}px`,
            } as React.CSSProperties
          }
        >
          <b />
        </div>
      )}

      {/* ============================================ Keep your footprint モーダル */}
      {keepOpen && (
        <div className="keepVeil" onClick={() => setKeepOpen(false)}>
          <div className="keepCard" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="keepClose" aria-label="Close" onClick={() => setKeepOpen(false)}>
              ✕
            </button>
            <div className="eyebrow">{t('quiz.cta.eyebrow')}</div>
            <h3 className="mincho">{t('quiz.cta.title')}</h3>
            <div className="keepMap">
              <JapanSvgMap
                visited={shownVisited}
                width={190}
                okinawaInset
                emptyFill="#3A362E"
                strokeFill="#5C564A"
                tint="#8FC93A"
              />
            </div>
            <div className="keepCount">
              <b>{shownVisited.size}</b> / 47
            </div>
            <button type="button" className="cta" onClick={goKeep}>
              {t('quiz.cta.keep')} →
            </button>
          </div>
        </div>
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

/**
 * 結果のカバーフロー。カードを横に並べ、前に出ている1枚だけ原色で見せる。
 * ライブラリは足さない ―― translate+scale+rotateY を切り替えるだけ。
 * スワイプは pointerdown/up の移動量で判定し、スワイプ直後の click は
 * 握りつぶす（離した指がカードの選択に化けるのを防ぐ。ZoomPanと同じ手）。
 */
function ResultFlow({
  results,
  active,
  onActive,
  cardW,
  height,
  locale,
}: {
  results: Recommendation[];
  active: number;
  onActive: (i: number) => void;
  cardW: number;
  height: number;
  locale: string;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const step = (dir: number) => onActive(Math.max(0, Math.min(results.length - 1, active + dir)));

  return (
    <div className="flowWrap">
      <div
        className="flow"
        style={{ height }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = drag.current;
          drag.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
            swiped.current = true;
            step(dx < 0 ? 1 : -1);
          }
        }}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.stopPropagation();
            e.preventDefault();
            swiped.current = false;
          }
        }}
      >
        {results.map((r, i) => {
          const d = i - active;
          const name = prefectureName(r.code, locale);
          const photo = photoFor(r.code);
          return (
            <button
              key={r.code}
              type="button"
              className={`flowCard${d === 0 ? ' on' : ''}`}
              style={{
                width: cardW,
                transform:
                  `translateX(-50%) translateX(${d * Math.round(cardW * 0.72)}px)` +
                  ` scale(${d === 0 ? 1 : 0.82}) rotateY(${d * -14}deg)`,
                zIndex: 10 - Math.abs(d),
              }}
              aria-pressed={d === 0}
              onClick={() => onActive(i)}
            >
              {!!photo && (
                <div className="flowImg">
                  <img src={photo.url} alt={name} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
                  <div className="rank">{`0${i + 1}`}</div>
                  <div className="place">{photo.title}</div>
                </div>
              )}
              <div className="flowBody">
                <div className="flowName mincho">{name}</div>
                {/*
                  小さい方の行。英語表示では大きい方が既に英語なので、
                  同じ字を二度並べず（Kagoshima / KAGOSHIMA になっていた）、
                  漢字の県名を添える。他言語では従来どおりローマ字
                */}
                <div className={locale === 'en' ? 'flowJa' : 'flowEn'}>
                  {locale === 'en'
                    ? PREFECTURE_JA_BY_ID[r.code] ?? ''
                    : (PREFECTURE_EN_BY_ID[r.code] ?? '').toUpperCase()}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
