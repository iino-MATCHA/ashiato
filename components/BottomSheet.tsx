/**
 * 画面下から出ているシート。
 *
 * 既定では画面の下 1/4 ほどだけ見えていて、つまみを上へスワイプすると
 * ほぼ全面まで伸びる。上の日本地図はそのまま残るので、地図を見ながら
 * 下の中身だけ入れ替えられる。
 *
 * 掴めるのは**つまみの帯だけ**にしてある。中身の一覧まで掴めるようにすると、
 * 一覧をスクロールしたいのかシートを動かしたいのかが取り違えられて、
 * どちらも思い通りに動かなくなる。
 *
 * 掴む処理はWebとネイティブで分けてある。
 * react-native の PanResponder は Web では期待どおりに繋がらず、
 * 実機で確かめたところ**つまみに何のイベントも付かなかった**。
 * Web では View の実体（DOM要素）に直接 pointer イベントを付ける。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/useTheme';

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
  const [open, setOpen] = useState(false);
  const y = useRef(new Animated.Value(travel)).current;
  const at = useRef(travel);
  const gripRef = useRef<View | null>(null);

  const slideTo = (to: number) => {
    at.current = to;
    setOpen(to === 0);
    // Web では useNativeDriver が効かず、寄せる動きが**まったく実行されなかった**
    // （離しても指の位置に取り残され、開いた／閉じたの二か所に収まらない）
    Animated.spring(y, {
      toValue: to,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 2,
      speed: 14,
    }).start();
  };

  useEffect(() => {
    // 画面の大きさが変わったら、いまの状態に合わせて位置を取り直す
    const to = open ? 0 : travel;
    at.current = to;
    y.setValue(to);
  }, [travel]);

  /** 離したときの寄せ先を決める。勢いがあればその向き、無ければ近い方へ */
  const settle = (moved: number, speed: number) => {
    const next = at.current + moved;
    if (speed < -0.4) return slideTo(0);
    if (speed > 0.4) return slideTo(travel);
    slideTo(next < travel / 2 ? 0 : travel);
  };

  // ---- Web: DOM の pointer イベントを直接つける ----
  useEffect(() => {
    if (Platform.OS !== 'web') return;
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
      startTime = e.timeStamp;
      // **走っている動きを止めてから掴む。**
      // 止めずに掴むと、前の寄せのスプリングと指の動きが同時に値を書いて、
      // 離したあと開いた／閉じたのどちらにも収まらなくなる（実測で確認）。
      y.stopAnimation((v: number) => {
        startAt = v;
        at.current = v;
      });
      try { node.setPointerCapture(e.pointerId); } catch {}
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      movedBy = e.clientY - startY;
      y.setValue(Math.min(travel, Math.max(0, startAt + movedBy)));
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const dt = Math.max(1, e.timeStamp - startTime);
      // ほぼ動いていなければタップ扱いで開閉を反転させる
      if (Math.abs(movedBy) < 6) return slideTo(at.current === 0 ? travel : 0);
      settle(movedBy, movedBy / dt);
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    // 掴んでいる間にページごと動かない
    (node.style as any).touchAction = 'none';
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  }, [travel]);

  // ---- ネイティブ: PanResponder ----
  const pan = useMemo(
    () =>
      Platform.OS === 'web'
        ? { panHandlers: {} }
        : PanResponder.create({
            // 縦に動かし始めたときだけ掴む（横のスワイプや軽いタップは邪魔しない）
            onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
            // 走っている動きを止めてから掴む（Webと同じ理由）
            onPanResponderGrant: () => {
              y.stopAnimation((v: number) => { at.current = v; });
            },
            onPanResponderMove: (_e, g) => {
              y.setValue(Math.min(travel, Math.max(0, at.current + g.dy)));
            },
            onPanResponderRelease: (_e, g) => settle(g.dy, g.vy),
          }),
    [travel]
  );

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height: expandedHeight,
          backgroundColor: palette.washi,
          borderColor: palette.rule,
          transform: [{ translateY: y }],
        },
      ]}
    >
      {background}

      {/* つまみ。ここだけが掴める */}
      <View ref={gripRef} {...pan.panHandlers} style={styles.grip}>
        {/* ネイティブでは指を置いただけで反応させたいのでタップも受ける */}
        <Pressable
          onPress={() => (Platform.OS === 'web' ? undefined : slideTo(at.current === 0 ? travel : 0))}
          hitSlop={10}
          style={styles.gripHit}
        >
          <View style={[styles.bar, { backgroundColor: palette.ruleStrong }]} />
        </Pressable>
        {header}
      </View>

      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
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
