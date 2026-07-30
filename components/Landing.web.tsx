/**
 * ランディングページ（Web）。
 *
 * RNのコンポーネントではなく実DOM＋CSSで書いている。理由は、
 * スクロール連動の演出（IntersectionObserverでの出現、パララックス、
 * 無限マーキー、Ken Burns）がCSSの方が圧倒的に軽く滑らかなため。
 * 言語はブラウザ設定から自動判定するので、切替UIは置かない。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { LP_PHOTOS } from '@/lib/lpPhotos';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { contentHeight } from '@/lib/ugc/geo';
import { PENDING_PREFECTURES_KEY } from '@/lib/pendingPrefectures';
import { TripMap } from '@/components/map/TripMap';
import { LP_DEMO_STEPS, LP_DEMO_TRIP } from '@/lib/lpDemo';
import { planBook } from '@/lib/photobook/plan';
import { renderPage, PAGE_SIZE } from '@/lib/photobook/render';
import { BookPreview } from '@/components/BookPreview';
import { useI18n } from '@/lib/i18n';

const CSS = `
/* シェルが 100dvh 固定なので、LP自身をスクロール領域にする */
.lp { --ink:#14120F; --paper:#FBFAF7; --matcha:#69AF00; --shu:#C4432B; --gold:#C9A227; --slant:6vw;
  height:100svh; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;
  background:var(--paper); color:var(--ink);
  font-family:'ZenKakuGothicNew_400Regular','Zen Kaku Gothic New',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; }
.lp .mincho { font-family:'ShipporiMincho_700Bold','Shippori Mincho',serif; }
.lp .brush  { font-family:'YujiSyuku_400Regular',serif; }

/* --- 出現 ---------------------------------------------------------
   **JSで出し入れしない。** 以前はスクロール位置を見て .in を付ける方式で、
   その判定が一度でも走らないと本文も画像も透明のまま残った（実際に
   15要素中14個が消えたページが本番に出ていた）。
   いまは既定で見えていて、ヒーローだけ読み込み時にCSSでふわりと出す。
   演出が動かなくても、中身は必ず見える。 */
/* 動かすのは位置だけ。opacity には触れない。
   透明にした瞬間、演出が止まったときに文字が消えるため。 */
.lp .rv { opacity:1; transform:none; }
.lp .hero .rv { animation:riseIn .9s cubic-bezier(.2,.7,.2,1) both; }
.lp .hero .rv.d1{animation-delay:.10s}.lp .hero .rv.d2{animation-delay:.20s}
.lp .hero .rv.d3{animation-delay:.30s}
@keyframes riseIn { from { transform:translateY(22px) } to { transform:none } }

/* --- 御朱印帳 ↔ ジャーナル --------------------------------
   このふたつは対になっている（集めるもの / 編むもの）。
   境目を斜めに切って、対比であることを形でも見せる。 */
.lp section.journal { margin-top:calc(-1 * var(--slant));
  clip-path:polygon(0 var(--slant),100% 0,100% 100%,0 100%);
  padding-top:calc(clamp(72px,13vw,140px) + var(--slant)); }

