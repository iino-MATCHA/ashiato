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
}: {
  /** たたんだときに見えている高さ */
  collapsedHeight: number;
  /** 伸ばしきったときの高さ */
  expandedHeight: number;
  children: React.ReactNode;
  /** 全面まで開いているかを外へ知らせる（戻る矢印の出し分けに使う） */
  onOpenChange?: (open: boolean) => void;
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
      if (speed < -0.22) return snapTo(0);
      if (speed > 0.22) return snapTo(travel);
      snapTo(from + moved < travel / 2 ? 0 : travel);
    },
    [snapTo, travel]
  );

  // ---- Web: シートの DOM に pointer イベントを直接つける ----
  useEffect(() => {
    if (!WEB) return;
    const node = sheetRef.current as unknown as HTMLElement | null;
    const grip = gripRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;

    const START = 6; // ここを超えて初めて「掴んだ」と見なす（下の値はタップ）

    let startY = 0;
    let startAt = 0;
    let startTime = 0;
    let armed = false;    // 指が乗っている
    let dragging = false; // 実際に動かし始めた
    let fromGrip = false;
    let movedBy = 0;
    let pointer = -1;

    const down = (e: PointerEvent) => {
      fromGrip = !!grip && !!e.target && grip.contains(e.target as Node);
      // 開いているときに面から始めると中のスクロールと喧嘩する。
      // つまみからだけ受ける。たたんでいるときは中が動かないので、どこでもよい
      if (!fromGrip && openRef.current) return;
      armed = true;
      dragging = false;
      draggingRef.current = true;
      movedBy = 0;
      startY = e.clientY;
      startAt = at.current;
      startTime = e.timeStamp;
      pointer = e.pointerId;
    };

    const move = (e: PointerEvent) => {
      if (!armed) return;
      movedBy = e.clientY - startY;
      if (!dragging) {
        // まだタップかもしれない間は動かさない。中のボタンを押せなくなる
        if (Math.abs(movedBy) < START) return;
        dragging = true;
        try { node.setPointerCapture(pointer); } catch {}
      }
      place(Math.min(travel, Math.max(0, startAt + movedBy)), false);
    };

    const up = (e: PointerEvent) => {
      if (!armed) return;
      armed = false;
      draggingRef.current = false;
      if (dragging) {
        dragging = false;
        settle(startAt, movedBy, movedBy / Math.max(1, e.timeStamp - startTime));
        return;
      }
      // 動かなかった場合。つまみを押したときだけ開閉を反転させる
      // （面のタップは中のボタンのものなので、ここでは何もしない）
      if (fromGrip) snapTo(startAt === 0 ? travel : 0);
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    // 掴んでいる間にページごと動かない。縦は自分で受け、横は端末に任せる
    if (grip) (grip.style as any).touchAction = 'none';
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
      ref={sheetRef}
      dataSet={WEB ? { mjsheet: '1', dragging: dragging ? '1' : '0' } : undefined}
      style={[
        styles.sheet,
        {
          height: expandedHeight,
          /**
           * たたんでいるときは「地の上に置かれた紙」。
           * 全面まで伸びたら、他の画面と同じ地の色にして馴染ませる
           * （ここだけ紙色のままだと、タブを移った瞬間に色が飛ぶ）。
           */
          backgroundColor: open ? palette.washi : palette.washiPaper,
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
      {/* 和紙。明るいテーマでも暗いテーマでも紙に見えるようにする */}
      <WashiBackground base={open ? palette.washi : palette.washiPaper} />

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

      <View style={{ flex: 1 }}>
        <SheetOpenContext.Provider value={open}>{children}</SheetOpenContext.Provider>

        {/*
          たたんでいる間も中身は普通に押せる。
          以前はここに「触れたら全面に伸ばす膜」を敷いていたが、
          その膜がボタンへのタップを全部飲み込んでいた。
          伸ばしたいときはつまみを掴んでもらう。
        */}
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
  // つまみは掴む的なので大きく取る。34pxだと指では狙えなかった
  grip: { height: 44, alignItems: 'center', justifyContent: 'center', cursor: 'grab' } as any,
  gripHit: { paddingHorizontal: 60, paddingVertical: 14 },
  bar: { width: 48, height: 5, borderRadius: 3 },
});
