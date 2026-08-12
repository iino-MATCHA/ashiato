/**
 * 画面下から出ているシート。
 *
 * 既定では画面の下 1/4 ほどだけ見えていて、つまみを上へスワイプするか
 * 中身に触れると、ほぼ全面まで伸びる。上の日本地図はそのまま残るので、
 * 地図を見ながら下の中身だけ入れ替えられる。
 *
 * **Web では Animated を使わない。**
 * react-native-web では PanResponder がつまみに繋がらず、
 * Animated.spring も走らない場面があって、離した指の位置にシートが
 * 取り残された（実測で確認）。そこで Web は DOM に直接 transform を書き、
 * 寄せる動きは CSS の transition に任せる。
 * ネイティブは従来どおり PanResponder + Animated。
 *
 * **指の動きは touch イベントで受ける（pointer ではない）。**
 * 面のどこを下へ払っても閉じられるようにするには、払い始めの1回目で
 * 「これはシートの操作だ」と決めて preventDefault しなければならない。
 * pointermove を 6px 待ってから止めようとすると、その間にブラウザが
 * スクロールを始めてしまい、以後 preventDefault は効かない
 * （＝つまみ以外では閉じられなかった原因）。マウスは pointer のまま。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { WashiBackground } from '@/components/WashiBackground';

const WEB = Platform.OS === 'web';

/**
 * シートが全面まで開いているか。
 * 中身の一覧は「開いているときだけ」スクロールさせたいので、
 * 各ペインがこれを見て scrollEnabled を決める。
 */
const SheetOpenContext = createContext(false);
export const useSheetOpen = () => useContext(SheetOpenContext);

/**
 * 中身の一覧が一番上にいるかを、シート側へ知らせるための入れ物。
 *
 * 開いているときに面を下へ払ったら閉じたいが、一覧の途中を読んでいる最中に
 * 閉じられては困る。そこで「一番上で、下へ払ったときだけ」閉じる。
 * その判定に一覧の現在位置が要るので、各ペインがここへ報告する。
 */
const SheetScrollContext = createContext<(y: number) => void>(() => {});

/**
 * 一覧に付けるだけで、シートに現在位置を伝える。
 * `<ScrollView {...useSheetScroll()}>` のように広げて使う。
 */
export function useSheetScroll() {
  const report = useContext(SheetScrollContext);
  return {
    onScroll: (e: any) => report(e?.nativeEvent?.contentOffset?.y ?? 0),
    scrollEventThrottle: 16,
  };
}

/**
 * 寄せる動きは CSS に任せる。ブラウザ側が動かすので、
 * JS のタイマーが間引かれていても最終位置がずれない。
 * 指で動かしている間（data-dragging="1"）は追従を優先して切る。
 */
