/**
 * 本をめくるプレビュー（Web）。
 *
 * 最初から全ページを並べず、開いている見開きだけを見せる。
 * 右のページを掴んで左へめくる動きを CSS の 3D で作り、
 * めくり終わると次の見開きが現れる。ページは必要になった順に描く。
 *
 * 製本ページ(/trip/[id]/bind)とLPで同じものを使う。
 */
import { useEffect, useRef, useState } from 'react';

const CSS = `
.bkp { --paper:#FBF8F0; position:relative; margin:0 auto; perspective:2000px; user-select:none; }
.bkp .book { position:relative; width:100%; height:100%; display:flex;
  border-radius:3px 6px 6px 3px; overflow:visible;
  /* 横スワイプでめくるので、横は本が受け取り、縦のスクロールはページに返す */
  touch-action:pan-y;
  box-shadow:0 26px 60px rgba(0,0,0,.28), 0 3px 10px rgba(0,0,0,.16); }
/* 背（綴じ側）の陰 */
.bkp .book::after { content:''; position:absolute; left:50%; top:0; bottom:0; width:26px;
  transform:translateX(-50%); pointer-events:none; z-index:5;
  background:linear-gradient(90deg,rgba(0,0,0,0) 0%,rgba(60,50,38,.22) 42%,rgba(60,50,38,.30) 50%,rgba(60,50,38,.22) 58%,rgba(0,0,0,0) 100%); }
.bkp .side { position:relative; width:50%; height:100%; background:var(--paper); overflow:hidden; }
.bkp .side img { width:100%; height:100%; object-fit:cover; display:block; }
.bkp .side.left  { border-radius:3px 0 0 3px; }
.bkp .side.right { border-radius:0 6px 6px 0; }
/* めくられる紙。右半分の上に重ね、綴じ側を軸に回す */
.bkp .flip { position:absolute; top:0; right:0; width:50%; height:100%; z-index:6;
  transform-origin:left center; transform-style:preserve-3d; transform:rotateY(0deg); }
.bkp .flip.turn-next { animation:turnNext .78s cubic-bezier(.42,0,.2,1) forwards; }
.bkp .flip.turn-prev { animation:turnPrev .78s cubic-bezier(.42,0,.2,1) forwards; }
@keyframes turnNext { from { transform:rotateY(0deg) } to { transform:rotateY(-172deg) } }
@keyframes turnPrev { from { transform:rotateY(-172deg) } to { transform:rotateY(0deg) } }
.bkp .flip .face { position:absolute; inset:0; backface-visibility:hidden; overflow:hidden;
  background:var(--paper); border-radius:0 6px 6px 0; }
.bkp .flip .back { transform:rotateY(180deg); border-radius:6px 0 0 6px; }
.bkp .flip .face img { width:100%; height:100%; object-fit:cover; display:block; }
/* めくり中に落ちる影 */
.bkp .flip::after { content:''; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(90deg,rgba(0,0,0,.20),rgba(0,0,0,0) 32%);
  opacity:0; transition:opacity .3s; }
.bkp .flip.turn-next::after, .bkp .flip.turn-prev::after { opacity:1; }
/* 操作 */
.bkp .nav { position:absolute; top:50%; transform:translateY(-50%); z-index:8;
  width:38px; height:38px; border:0; border-radius:50%; cursor:pointer;
  background:rgba(255,255,255,.92); box-shadow:0 3px 12px rgba(0,0,0,.24);
  display:flex; align-items:center; justify-content:center; transition:opacity .2s, transform .2s; }
.bkp .nav:hover { transform:translateY(-50%) scale(1.08); }
.bkp .nav[disabled] { opacity:0; pointer-events:none; }
.bkp .nav.prev { left:-14px; } .bkp .nav.next { right:-14px; }
.bkp .nav svg { width:17px; height:17px; }
.bkp .meter { display:flex; justify-content:center; gap:5px; margin-top:14px; }
.bkp .meter i { width:6px; height:6px; border-radius:3px; background:#DAD7D0; transition:width .3s, background .3s; }
.bkp .meter i.on { width:17px; background:#69AF00; }
.bkp .empty { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  color:#A5A19A; font-size:12px; }
@media (prefers-reduced-motion: reduce) { .bkp .flip { animation:none } }
`;

export interface BookPreviewProps {
  /** 総ページ数 */
  total: number;
  /** i番目のページ画像を返す（必要になった時だけ呼ばれる） */
  getPage: (i: number) => Promise<string | null>;
  /** 見開きの幅 */
  width: number;
  /** 1ページの縦横比（高さ / 幅） */
  ratio?: number;
  /**
   * 開いている見開きの左ページ番号を知らせる（0, 2, 4 …）。
   * 製本の画面が、いま見ているページの編集欄を前に出すのに使う。
   */
  onSpreadChange?: (leftPage: number) => void;
  /**
   * 中身が変わったことを知らせる合図。
   *
   * **この部品を key で作り直さないこと。** 作り直すと開いていたページを
   * 忘れ、写真を1枚足すたびに表紙へ戻ってしまう（指摘を受けた）。
   * 合図が変わったら、描いた絵の控えだけ捨てて引き直す。
   */
  revision?: string | number;
}

