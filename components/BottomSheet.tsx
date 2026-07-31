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
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/useTheme';

const WEB = Platform.OS === 'web';

/**
 * シートが全面まで開いているか。
 * 中身の一覧は「開いているときだけ」スクロールさせたいので、
 * 各ペインがこれを見て scrollEnabled を決める。
 */
const SheetOpenContext = createContext(false);
export const useSheetOpen = () => useContext(SheetOpenContext);

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
  background,
  header,
}: {
  /** たたんだときに見えている高さ */
  collapsedHeight: number;
  /** 伸ばしきったときの高さ */
  expandedHeight: number;
  children: React.ReactNode;
  /** 敷きたい背景（和紙など）。無ければ紙色 */
  background?: React.ReactNode;
  /** つまみの帯に重ねて置くもの（戻る矢印など） */
  header?: React.ReactNode;
}) {
  const { palette } = useTheme();
  const travel = Math.max(0, expandedHeight - collapsedHeight);
  injectSheetCss();

  const [open, setOpen] = useState(false);
  const at = useRef(travel); // いまの下げ幅（0 = 全面、travel = たたんだ状態）
  const gripRef = useRef<View | null>(null);
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
      setOpen(px === 0);
    },
    [place]
  );

  // 画面の大きさが変わったら、いまの状態に合わせて置き直す
  useEffect(() => {
    place(open ? 0 : travel, false);
  }, [travel, place]);

  /** 離したときの寄せ先。勢いがあればその向き、無ければ近い方へ */
  const settle = useCallback(
    (from: number, moved: number, speed: number) => {
      if (speed < -0.4) return snapTo(0);
      if (speed > 0.4) return snapTo(travel);
      snapTo(from + moved < travel / 2 ? 0 : travel);
    },
    [snapTo, travel]
  );

  // ---- Web: つまみの DOM に pointer イベントを直接つける ----
  useEffect(() => {
    if (!WEB) return;
    const node = gripRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;

    let startY = 0;
    let startAt = 0;
    let startTime = 0;
    let dragging = false;
    let movedBy = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      movedBy = 0;
      startY = e.clientY;
      startAt = at.current;
      startTime = e.timeStamp;
      try { node.setPointerCapture(e.pointerId); } catch {}
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      movedBy = e.clientY - startY;
      place(Math.min(travel, Math.max(0, startAt + movedBy)), false);
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      // ほとんど動いていなければタップ扱いで開閉を反転させる
      if (Math.abs(movedBy) < 6) return snapTo(startAt === 0 ? travel : 0);
      settle(startAt, movedBy, movedBy / Math.max(1, e.timeStamp - startTime));
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    (node.style as any).touchAction = 'none'; // 掴んでいる間にページごと動かない
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  }, [travel, place, snapTo, settle]);

  // ---- ネイティブ: PanResponder ----
  const pan = useMemo(
    () =>
      WEB
        ? { panHandlers: {} }
        : PanResponder.create({
            // 縦に動かし始めたときだけ掴む（横のスワイプや軽いタップは邪魔しない）
            onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
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
      dataSet={WEB ? { mjsheet: '1', dragging: dragging ? '1' : '0' } : undefined}
      style={[
        styles.sheet,
        { height: expandedHeight, backgroundColor: palette.sheet, borderColor: palette.ruleStrong },
        WEB ? { transform: [{ translateY: webY }] } : { transform: [{ translateY: anim }] },
      ]}
    >
      {background}

      {/* つまみ。ここだけが掴める */}
      <View ref={gripRef} {...pan.panHandlers} style={styles.grip}>
        {/* ネイティブは指を置いただけでも開閉できるようにする */}
        <Pressable
          onPress={() => (WEB ? undefined : snapTo(at.current === 0 ? travel : 0))}
          hitSlop={10}
          style={styles.gripHit}
        >
          <View style={[styles.bar, { backgroundColor: palette.ruleStrong }]} />
        </Pressable>
      </View>

      {/*
        つまみに重ねるもの（戻る矢印）は、つまみの**外**に置く。
        中に入れると、つまみが pointer を捕まえてしまってこちらのタップが
        届かない（実機で「＜が効かない」が出た）。
      */}
      {header}

      <View style={{ flex: 1 }}>
        <SheetOpenContext.Provider value={open}>{children}</SheetOpenContext.Provider>

        {/*
          たたんでいる間は、中身に触れた時点で全面に伸ばす。
          触れた指をそのまま中身のボタンへ通すと、伸びながら別の画面へ
          飛んでしまうので、**最初のひと触りは受け止めるだけ**にする。
          伸びたあとはこの膜が消えるので、二度目からは普通に押せる。
        */}
        {!open && (
          <Pressable onPress={() => snapTo(0)} style={StyleSheet.absoluteFill} accessibilityLabel="expand" />
        )}
      </View>
    </Wrapper>
  );
}

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
  grip: { height: 34, alignItems: 'center', justifyContent: 'center', cursor: 'grab' } as any,
  gripHit: { paddingHorizontal: 40, paddingVertical: 10 },
  bar: { width: 42, height: 4, borderRadius: 2 },
});
