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
  transform-origin:left center; transform-style:preserve-3d;
  transition:transform .78s cubic-bezier(.42,0,.2,1); }
.bkp .flip.turning { transform:rotateY(-172deg); }
.bkp .flip .face { position:absolute; inset:0; backface-visibility:hidden; overflow:hidden;
  background:var(--paper); border-radius:0 6px 6px 0; }
.bkp .flip .back { transform:rotateY(180deg); border-radius:6px 0 0 6px; }
.bkp .flip .face img { width:100%; height:100%; object-fit:cover; display:block; }
/* めくり中に落ちる影 */
.bkp .flip::after { content:''; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(90deg,rgba(0,0,0,.20),rgba(0,0,0,0) 32%);
  opacity:0; transition:opacity .3s; }
.bkp .flip.turning::after { opacity:1; }
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
@media (prefers-reduced-motion: reduce) { .bkp .flip { transition:none } }
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
}

export function BookPreview({ total, getPage, width, ratio = 1654 / 1165 }: BookPreviewProps) {
  const pageW = width / 2;
  const height = pageW * ratio;

  // 開いている見開きの左ページ番号（0, 2, 4 …）
  const [at, setAt] = useState(0);
  const [turning, setTurning] = useState<null | 'next' | 'prev'>(null);
  const cache = useRef(new Map<number, string | null>());
  const [, force] = useState(0);

  const spreadCount = Math.max(1, Math.ceil(total / 2));

  // 見えている見開きと、その前後だけを先に用意しておく
  useEffect(() => {
    let alive = true;
    const want = [at - 2, at - 1, at, at + 1, at + 2, at + 3].filter((i) => i >= 0 && i < total);
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
  }, [at, total, getPage]);

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

  // めくっている紙の表裏
  const flipFront = turning === 'prev' ? page(at - 1) : page(at + 1);
  const flipBack = turning === 'prev' ? page(at - 2) : page(at + 2);

  const Face = ({ src, className }: { src: string | null; className: string }) => (
    <div className={className}>
      {src ? <img src={src} alt="" /> : <div className="empty">…</div>}
    </div>
  );

  return (
    <div className="bkp" style={{ width, height }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="book" style={{ height }}>
        <Face src={page(at)} className="side left" />
        <Face src={page(at + 1)} className="side right" />

        {/* めくられる紙。prev のときは左から戻ってくるので開始角を変える */}
        <div
          className={`flip${turning ? ' turning' : ''}`}
          style={turning === 'prev' ? { transform: turning ? 'rotateY(0deg)' : 'rotateY(-172deg)' } : undefined}
        >
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