export function BookPreview({ total, getPage, width, ratio = 1654 / 1165, onSpreadChange, revision }: BookPreviewProps) {
  const pageW = width / 2;
  const height = pageW * ratio;

  // 開いている見開きの左ページ番号（0, 2, 4 …）
  const [at, setAt] = useState(0);
  const [turning, setTurning] = useState<null | 'next' | 'prev'>(null);
  const cache = useRef(new Map<number, string | null>());
  const [, force] = useState(0);

  const spreadCount = Math.max(1, Math.ceil(total / 2));

  // いま開いている見開きを外へ知らせる（最初の描画でも1度）
  useEffect(() => { onSpreadChange?.(at); }, [at, onSpreadChange]);

  // ページが減ったら、開いている見開きを中へ引き戻す
  useEffect(() => {
    setAt((cur) => (cur < total ? cur : Math.max(0, (Math.max(1, Math.ceil(total / 2)) - 1) * 2)));
  }, [total]);

  // 見えている見開きと、その前後だけを先に用意しておく
  const lastRev = useRef(revision);
  useEffect(() => {
    let alive = true;
    // 中身が変わったら控えを捨てる（開いているページはそのまま）
    if (lastRev.current !== revision) {
      lastRev.current = revision;
      cache.current.clear();
    }
    const want = [at, at + 1, at - 1, at - 2, at + 2, at + 3].filter((i) => i >= 0 && i < total);
    (async () => {
      for (const i of want) {
        if (cache.current.has(i)) continue;
        cache.current.set(i, null); // 二重取得を防ぐ
        const url = await getPage(i);
        if (!alive) return;
        cache.current.set(i, url);
        force((n) => n + 1);
      }
    })();
    return () => { alive = false; };
  }, [at, total, getPage, revision]);

  const page = (i: number) => (i >= 0 && i < total ? cache.current.get(i) ?? null : null);

  const go = (dir: 'next' | 'prev') => {
    if (turning) return;
    if (dir === 'next' && at + 2 >= total) return;
    if (dir === 'prev' && at === 0) return;
    setTurning(dir);
    // めくり終わってから見開きを差し替える
    setTimeout(() => {
      setAt((cur) => (dir === 'next' ? cur + 2 : cur - 2));
      setTurning(null);
    }, 780);
  };

  /**
   * 横スワイプでめくる。紙をめくる操作なので、矢印より先にこちらが自然
   * （ユーザー要望）。縦成分の方が大きい動きはページのスクロールに譲る。
   */
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = drag.current;
    drag.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      go(dx < 0 ? 'next' : 'prev'); // 左へ払う＝次のページ
    }
  };

  /**
   * 紙は「表 = page(2k+1) / 裏 = page(2k+2)」の1枚。
   * 次へ: 右の紙(表 at+1 / 裏 at+2)が左へ倒れる。倒れた先の左は裏(at+2)、
   *       持ち上がった右からは at+3 が現れる。
   * 前へ: 左に伏せている紙(表 at-1 / 裏 at)が右へ起き上がる。始まりは裏(at)が
   *       見えている状態（＝いまの左ページ）で、退いた左からは at-2 が現れる。
   * この対応を外すと、同じページが二度出たり抜けたりする。
   */
  const leftStatic = turning === 'prev' ? page(at - 2) : page(at);
  const rightStatic = turning === 'next' ? page(at + 3) : page(at + 1);
  const flipFront = turning === 'prev' ? page(at - 1) : page(at + 1);
  const flipBack = turning === 'prev' ? page(at) : page(at + 2);

  const Face = ({ src, className }: { src: string | null; className: string }) => (
    <div className={className}>
      {/* draggable を切らないと、スワイプが画像のドラッグに化けて pointerup が来ない */}
      {src ? <img src={src} alt="" draggable={false} /> : <div className="empty">…</div>}
    </div>
  );

  return (
    <div className="bkp" style={{ width, height }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="book" style={{ height }} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <Face src={leftStatic} className="side left" />
        <Face src={rightStatic} className="side right" />

        {/* めくられる紙。next は 0→-172度、prev は -172→0度 */}
        <div className={`flip${turning ? ` turn-${turning}` : ''}`} key={`${at}-${turning ?? 'rest'}`}>
          <Face src={flipFront} className="face" />
          <Face src={flipBack} className="face back" />
        </div>

        <button className="nav prev" onClick={() => go('prev')} disabled={at === 0} aria-label="previous">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1B1815" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="nav next" onClick={() => go('next')} disabled={at + 2 >= total} aria-label="next">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1B1815" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="meter">
        {Array.from({ length: spreadCount }).map((_, i) => (
          <i key={i} className={i === Math.floor(at / 2) ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