const SHEET_CSS = `
[data-mjsheet="1"] { transition: transform .28s cubic-bezier(.2,.7,.2,1); }
[data-mjsheet="1"][data-dragging="1"] { transition: none; }
`;
let cssInjected = false;
function injectSheetCss() {
  if (!WEB || cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const tag = document.createElement('style');
  tag.textContent = SHEET_CSS;
  document.head.appendChild(tag);
}

export function BottomSheet({
  collapsedHeight,
  expandedHeight,
  children,
  onOpenChange,
  onDismiss,
}: {
  /** たたんだときに見えている高さ */
  collapsedHeight: number;
  /** 伸ばしきったときの高さ */
  expandedHeight: number;
  children: React.ReactNode;
  /** 全面まで開いているかを外へ知らせる（戻る矢印の出し分けに使う） */
  onOpenChange?: (open: boolean) => void;
  /**
   * たたんだ状態から、さらに下へ払われたときに呼ぶ。
   * 渡すとシートが「閉じられるもの」になる（県のカードなど、
   * 常設ではないシート用）。渡さなければ従来どおり2段で止まる。
   */
  onDismiss?: () => void;
}) {
  const { palette } = useTheme();
  const travel = Math.max(0, expandedHeight - collapsedHeight);
  injectSheetCss();

  const [open, setOpen] = useState(false);
  const at = useRef(travel); // いまの下げ幅（0 = 全面、travel = たたんだ状態）
  const gripRef = useRef<View | null>(null);
  const sheetRef = useRef<View | null>(null);
  // たたんでいる間は中がスクロールしないので、面のどこを掴んでも動かせる。
  // ハンドラは掴んだ時点の open を見るため、ref で最新を持つ
  const openRef = useRef(false);
  // 指で動かしている最中かどうか。置き直しの効果がこれを見て手を引く
  const draggingRef = useRef(false);
  // 中身の一覧が一番上にいるか。開いた面を下へ払って閉じてよいかの判定に使う
  const atTopRef = useRef(true);
  /**
   * 「一番上」は少し甘く見る。
   * 慣性で戻ったときの最後の報告が 0.5 のような端数で来ることがあり、
   * 厳密に y<=0 で見ていると、見た目は一番上なのに面を払っても閉じなかった。
   */
  const reportScroll = useCallback((y: number) => { atTopRef.current = y <= 2; }, []);
  const anim = useRef(new Animated.Value(travel)).current; // ネイティブ用

  /**
   * Web の位置は React の状態で持つ。
   * DOM へ直接 transform を書く手も試したが、react-native-web が
   * インラインの style を管理し直すため打ち消されて動かなかった（実測）。
   * 状態にしておけば RNW が責任を持って書くので、確実に反映される。
   */
  const [webY, setWebY] = useState(travel);
  const [dragging, setDragging] = useState(false);

  /**
   * シートの位置を書く。animate=false は指に追従させるとき。
   *
   * Web では**位置を自分で補間しない**。
   * requestAnimationFrame は画面を描いていない状態で一度も呼ばれず、
   * setTimeout も同じ状況では大きく間引かれる。どちらで補間しても
   * 「シートが途中で止まったまま」になり得る（実測で確認）。
   * 行き先を状態に即座に入れて確定させ、その間を滑らかに見せるのは
   * CSS の transition（下の SHEET_CSS）に任せる。
   * 演出が動かなくても、シートは必ず開いた／閉じたのどちらかに収まる。
   */
  const place = useCallback(
    (px: number, animate: boolean) => {
      at.current = px;
      if (WEB) {
        setDragging(!animate);
        setWebY(px);
        return;
      }
      if (animate) {
        Animated.spring(anim, { toValue: px, useNativeDriver: true, bounciness: 2, speed: 14 }).start();
      } else {
        anim.setValue(px);
      }
    },
    [anim]
  );

  const snapTo = useCallback(
    (px: number) => {
      place(px, true);
      openRef.current = px === 0;
      setOpen(px === 0);
      onOpenChange?.(px === 0);
    },
    [place, onOpenChange]
  );

  /**
   * 画面の大きさが変わったら、いまの状態に合わせて置き直す。
   *
   * 触っている最中は置き直さない。ChromeのURLバーは指を動かすと出入りし、
   * そのたびに height が変わって travel が変わる。素直に置き直すと、
   * 上げようとした瞬間にシートが元へ戻され「動かない」ように感じる（実測）。
   *
   * 開いているかは openRef を見る。この効果は open を依存に持たないので、
   * 状態変数を読むと閉じていた頃の値が残り、開けた直後に閉じてしまう。
   */
  useEffect(() => {
    if (draggingRef.current) return;
    place(openRef.current ? 0 : travel, false);
  }, [travel, place]);

  /**
   * 離したときの寄せ先。勢いがあればその向き、無ければ近い方へ。
   * しきい値は 0.4px/ms だと、ゆっくり払ったぶんが全部「近い方」に
   * 落ちて重く感じたので下げてある。
   */
  const settle = useCallback(
    (from: number, moved: number, speed: number) => {
      /**
       * たたんだ状態から、なお下へ払われた ―― シートを片付ける意思。
       * onDismiss を持つシートだけが応じる（常設のシートは2段で止まる）。
       */
      if (onDismiss && from >= travel - 4 && (speed > 0.22 || moved > 48)) {
        onDismiss();
        return;
      }
      if (speed < -0.22) return snapTo(0);
      if (speed > 0.22) return snapTo(travel);
      snapTo(from + moved < travel / 2 ? 0 : travel);
    },
    [snapTo, travel, onDismiss]
  );

  // ---- Web: シートの DOM に直接イベントをつける ----
  useEffect(() => {
    if (!WEB) return;
    const node = sheetRef.current as unknown as HTMLElement | null;
    const grip = gripRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;

    /**
     * 「掴んだ」と見なす距離。
     *
     * **指はここを 2px にしてある。** 以前は指もマウスと同じ 6px 待っていたが、
     * その待っている間にブラウザが「これはスクロールだ」と決めてしまい、
     * あとから preventDefault しても戻せない（一度始まったスクロールは
     * 取り上げられない）。結果、つまみ以外の面を下へ払っても閉じなかった。
     * 向きは最初の touchmove で分かるので、そこで決めて取り上げる。
     *
     * マウスは 6px 待つ。中のボタンを押せなくなるため。
     */
    const START_TOUCH = 2;
    const START_MOUSE = 6;

    let startY = 0;
    let startAt = 0;
    let startTime = 0;
    let armed = false;    // 指が乗っている
    let dragging = false; // 実際に動かし始めた
    let fromGrip = false;
    /** 面から始めた指。一覧が一番上で下へ払ったときだけシートを下げる */
    let guarded = false;
    let movedBy = 0;
    let pointer = -1;
    let isTouch = false;

    const disarm = () => {
      armed = false;
      draggingRef.current = false;
    };

    /**
     * 指・マウスが乗った。
     * 開いているときに面から始めたものは、まだスクロールのものかもしれない。
     * 掴んだことにはせず「見張る」状態にして、向きが下で、かつ一覧が
     * 一番上にいるとわかった時点でシートに引き取る（move の中で判定）。
     * つまみから始めたときと、たたんでいるとき（中が動かない）は素直に掴む。
     */
    const begin = (y: number, target: EventTarget | null, time: number, touch: boolean) => {
      fromGrip = !!grip && !!target && grip.contains(target as Node);
      isTouch = touch;
      guarded = !fromGrip && openRef.current;
      if (guarded && !atTopRef.current) return false; // 途中を読んでいる。スクロールに任せる
      armed = true;
      dragging = false;
      draggingRef.current = true;
      movedBy = 0;
      startY = y;
      startAt = at.current;
      startTime = time;
      return true;
    };

    /** 戻り値: この動きをシートが引き取ったか（引き取ったらブラウザに渡さない） */
    const moveTo = (y: number): boolean => {
      if (!armed) return false;
      movedBy = y - startY;
      if (!dragging) {
        if (guarded) {
          /**
           * 上へ払った、または払っている間に一覧が動いた＝スクロールの指だった。
           * 0 では諦めない（払い始めの1フレームが同じ座標で来ることがあり、
           * それで諦めると下向きの払いが死んでいた）。
           */
          if (movedBy < -1 || !atTopRef.current) {
            disarm();
            return false;
          }
        }
        const need = isTouch ? START_TOUCH : START_MOUSE;
        if (Math.abs(movedBy) < need) return false;
        dragging = true;
        if (!isTouch && pointer >= 0) {
          try { node.setPointerCapture(pointer); } catch {}
        }
      }
      place(Math.min(travel, Math.max(0, startAt + movedBy)), false);
      return true;
    };

    const end = (y: number, time: number) => {
      if (!armed) return;
      disarm();
      if (dragging) {
        dragging = false;
        const dy = y - startY;
        settle(startAt, dy, dy / Math.max(1, time - startTime));
        return;
      }
      // 動かなかった場合。つまみを押したときだけ開閉を反転させる
      // （面のタップは中のボタンのものなので、ここでは何もしない）
      if (fromGrip) snapTo(startAt === 0 ? travel : 0);
    };

    // --- マウス・ペン。指は下の touch で受けるので、ここでは無視する
    //     （両方で処理すると1回の操作が二重に効く）
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer = e.pointerId;
      begin(e.clientY, e.target, e.timeStamp, false);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      moveTo(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      end(e.clientY, e.timeStamp);
    };

    // --- 指
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return disarm(); // 2本指は拡大等。触らない
      begin(e.touches[0].clientY, e.target, e.timeStamp, true);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return disarm();
      if (moveTo(e.touches[0].clientY) && e.cancelable) {
        // 引き取ったので、ブラウザのスクロールは止める。
        // **最初の1回で呼ぶのが要点。** 始まってから呼んでも効かない
        e.preventDefault();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      end(e.changedTouches[0]?.clientY ?? startY + movedBy, e.timeStamp);
    };

    node.addEventListener('pointerdown', onDown);
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd);
    node.addEventListener('touchcancel', onTouchEnd);
    // 掴んでいる間にページごと動かない。縦は自分で受け、横は端末に任せる
    if (grip) (grip.style as any).touchAction = 'none';
    return () => {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [travel, place, snapTo, settle]);

  // ---- ネイティブ: PanResponder ----
  const pan = useMemo(
    () =>
      WEB
        ? { panHandlers: {} }
        : PanResponder.create({
            /**
             * 縦に動かし始めたときだけ掴む（横のスワイプや軽いタップは邪魔しない）。
             *
             * capture で受けるのは、中の一覧より先に手を挙げないと
             * 一覧が指を取ってしまうため。ただし開いているときは
             * 「一覧が一番上で、下へ払った」ときにしか取らない。
             * そうでなければ一覧のスクロールとして通す。
             */
            onMoveShouldSetPanResponderCapture: (_e, g) => {
              if (Math.abs(g.dy) <= 4 || Math.abs(g.dy) <= Math.abs(g.dx)) return false;
              if (!openRef.current) return true;
              return g.dy > 0 && atTopRef.current;
            },
            onPanResponderGrant: () => {
              anim.stopAnimation((v: number) => { at.current = v; });
            },
            onPanResponderMove: (_e, g) => {
              place(Math.min(travel, Math.max(0, at.current + g.dy)), false);
            },
            onPanResponderRelease: (_e, g) => settle(at.current, g.dy, g.vy),
          }),
    [travel, place, settle, anim]
  );

  const Wrapper: any = WEB ? View : Animated.View;

  return (
    <Wrapper
      ref={sheetRef}
      dataSet={WEB ? { mjsheet: '1', dragging: dragging ? '1' : '0' } : undefined}
      {...pan.panHandlers}
      style={[
        styles.sheet,
        {
          height: expandedHeight,
          /**
           * 色は開閉で変えない。以前は全開で地の色(washi)に切り替えていたが、
           * 開ききった瞬間に紙の色が飛んで見えた（指摘を受けた）。
           * シートは常に「地の上に置かれた紙」のまま。
           * 紙はつまみの帯の下（中身の入れ物）に敷く ―― 器そのものを
           * 塗ると、半透明にしたつまみの帯まで不透明になってしまう
           */
          backgroundColor: 'transparent',
          borderColor: palette.ruleStrong,
          // 全面まで伸びたら角を落として、地の和紙とそのまま一枚になる
          borderTopLeftRadius: open ? 0 : 18,
          borderTopRightRadius: open ? 0 : 18,
          // 色差を控えめにしたので、境目はこの罫が受け持つ
          borderTopWidth: open ? 0 : StyleSheet.hairlineWidth * 2,
        },
        WEB ? { transform: [{ translateY: webY }] } : { transform: [{ translateY: anim }] },
      ]}
    >
      <View style={{ flex: 1, backgroundColor: palette.washiPaper }}>
        <WashiBackground base={palette.washiPaper} />
        <SheetOpenContext.Provider value={open}>
          <SheetScrollContext.Provider value={reportScroll}>{children}</SheetScrollContext.Provider>
        </SheetOpenContext.Provider>

        {/*
          たたんでいる間も中身は普通に押せる。
          以前はここに「触れたら全面に伸ばす膜」を敷いていたが、
          その膜がボタンへのタップを全部飲み込んでいた。
          伸ばしたいときはつまみを掴んでもらう。
        */}
      </View>

      {/* つまみ。**中身の上に半透明で浮かせる**（指定を受けた）――
          帯は列の場所を取らず、中身を下へスクロールすると
          この帯の下を中身がくぐって透けて見える。
          描画順で最後に置き、必ず中身より上に乗せる */}
      <View
        ref={gripRef}
        style={[
          styles.grip,
          { backgroundColor: `${palette.washiPaper}99` },
          WEB ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) : null,
        ]}
      >
        {/* ネイティブは指を置いただけでも開閉できるようにする */}
        <Pressable
          onPress={() => (WEB ? undefined : snapTo(at.current === 0 ? travel : 0))}
          hitSlop={10}
          style={styles.gripHit}
        >
          <View style={[styles.bar, { backgroundColor: palette.ruleStrong }]} />
        </Pressable>
      </View>
    </Wrapper>
  );
}

/**
 * つまみの帯の高さ。帯は中身の上に浮いているので、シートの中身は
 * 先頭にこのぶんの余白を置く（置かないと最初の見出しが帯に隠れる）。
 * スクロールすると中身はこの帯の下をくぐる。
 */
export const SHEET_GRIP_HEIGHT = 44;

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    // 上の地図から浮いて見えるように、影は上向きに落とす
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  // 掴める帯は広めに取る（細いと指が乗らない）
  // つまみは掴む的なので大きく取る。34pxだと指では狙えなかった。
  // 中身の上に浮かせる（SHEET_GRIP_HEIGHT と揃えること）
  grip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    zIndex: 2,
  } as any,
  gripHit: { paddingHorizontal: 60, paddingVertical: 14 },
  bar: { width: 48, height: 5, borderRadius: 3 },
});
