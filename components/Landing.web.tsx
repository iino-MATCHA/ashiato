/**
 * ランディングページ（Web）。
 *
 * RNのコンポーネントではなく実DOM＋CSSで書いている。理由は、
 * スクロール連動の演出（IntersectionObserverでの出現、パララックス、
 * 無限マーキー、Ken Burns）がCSSの方が圧倒的に軽く滑らかなため。
 * 言語はブラウザ設定から自動判定するので、切替UIは置かない。
 */
import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { LP_PHOTOS } from '@/lib/lpPhotos';
import { useI18n } from '@/lib/i18n';

const CSS = `
/* シェルが 100dvh 固定なので、LP自身をスクロール領域にする */
.lp { --ink:#14120F; --paper:#FBFAF7; --matcha:#69AF00; --shu:#C4432B; --gold:#C9A227;
  height:100dvh; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch;
  background:var(--paper); color:var(--ink);
  font-family:'ZenKakuGothicNew_400Regular','Zen Kaku Gothic New',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; }
.lp .mincho { font-family:'ShipporiMincho_700Bold','Shippori Mincho',serif; }
.lp .brush  { font-family:'YujiSyuku_400Regular',serif; }

/* --- 出現アニメーション（IntersectionObserverで .in が付く） --- */
.lp .rv { opacity:0; transform:translateY(34px); transition:opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); }
.lp .rv.in { opacity:1; transform:none; }
.lp .rv.d1{transition-delay:.08s}.lp .rv.d2{transition-delay:.16s}.lp .rv.d3{transition-delay:.24s}
.lp .rv.d4{transition-delay:.32s}.lp .rv.d5{transition-delay:.40s}

/* --- ヒーロー --- */
.lp .hero { position:relative; min-height:100dvh; display:flex; align-items:center;
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
.lp .scrollHint { position:absolute; bottom:26px; left:50%; transform:translateX(-50%);
  color:rgba(255,255,255,.6); font-size:10px; letter-spacing:3px; animation:bob 2.2s ease-in-out infinite; }
@keyframes bob { 0%,100%{transform:translate(-50%,0)} 50%{transform:translate(-50%,8px)} }

/* --- ボタン --- */
.lp .cta { display:inline-flex; align-items:center; gap:10px; border:0; cursor:pointer;
  background:var(--matcha); color:#fff; padding:16px 30px; border-radius:999px;
  font-size:15px; font-weight:600; box-shadow:0 10px 28px rgba(105,175,0,.34);
  transition:transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s; }
.lp .cta:hover { transform:translateY(-3px) scale(1.03); box-shadow:0 16px 38px rgba(105,175,0,.44); }
.lp .ctaGhost { background:transparent; color:rgba(255,255,255,.82); box-shadow:none;
  border:1px solid rgba(255,255,255,.34); padding:13px 24px; font-size:13px; }
.lp .ctaGhost:hover { background:rgba(255,255,255,.08); transform:none; }

/* --- セクション --- */
.lp section { padding:clamp(72px,13vw,140px) 22px; }
.lp .wrap { max-width:1040px; margin:0 auto; }
.lp .eyebrow { font-size:10px; letter-spacing:5px; color:var(--matcha); }
.lp h2 { font-size:clamp(26px,5.6vw,46px); line-height:1.3; margin:12px 0 0; white-space:pre-line; }
.lp .lead { color:#5E5B57; font-size:clamp(14px,3.2vw,17px); line-height:1.85; margin-top:16px; max-width:36em; }
.lp .dark { background:var(--ink); color:#fff; }
.lp .dark .lead { color:rgba(255,255,255,.72); }
.lp .warm { background:linear-gradient(180deg,#FBFAF7 0%,#F4F1E8 100%); }

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

/* --- /trip の再現デモ（衛星写真の上に写真ピンとルート） --- */
.lp .demo { position:relative; margin-top:44px; border-radius:20px; overflow:hidden;
  aspect-ratio:16/10; background:#0d1b2a; box-shadow:0 22px 60px rgba(0,0,0,.22); }
.lp .demo .sat { position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
  filter:saturate(1.06) contrast(1.06) brightness(.9); }
.lp .demoVeil { position:absolute; inset:0;
  background:linear-gradient(180deg,rgba(6,14,24,.42) 0%,rgba(6,14,24,.12) 38%,rgba(6,14,24,.72) 100%); }
/* ルート線: 描かれていくアニメーション */
.lp .demo svg { position:absolute; inset:0; width:100%; height:100%; }
.lp .demoPath { fill:none; stroke:#8FD13F; stroke-width:3; stroke-linecap:round;
  filter:drop-shadow(0 0 6px rgba(143,209,63,.55));
  stroke-dasharray:1000; stroke-dashoffset:1000; }
.lp .demo.in .demoPath { animation:draw 1.7s .35s cubic-bezier(.4,0,.2,1) forwards; }
@keyframes draw { to { stroke-dashoffset:0 } }
/* 写真ピン（/tripと同じ 52px・白3px縁・番号バッジ） */
.lp .pin { position:absolute; width:clamp(44px,7.4vw,58px); aspect-ratio:1; border-radius:50%;
  border:3px solid #fff; background-size:cover; background-position:center;
  box-shadow:0 2px 10px rgba(0,0,0,.45); transform:translate(-50%,-50%) scale(.5); opacity:0; }
.lp .demo.in .pin { animation:pinIn .5s cubic-bezier(.2,1.5,.4,1) forwards; }
@keyframes pinIn { to { transform:translate(-50%,-50%) scale(1); opacity:1 } }
.lp .pin.active { border-color:#8FD13F; }
.lp .demo.in .pin.active { animation:pinIn .5s cubic-bezier(.2,1.5,.4,1) forwards,
  pulse 2.6s 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{box-shadow:0 2px 10px rgba(0,0,0,.45)} 50%{box-shadow:0 2px 10px rgba(0,0,0,.45),0 0 0 10px rgba(143,209,63,.16)} }
.lp .pinNo { position:absolute; top:-5px; right:-5px; font-size:10px; font-weight:700; color:#fff;
  background:#1B1815; border:1.5px solid #fff; border-radius:9px; min-width:17px; height:17px;
  line-height:15px; text-align:center; padding:0 3px; }
/* 交通手段のチップ */
.lp .leg { position:absolute; width:36px; height:36px; border-radius:50%; background:#FBFAF7;
  border:2px solid #69AF00; display:flex; align-items:center; justify-content:center;
  transform:translate(-50%,-50%) scale(0); box-shadow:0 3px 10px rgba(0,0,0,.3); }
.lp .demo.in .leg { animation:pinIn .45s 1.5s cubic-bezier(.2,1.5,.4,1) forwards; }
.lp .leg svg { position:static; width:18px; height:18px; }
/* 下のカード（/tripのドックを縮めたもの） */
.lp .demoCard { position:absolute; left:5%; bottom:5%; width:min(58%,270px);
  background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 10px 26px rgba(0,0,0,.32);
  transform:translateY(24px); opacity:0; }
.lp .demo.in .demoCard { animation:cardUp .7s 1.7s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes cardUp { to { transform:none; opacity:1 } }
.lp .demoCard .ph { height:88px; background-size:cover; background-position:center; }
.lp .demoCard .bd { padding:10px 12px 12px; }
.lp .demoCard .kx { font-size:8.5px; letter-spacing:1.6px; color:#A5A19A; }
.lp .demoCard .tt { font-size:14px; margin:3px 0 1px; color:#1B1815; }
.lp .demoCard .sb { font-size:10.5px; color:#6B6862; }
/* 右上の丸ボタン列（/tripのヘッダー） */
.lp .demoActions { position:absolute; top:5%; right:5%; display:flex; flex-direction:column; gap:7px; }
.lp .demoActions i { width:34px; height:34px; border-radius:50%; background:#fff;
  display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,.3); }
.lp .demoActions svg { position:static; width:16px; height:16px; }
/* 左上のタイトルチップ */
.lp .demoTitle { position:absolute; top:5%; left:5%; background:rgba(255,255,255,.55);
  backdrop-filter:blur(4px); border-radius:10px; padding:6px 10px; max-width:52%; }
.lp .demoTitle b { display:block; font-size:13px; color:#171717; }
.lp .demoTitle span { font-size:9.5px; color:#5E5B57; }

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
.lp .foldPhoto { position:absolute; inset:9px 9px auto 9px; aspect-ratio:1; border-radius:2px;
  overflow:hidden; filter:sepia(.16) saturate(.94); }
.lp .foldPhoto img { width:100%; height:100%; object-fit:cover; }
.lp .foldStamp { position:absolute; left:50%; bottom:11px; transform:translateX(-50%); }
.lp .seal { width:clamp(40px,8vw,54px); aspect-ratio:1; border-radius:50%;
  border:2px solid rgba(155,58,42,.82); display:flex; align-items:center; justify-content:center;
  color:rgba(155,58,42,.82); font-size:clamp(15px,3vw,20px); background:rgba(255,255,255,.5); }
.lp .sealSumi { position:absolute; left:50%; top:52%; transform:translate(-50%,-50%);
  color:#1A1714; font-size:clamp(11px,2.2vw,14px); writing-mode:vertical-rl; letter-spacing:1px; }

/* --- ジャーナル（紙の重なり） --- */
.lp .papers { position:relative; width:clamp(210px,44vw,282px); aspect-ratio:1/1.414; margin:46px auto 0; }
.lp .paper { position:absolute; inset:0; background:#FBFAF7; border:1px solid #E6E3DA; border-radius:7px;
  overflow:hidden; box-shadow:0 16px 40px rgba(0,0,0,.16); transition:transform .8s cubic-bezier(.2,.7,.2,1); }
.lp .paper.p3 { transform:rotate(7deg) translate(16px,10px); }
.lp .paper.p2 { transform:rotate(-5deg) translate(-13px,5px); }
.lp .papers.in .paper.p3 { transform:rotate(11deg) translate(30px,16px); }
.lp .papers.in .paper.p2 { transform:rotate(-8deg) translate(-26px,9px); }
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

@media (prefers-reduced-motion: reduce) {
  .lp .rv { opacity:1; transform:none; transition:none; }
  .lp .heroGrid img, .lp .mRow .marquee, .lp .scrollHint { animation:none; }
  .lp .heroGrid img { opacity:.62; }
}
`;