/* --- 都道府県の問いかけ --- */
.lp section.quiz { text-align:center; background:var(--paper); }
.lp section.quiz .lead { margin-left:auto; margin-right:auto; }
.lp .quizMap { display:flex; justify-content:center; margin:14px 0 8px; }
.lp .quizCount { margin:0; font-size:13px; color:#6B6862; }

/* --- 都道府県の中央モーダル --- */
.lp .quizBack { position:fixed; inset:0; z-index:60; display:flex; align-items:center; justify-content:center;
  padding:18px; background:rgba(12,12,10,.58); backdrop-filter:blur(3px); animation:quizFade .28s ease both; }
.lp .quizSheet { position:relative; width:100%; max-width:500px; max-height:92svh; overflow-y:auto;
  background:var(--paper); color:var(--ink); border-radius:20px; padding:20px 18px 20px; text-align:center;
  box-shadow:0 24px 70px rgba(0,0,0,.34); animation:quizUp .34s cubic-bezier(.2,.7,.2,1) both; }
.lp .quizSheet h3 { margin:8px 0 0; font-size:clamp(17px,4.4vw,21px); line-height:1.35; }
.lp .quizClose { position:absolute; top:10px; right:12px; border:0; background:transparent; cursor:pointer;
  font-size:26px; line-height:1; color:#9B978F; padding:4px 8px; }
.lp .quizClose:hover { color:var(--ink); }
@keyframes quizFade { from { opacity:0 } to { opacity:1 } }
@keyframes quizUp { from { opacity:0; transform:translateY(18px) scale(.97) } to { opacity:1; transform:none } }

/* --- ヒーロー --- */
.lp .hero { position:relative; min-height:100svh; display:flex; align-items:center;
  justify-content:center; overflow:hidden; background:#0B0F0A; }
.lp .heroGrid { position:absolute; inset:-8%; display:grid; gap:6px;
  grid-template-columns:repeat(4,1fr); grid-auto-rows:1fr; transform:rotate(-8deg) scale(1.25); }
.lp .heroGrid img { width:100%; height:100%; object-fit:cover; opacity:0; filter:saturate(1.05);
  animation:fadeIn 1.4s ease forwards, kb 24s ease-in-out infinite alternate; }
@keyframes fadeIn { to { opacity:.62 } }
@keyframes kb { from { transform:scale(1) } to { transform:scale(1.14) } }
.lp .heroVeil { position:absolute; inset:0;
  background:radial-gradient(120% 80% at 50% 40%, rgba(8,12,8,.30) 0%, rgba(8,12,8,.78) 55%, rgba(8,12,8,.94) 100%); }
.lp .heroInner { position:relative; text-align:center; padding:0 22px; max-width:760px; }
.lp .heroKicker { color:rgba(255,255,255,.72); font-size:11px; letter-spacing:7px; }
.lp .heroTitle { color:#fff; font-size:clamp(38px,8.4vw,74px); line-height:1.18; margin:14px 0 0; white-space:pre-line; }
.lp .heroSub { color:rgba(255,255,255,.86); font-size:clamp(14px,3.4vw,18px); line-height:1.75; margin:20px auto 0; max-width:34em; }
.lp .heroLangs { color:rgba(255,255,255,.62); font-size:12px; line-height:1.7; margin:12px auto 0; max-width:30em; }
.lp .scrollHint { position:absolute; bottom:26px; left:50%; transform:translateX(-50%);
  color:rgba(255,255,255,.6); font-size:10px; letter-spacing:3px; animation:bob 2.2s ease-in-out infinite; }
@keyframes bob { 0%,100%{transform:translate(-50%,0)} 50%{transform:translate(-50%,8px)} }

/* --- ボタン --- */
/* 光らせない。緑の影を敷くと蛍光灯のように見えるので、
   影は落とさず、押したときだけ静かに沈む */
.lp .cta { display:inline-flex; align-items:center; gap:10px; border:0; cursor:pointer;
  background:var(--matcha); color:#fff; padding:16px 30px; border-radius:999px;
  font-size:15px; font-weight:600; box-shadow:none;
  transition:background .2s, opacity .2s; }
.lp .cta:hover { background:#5E9C00; }
.lp .cta:active { opacity:.86; }
.lp .ctaGhost { background:transparent; color:rgba(255,255,255,.82); box-shadow:none;
  border:1px solid rgba(255,255,255,.34); padding:13px 24px; font-size:13px; }
.lp .ctaGhost:hover { background:rgba(255,255,255,.08); }

/* --- セクション --- */
.lp section { padding:clamp(72px,13vw,140px) 22px; }
.lp .wrap { max-width:1040px; margin:0 auto; }
.lp .eyebrow { font-size:10px; letter-spacing:5px; color:var(--matcha); }
.lp h2 { font-size:clamp(26px,5.6vw,46px); line-height:1.3; margin:12px 0 0; white-space:pre-line; }
.lp .lead { color:#5E5B57; font-size:clamp(14px,3.2vw,17px); line-height:1.85; margin-top:16px; max-width:36em; }
.lp .dark { background:var(--ink); color:#fff; }
.lp .dark .lead { color:rgba(255,255,255,.72); }
.lp .warm { background:linear-gradient(180deg,#FBFAF7 0%,#F4F1E8 100%); }
/* 説明が続くので、このセクションだけ下の余白を詰める */
.lp section.tight { padding-bottom:clamp(16px,2.4vw,32px); }
.lp section.tight .feats { margin-top:28px; }

/* --- 無限マーキー --- */
.lp .marquee { display:flex; gap:14px; width:max-content; }
.lp .mRow { overflow:hidden; padding:7px 0; -webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); }
.lp .mRow.a .marquee { animation:slideL 46s linear infinite; }
.lp .mRow.b .marquee { animation:slideR 54s linear infinite; }
@keyframes slideL { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes slideR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
.lp .mCard { position:relative; width:clamp(150px,26vw,232px); aspect-ratio:3/4; border-radius:14px;
  overflow:hidden; flex:0 0 auto; box-shadow:0 8px 24px rgba(0,0,0,.16); }
.lp .mCard img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .7s cubic-bezier(.2,.7,.2,1); }
.lp .mCard:hover img { transform:scale(1.08); }
.lp .mCap { position:absolute; left:0; right:0; bottom:0; padding:26px 12px 11px; color:#fff;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.72)); }
.lp .mCap b { display:block; font-size:12.5px; }
.lp .mCap span { font-size:10px; opacity:.82; letter-spacing:1.4px; }

/* --- /trip をそのまま埋め込むデモ --- */
.lp .demo { position:relative; margin-top:44px; border-radius:20px; overflow:hidden;
  background:#0d1b2a; box-shadow:0 22px 60px rgba(0,0,0,.22); }
.lp .demo > div:first-child { position:absolute; inset:0; }
/* 左上のタイトルチップ（/tripと同じ半透明） */
.lp .demoTitle { position:absolute; top:22px; left:22px; z-index:3;
  background:rgba(255,255,255,.55); backdrop-filter:blur(6px);
  border-radius:12px; padding:7px 12px; max-width:56%;
  box-shadow:0 2px 8px rgba(0,0,0,.14); }
.lp .demoTitle span { display:block; font-size:11px; color:#5E5B57; line-height:1.3; }
.lp .demoTitle b { display:block; font-size:17px; color:#171717; line-height:1.35; }

/* --- 説明の箇条書き --- */
.lp .points { display:grid; gap:14px; margin-top:34px; }
.lp .point { display:flex; gap:13px; align-items:flex-start; }
.lp .pointNo { flex:0 0 auto; width:26px; height:26px; border-radius:50%; background:var(--matcha);
  color:#fff; font-size:12px; display:flex; align-items:center; justify-content:center; margin-top:2px; }
.lp .point b { display:block; font-size:15.5px; margin-bottom:3px; }
.lp .point p { margin:0; font-size:13px; line-height:1.8; color:#6B6862; }

/* --- 特徴カード --- */
.lp .feats { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-top:44px; }
.lp .feat { background:#fff; border:1px solid #ECEAE3; border-radius:18px; overflow:hidden;
  transition:transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s; }
.lp .feat:hover { transform:translateY(-6px); box-shadow:0 18px 40px rgba(0,0,0,.10); }
.lp .featImg { height:172px; overflow:hidden; }
.lp .featImg img { width:100%; height:100%; object-fit:cover; transition:transform .8s cubic-bezier(.2,.7,.2,1); }
.lp .feat:hover .featImg img { transform:scale(1.07); }
.lp .featBody { padding:18px 18px 22px; }
.lp .featBody h3 { margin:0 0 7px; font-size:17px; }
.lp .featBody p { margin:0; font-size:13px; line-height:1.75; color:#6B6862; }

/* --- 御朱印帳（蛇腹・写真つき） --- */
.lp .bookStage { display:flex; justify-content:center; margin-top:48px; }
/* 御朱印の説明。長くなるので字は小さく、行間は広く */
.lp .goshuinNote { max-width:640px; margin:clamp(64px,9vw,104px) auto 0; text-align:left;
  border-top:1px solid rgba(255,255,255,.16); padding-top:30px; }
.lp .goshuinNote .gnHead { display:flex; align-items:baseline; gap:12px; margin-bottom:14px; }
.lp .goshuinNote .gnHead .brush { font-size:26px; color:#fff; letter-spacing:2px; }
.lp .goshuinNote .gnHead b { font-size:13px; letter-spacing:2px; color:rgba(255,255,255,.55); font-weight:500; }
.lp .goshuinNote p { margin:0 0 12px; font-size:12.5px; line-height:2.05; color:rgba(255,255,255,.66); }
.lp .goshuinNote .gnPitch { margin-top:20px; padding-top:18px; font-size:14px; line-height:1.95;
  color:#fff; border-top:1px solid rgba(255,255,255,.14); }
.lp .book { display:flex; align-items:stretch; justify-content:center; perspective:1400px; margin-top:52px; }
.lp .bookCover { width:clamp(88px,17vw,128px); background:linear-gradient(145deg,#22303F,#16202B);
  border-radius:5px 2px 2px 5px; display:flex; align-items:center; justify-content:center;
  box-shadow:0 18px 40px rgba(0,0,0,.42); flex:0 0 auto; }
.lp .bookCover span { color:#EFE9DA; font-size:clamp(17px,3.6vw,25px); line-height:1.35; text-align:center;
  border:1px solid rgba(239,233,218,.42); padding:14px 8px; }
.lp .fold { width:clamp(78px,15vw,116px); flex:0 0 auto; background:#FCFBF6;
  border-right:1px solid #E4DFD2; position:relative; overflow:hidden;
  transform-origin:left center; box-shadow:inset -14px 0 22px -18px rgba(0,0,0,.5); }
.lp .fold:nth-child(odd)  { transform:rotateY(19deg); background:#F6F2E7; }
.lp .fold:nth-child(even) { transform:rotateY(-19deg); }
.lp .foldPage { position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  object-position:top center; }
.lp .foldStamp { position:absolute; left:50%; bottom:11px; transform:translateX(-50%); }
.lp .seal { width:clamp(40px,8vw,54px); aspect-ratio:1; border-radius:50%;
  border:2px solid rgba(155,58,42,.82); display:flex; align-items:center; justify-content:center;
  color:rgba(155,58,42,.82); font-size:clamp(15px,3vw,20px); background:rgba(255,255,255,.5); }
.lp .sealSumi { position:absolute; left:50%; top:52%; transform:translate(-50%,-50%);
  color:#1A1714; font-size:clamp(11px,2.2vw,14px); writing-mode:vertical-rl; letter-spacing:1px; }

/* --- ジャーナル（紙の重なり） --- */
.lp .papers { position:relative; width:clamp(210px,44vw,282px); aspect-ratio:1/1.414; margin:46px auto 0; }
/* 紙は回転してはみ出す前提なので、その分だけ下を確保して余りは削る */
.lp section.journal { padding-bottom:clamp(52px,7vw,88px); }
.lp section.journal .papers { margin-bottom:clamp(26px,4vw,44px); }
.lp .paper { position:absolute; inset:0; background:#FBFAF7; border:1px solid #E6E3DA; border-radius:7px;
  overflow:hidden; box-shadow:0 16px 40px rgba(0,0,0,.16); transition:transform .8s cubic-bezier(.2,.7,.2,1); }
.lp .paper.p3 { transform:rotate(7deg) translate(16px,10px); }
.lp .paper.p2 { transform:rotate(-5deg) translate(-13px,5px); }
.lp .papers .paper.p3 { transform:rotate(11deg) translate(30px,16px); }
.lp .papers .paper.p2 { transform:rotate(-8deg) translate(-26px,9px); }
.lp .paperTop { display:flex; flex-direction:column; height:100%; }
.lp .paperHero { flex:5; overflow:hidden; }
.lp .paperHero img { width:100%; height:100%; object-fit:cover; }
.lp .paperStrip { flex:1.5; display:flex; gap:3px; padding-top:3px; }
.lp .paperStrip div { flex:1; overflow:hidden; }
.lp .paperStrip img { width:100%; height:100%; object-fit:cover; }
.lp .paperFoot { flex:2.6; padding:11px 13px; display:flex; flex-direction:column; justify-content:center; }

/* --- 数字 --- */
.lp .stats { display:flex; flex-wrap:wrap; gap:34px; margin-top:40px; }
.lp .stat b { display:block; font-size:clamp(30px,7vw,52px); line-height:1; }
.lp .stat span { font-size:11px; letter-spacing:2.4px; opacity:.62; }

/* --- 締め --- */
.lp .closing { text-align:center; }
.lp .closing h2 { white-space:pre-line; }
.lp footer { padding:38px 22px 52px; text-align:center; color:#9B978F; font-size:11px; letter-spacing:2.6px; }

/* --- スマホ ---------------------------------------------------------
   デモの地図が画面を占めすぎて、肝心の「何ができるのか」
   （その下の3点）が1画面目に入らなくなっていた。上の余白と地図の高さ、
   説明が同じ画面に入るようにする。 */
@media (max-width: 560px) {
  .lp section { padding-top:clamp(44px,9vw,72px); }
  .lp .lead { margin-top:12px; }
  .lp .demo { margin-top:24px; }
  .lp .demoTitle { top:14px; left:14px; padding:6px 10px; }
  .lp .demoTitle span { font-size:10px; }
  .lp .demoTitle b { font-size:15px; }
          .lp .points { margin-top:22px; }
}

@media (prefers-reduced-motion: reduce) {
  .lp .hero .rv { animation:none; }
  .lp .heroGrid img, .lp .mRow .marquee, .lp .scrollHint { animation:none; }
  .lp .heroGrid img { opacity:.62; }
}
`;

export function Landing() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);

  // 写真は毎回同じ並びにしたいので、決め打ちの順で切り出す
  const photos = LP_PHOTOS;
  const hero = useMemo(() => photos.slice(0, 12), [photos]);
  const rowA = useMemo(() => photos.slice(0, 11), [photos]);
  const rowB = useMemo(() => photos.slice(11, 22), [photos]);
  const feats = useMemo(() => [photos[3], photos[7], photos[14]].filter(Boolean), [photos]);
  // /trip の再現デモに置く3地点。座標は衛星写真の上での見た目で決めている
  const demoPins = useMemo(
    () =>
      [
        { ...photos[5], left: '23.5%', top: '70.4%' },
        { ...photos[9], left: '45.8%', top: '48.8%' },
        { ...photos[2], left: '70%', top: '30%' },
      ].filter((p) => p.src),
    [photos]
  );
  const bookPages = useMemo(() => photos.slice(22, 26), [photos]);
  const paper = useMemo(() => photos.slice(26, 30), [photos]);

  /**
   * 「いくつ回りましたか？」の日本地図。
   * ログイン後の最初の選択と同じ JapanSvgMap をそのまま使う。
   * 選んだ県は端末に控えておき、登録直後の都道府県選択で拾い直す
   * （そのままログインすると、その御朱印が入った状態で始められる）。
   */
  const [quizSel, setQuizSel] = useState<Set<number>>(() => new Set());
  const [quizOpen, setQuizOpen] = useState(false);
  const quizRef = useRef<HTMLElement | null>(null);
  // 一度出したら、閉じたあとに勝手に出直さない
  const quizShown = useRef(false);
  const toggleQuiz = useCallback((code: number) => {
    setQuizSel((cur) => {
      const next = new Set(cur);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);
  /**
   * モーダルはスクロールさせない。
   * 地図の大きさは幅ではなく「残りの高さ」から決める
   * （見出し・県数・ボタン・余白の分を引いた高さに収まる幅を選ぶ）。
   */
  const [vp, setVp] = useState(() =>
    typeof window === 'undefined' ? { w: 390, h: 760 } : { w: window.innerWidth, h: window.innerHeight }
  );
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  // 状態ではなく、描くその瞬間の実寸から決める。
  // resize イベントを取りこぼす場面（描画が止まっているタブなど）があり、
  // 状態に持たせると開いたときの大きさが古いままになるため。
  const quizMapW = () => {
    const w = typeof window === 'undefined' ? vp.w : window.innerWidth;
    const h = typeof window === 'undefined' ? vp.h : window.innerHeight;
    const ratio = contentHeight() / 860;   // 地図の縦横比（沖縄を差し込んだ状態）
    const chrome = 214;                    // 見出し＋県数＋ボタン＋上下の余白
    const byHeight = Math.max(0, h * 0.9 - chrome) / ratio;
    const byWidth = Math.min(w - 60, 460);
    return Math.round(Math.max(150, Math.min(byWidth, byHeight)));
  };
  const seeGoshuin = () => {
    try {
      localStorage.setItem(PENDING_PREFECTURES_KEY, JSON.stringify(Array.from(quizSel)));
    } catch {}
    router.push('/(auth)/login?signup=1');
  };

  /**
   * 出現アニメーションとパララックス。
   * アプリのシェル（+html.tsx）は height:100dvh 固定なので、文書はスクロールしない。
   * LP自身をスクロール領域にしているため、監視も購読もこの要素に対して行う。
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /**
     * ヒーロー背景のパララックスだけ。
     * 出現の演出はCSSに任せ、JSでは中身の表示可否に一切触れない
     * （以前はここでの判定が走らないとページの中身が消えていた）。
     */
    const onScroll = () => {
      const h = root.clientHeight;
      const y = root.scrollTop;
      if (heroRef.current && y < h * 1.2) {
        heroRef.current.style.transform = `rotate(-8deg) scale(1.25) translateY(${y * 0.16}px)`;
      }
      // 都道府県の節が画面に入ったら、地図を中央にぱっと出す（初回だけ）
      if (!quizShown.current && quizRef.current) {
        const top = quizRef.current.getBoundingClientRect().top;
        if (top < h * 0.72) {
          quizShown.current = true;
          setQuizOpen(true);
        }
      }
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  // 御朱印帳の見本。製本ページと同じ planBook / renderPage を使い、
  // 開いている見開きの分だけ描く（最初から全ページは描かない）
  const demoBook = useMemo(() => planBook(LP_DEMO_TRIP), []);
  const demoCache = useRef(new Map<number, string | null>());
  const getDemoPage = useCallback(async (i: number) => {
    const hit = demoCache.current.get(i);
    if (hit !== undefined) return hit;
    const url = await renderPage(demoBook, i);
    demoCache.current.set(i, url);
    return url;
  }, [demoBook]);
  const bookW = Math.min(420, Math.max(260, (typeof window !== 'undefined' ? window.innerWidth : 900) - 56));

  // TripMap は実寸の高さが要るので、画面幅から決める
  /**
   * 埋め込む地図の高さ。
   * スマホでは低くする ―― 300pxあると、その下の「何ができるのか」の説明が
   * 1画面目から押し出されてしまう（実機で確認）。
   */
  const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
  const demoH = vw < 560
    ? Math.round(Math.max(200, Math.min(240, vw * 0.58)))
    : Math.round(Math.min(560, Math.max(300, vw * 0.52)));

  const go = () => router.push('/(auth)/login');
  /**
   * 「始める」はログインを挟まずアプリの中へ入れる。
   * 見るだけなら登録は要らず、記録しようとしたところで初めて
   * SignInPrompt が出る（保存が要る操作の手前で止める設計）。
   */
  const browse = () => router.push('/(tabs)/map');

  const Card = ({ p, i }: { p: any; i: number }) => (
    <div className="mCard" key={`${p.src}-${i}`}>
      <img src={p.src} alt={p.title} loading="lazy" decoding="async" />
      <div className="mCap"><b>{p.title}</b><span>{p.pref.toUpperCase()}</span></div>
    </div>
  );

  return (
    <div className="lp" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ================= ヒーロー ================= */}
      <div className="hero">
        <div className="heroGrid" ref={heroRef}>
          {hero.map((p, i) => (
            <img key={p.src} src={p.src} alt="" loading="eager" decoding="async"
              style={{ animationDelay: `${i * 90}ms, ${i * 300}ms` }} />
          ))}
        </div>
        <div className="heroVeil" />
        <div className="heroInner">
          <div className="heroKicker rv in">M Y &nbsp;J A P A N</div>
          <h1 className="heroTitle mincho rv d1">{t('lp.tagline')}</h1>
          <p className="heroSub rv d2">{t('lp.sub')}</p>
          <p className="heroLangs rv d2">{t('lp.langs')}</p>
          <div className="rv d3" style={{ marginTop: 34, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta" onClick={browse}>{t('lp.cta')} →</button>
            <button className="cta ctaGhost" onClick={go}>{t('lp.haveAccount')}</button>
          </div>
        </div>
        <div className="scrollHint">SCROLL</div>
      </div>

      {/* ================= 写真の流れ ================= */}
      <section style={{ paddingTop: 0, paddingBottom: 0, marginTop: -1 }}>
        <div style={{ padding: '64px 0 8px' }}>
          <div className="wrap rv" style={{ padding: '0 22px 26px' }}>
            <div className="eyebrow">FROM TRAVELLERS IN JAPAN</div>
            <h2 className="mincho">{t('lp.marqueeTitle')}</h2>
          </div>
          <div className="mRow a"><div className="marquee">{[...rowA, ...rowA].map((p, i) => <Card p={p} i={i} key={i} />)}</div></div>
          <div className="mRow b"><div className="marquee">{[...rowB, ...rowB].map((p, i) => <Card p={p} i={i} key={i} />)}</div></div>
        </div>
      </section>

      {/* ================= 御朱印帳 ================= */}
      <section className="dark">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="rv">
            <div className="eyebrow">{t('lp.bookEyebrow')}</div>
            <h2 className="mincho">{t('lp.bookTitle')}</h2>
            <p className="lead" style={{ margin: '16px auto 0' }}>{t('lp.bookCaption')}</p>
          </div>
          {/* 製本ページと同じ、めくれる本のプレビュー */}
          <div className="bookStage rv d2">
            <BookPreview
              total={demoBook.pages.length}
              getPage={getDemoPage}
              width={bookW}
              ratio={PAGE_SIZE.height / PAGE_SIZE.width}
            />
          </div>

          {/* 御朱印そのものの説明。小さめの字で丁寧に */}
          <div className="goshuinNote rv d3">
            <div className="gnHead">
              <span className="brush">御朱印</span>
              <b>{t('lp.goshuinWhatTitle')}</b>
            </div>
            <p>{t('lp.goshuinWhat1')}</p>
            <p>{t('lp.goshuinWhat2')}</p>
            <p className="gnPitch">{t('lp.goshuinPitch')}</p>
          </div>
        </div>
      </section>

      {/* ================= ジャーナル ================= */}
      <section className="journal">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="rv">
            <div className="eyebrow">{t('lp.journalEyebrow')}</div>
            <h2 className="mincho">{t('lp.journalTitle')}</h2>
            <p className="lead" style={{ margin: '16px auto 0' }}>{t('lp.journalCaption')}</p>
          </div>
          <div className="papers">
            <div className="paper p3" />
            <div className="paper p2" />
            <div className="paper">
              <div className="paperTop">
                <div className="paperHero">{paper[0] && <img src={paper[0].src} alt="" loading="lazy" />}</div>
                <div className="paperStrip">
                  {paper.slice(1, 4).map((p) => <div key={p.src}><img src={p.src} alt="" loading="lazy" /></div>)}
                </div>
                <div className="paperFoot">
                  <div style={{ fontSize: 7, letterSpacing: 2.4, color: '#A5A19A' }}>MY JAPAN</div>
                  <div className="mincho" style={{ fontSize: 15, marginTop: 2 }}>{t('lp.journalMockTitle')}</div>
                  <div style={{ fontSize: 8, color: '#6B6862', marginTop: 2 }}>2026.05.02 – 05.06</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 都道府県の問いかけ ================= */}
      {/* ここまでスクロールすると、中央に日本地図がぱっと出る。
          自動で開かなかったときのために、節にもボタンを残してある */}
      <section className="quiz" ref={quizRef}>
        <div className="wrap">
          <div className="rv">
            <div className="eyebrow">{t('lp.quizEyebrow')}</div>
            <h2 className="mincho">{t('lp.quizTitle')}</h2>
            <p className="lead" style={{ margin: '16px auto 0' }}>{t('lp.quizLead')}</p>
          </div>
          <div style={{ marginTop: 30 }}>
            <button className="cta" onClick={() => setQuizOpen(true)}>{t('lp.quizOpen')} →</button>
          </div>
          {quizSel.size > 0 && <p className="quizCount">{t('lp.quizCount', { n: quizSel.size })}</p>}
        </div>
      </section>

      {/* ================= 3つの柱 ================= */}
      <section className="warm tight">
        <div className="wrap">
          <div className="rv">
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 className="mincho">{t('lp.howTitle')}</h2>
            <p className="lead">{t('lp.howLead')}</p>
          </div>

          {/* /trip の地図をそのまま埋め込む。ルート線は Directions が返す
              実際の道路に沿い、ピンも同じ描画（アプリ本体と同一コンポーネント） */}
          <div className="demo" style={{ height: demoH }}>
            <TripMap
              steps={LP_DEMO_STEPS}
              activeIndex={1}
              overview
              onSelect={() => {}}
              height={demoH}
              bottomInset={Math.round(demoH * 0.12)}
            />

            {/* 左上のタイトルチップ */}
            <div className="demoTitle">
              <span>{LP_DEMO_STEPS.map((st) => st.prefectureName).join(' · ')}</span>
              <b className="mincho">{t('lp.demoTripTitle')}</b>
            </div>

          </div>

          {/* 何ができるアプリなのかを、ここで言葉でも伝える */}
          <div className="points rv">
            {[1, 2, 3].map((n) => (
              <div className="point" key={n}>
                <div className="pointNo mincho">{n}</div>
                <div>
                  <b className="mincho">{t(`lp.p${n}t`)}</b>
                  <p>{t(`lp.p${n}b`)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="feats">
            {[
              { t: t('lp.f1t'), b: t('lp.f1b') },
              { t: t('lp.f2t'), b: t('lp.f2b') },
              { t: t('lp.f3t'), b: t('lp.f3b') },
            ].map((f, i) => (
              <div className={`feat rv d${i + 1}`} key={f.t}>
                <div className="featImg">
                  {feats[i] && <img src={feats[i].src} alt="" loading="lazy" decoding="async" />}
                </div>
                <div className="featBody">
                  <h3 className="mincho">{f.t}</h3>
                  <p>{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 締め ================= */}
      <section className="dark closing">
        <div className="wrap rv">
          <h2 className="mincho">{t('lp.closing')}</h2>

        </div>
      </section>

      {/* 中央モーダル。ログイン後の最初の選択と同じ地図をそのまま使う */}
      {quizOpen && (
        <div className="quizBack" onClick={() => setQuizOpen(false)}>
          <div className="quizSheet" onClick={(e) => e.stopPropagation()}>
            <button className="quizClose" onClick={() => setQuizOpen(false)} aria-label="close">×</button>
            <div className="eyebrow">{t('lp.quizEyebrow')}</div>
            <h3 className="mincho">{t('lp.quizTitle')}</h3>
            <div className="quizMap">
              <JapanSvgMap visited={quizSel} onToggle={toggleQuiz} width={quizMapW()} okinawaInset />
            </div>
            <p className="quizCount">{t('lp.quizCount', { n: quizSel.size })}</p>
            <button className="cta" style={{ marginTop: 18 }} onClick={seeGoshuin}>{t('lp.quizCta')} →</button>
          </div>
        </div>
      )}

      <footer>{t('lp.footer')}</footer>
    </div>
  );
}