/** デモ地図の下地。本州の衛星写真（HTTP 200 を実測して固定） */
const SAT =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Satellite_image_of_Honshu_in_May_2003.png/1280px-Satellite_image_of_Honshu_in_May_2003.png';

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
   * 出現アニメーションとパララックス。
   * アプリのシェル（+html.tsx）は height:100dvh 固定なので、文書はスクロールしない。
   * LP自身をスクロール領域にしているため、監視も購読もこの要素に対して行う。
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // IntersectionObserverではなく位置で判定する。IOはタブが描画されていないと
    // 発火せず、そのまま中身が透明のまま残る事故があるため。
    // requestAnimationFrame も IntersectionObserver も、タブが描画されていないと
    // 止まる／発火しない。中身が透明のまま残る事故を避けるため、
    // scroll イベントの中で直接判定する（対象は最大14要素なので十分軽い）。
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.rv, .papers, .demo'));

    const tick = () => {
      const rootTop = root.getBoundingClientRect().top;
      const h = root.clientHeight;
      for (let i = targets.length - 1; i >= 0; i--) {
        const el = targets[i];
        if (el.getBoundingClientRect().top - rootTop < h * 0.92) {
          el.classList.add('in');
          targets.splice(i, 1); // 一度出したら監視から外す
        }
      }
      const y = root.scrollTop;
      if (heroRef.current && y < h * 1.2) {
        // 背景をゆっくり流して奥行きを出す
        heroRef.current.style.transform = `rotate(-8deg) scale(1.25) translateY(${y * 0.16}px)`;
      }
    };

    tick(); // 初期表示分
    root.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      root.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
    };
  }, []);

  const go = () => router.push('/(auth)/login');

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
          <div className="heroKicker rv in">A S H I A T O</div>
          <h1 className="heroTitle mincho rv d1">{t('lp.tagline')}</h1>
          <p className="heroSub rv d2">{t('lp.sub')}</p>
          <div className="rv d3" style={{ marginTop: 34, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta" onClick={go}>{t('lp.cta')} →</button>
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

      {/* ================= 3つの柱 ================= */}
      <section className="warm">
        <div className="wrap">
          <div className="rv">
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 className="mincho">{t('lp.howTitle')}</h2>
            <p className="lead">{t('lp.howLead')}</p>
          </div>

          {/* /trip の画面をそのまま再現したデモ。線が引かれ、ピンが立ち、カードが上がる */}
          <div className="demo">
            <img className="sat" src={SAT} alt="" decoding="async" />
            <div className="demoVeil" />

            <svg viewBox="0 0 800 500" preserveAspectRatio="none">
              {/* 3地点を結ぶ道なりの線（/tripと同じ黄緑） */}
              <path className="demoPath" d="M188 352 C 262 300, 300 262, 366 244 S 470 214, 560 150" />
            </svg>

            {/* 交通手段のチップ（線の中ほど） */}
            <div className="leg" style={{ left: '36%', top: '55%' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#69AF00" strokeWidth="2" strokeLinecap="round">
                <rect x="6" y="3" width="12" height="13" rx="2" /><path d="M6 19l-2 2M18 19l2 2M9 20h6M7 9h10" />
              </svg>
            </div>

            {/* 写真ピン（/tripと同じ 52px相当・白3px縁・番号バッジ） */}
            {demoPins.map((p, i) => (
              <div
                key={p.src}
                className={`pin${i === 1 ? ' active' : ''}`}
                style={{
                  left: p.left, top: p.top,
                  backgroundImage: `url(${p.src})`,
                  animationDelay: `${900 + i * 220}ms`,
                }}
              >
                <span className="pinNo">{i + 1}</span>
              </div>
            ))}

            {/* 左上のタイトルチップ */}
            <div className="demoTitle">
              <span>{demoPins.map((p) => p.pref).join(' · ')}</span>
              <b className="mincho">{t('lp.demoTripTitle')}</b>
            </div>

            {/* 右上のアクション列 */}
            <div className="demoActions">
              {[
                'M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M12 3v13M8 7l4-4 4 4',
                'M4 4h13a2 2 0 012 2v14H6a2 2 0 01-2-2V4z M8 4v16',
                'M12 15a3 3 0 100-6 3 3 0 000 6z M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1L14.5 3h-4l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L6.1 11a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.6h4l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5c.06-.33.1-.66.1-1z',
              ].map((d, i) => (
                <i key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1B1815" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={d} />
                  </svg>
                </i>
              ))}
            </div>

            {/* 下のカード */}
            <div className="demoCard">
              <div className="ph" style={{ backgroundImage: `url(${demoPins[1].src})` }} />
              <div className="bd">
                <div className="kx">STOP 2 / 3 · {demoPins[1].pref.toUpperCase()}</div>
                <div className="tt mincho">{demoPins[1].title}</div>
                <div className="sb">{t('lp.demoCardNote')}</div>
              </div>
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

      {/* ================= 御朱印帳 ================= */}
      <section className="dark">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="rv">
            <div className="eyebrow">{t('lp.bookEyebrow')}</div>
            <h2 className="mincho">{t('lp.bookTitle')}</h2>
            <p className="lead" style={{ margin: '16px auto 0' }}>{t('lp.bookCaption')}</p>
          </div>
          <div className="book rv d2">
            <div className="bookCover"><span className="brush">足<br />跡</span></div>
            {bookPages.map((p, i) => (
              <div className="fold" key={p.src}>
                <div className="foldPhoto"><img src={p.src} alt="" loading="lazy" decoding="async" /></div>
                <div className="foldStamp">
                  <div className="seal mincho" style={{ position: 'relative' }}>
                    {['京', '芸', '筑', '薩'][i]}
                    <span className="sealSumi brush">{['きょうと', 'ひろしま', 'ふくおか', 'かごしま'][i]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="stats rv d3" style={{ justifyContent: 'center', marginTop: 54 }}>
            {[['47', 'PREFECTURES'], ['1,741', 'MUNICIPALITIES'], ['∞', 'FOOTPRINTS']].map(([n, l]) => (
              <div className="stat" key={l}><b className="mincho">{n}</b><span>{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ジャーナル ================= */}
      <section>
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
                  <div style={{ fontSize: 7, letterSpacing: 2.4, color: '#A5A19A' }}>ASHIATO</div>
                  <div className="mincho" style={{ fontSize: 15, marginTop: 2 }}>{t('lp.journalMockTitle')}</div>
                  <div style={{ fontSize: 8, color: '#6B6862', marginTop: 2 }}>2026.05.02 – 05.06</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 締め ================= */}
      <section className="dark closing">
        <div className="wrap rv">
          <h2 className="mincho">{t('lp.closing')}</h2>
          <div style={{ marginTop: 34 }}>
            <button className="cta" onClick={go}>{t('lp.cta')} →</button>
          </div>
        </div>
      </section>

      <footer>ASHIATO BY MATCHA</footer>
    </div>
  );
}
