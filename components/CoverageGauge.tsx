/**
 * 制覇ゲージ。
 *
 * 通常時は「19/47」の下に縦の細いゲージ（下から満ちていく）。
 * タップすると暗いフィルターがかかり、そのゲージが元の位置から
 * 下端を軸に90度倒れて画面上部の「日本全国」の行に着地する。
 * 続いて北海道・東北・関東…のゲージが右から順に入ってくる。
 * フィルターをタップすると元に戻る。
 */
import { useRef, useState } from 'react';
import { View, Modal, Pressable, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { AppText, Row, Gap } from '@/components/ui';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

/** ゲージの寸法。縦のときの長さ＝横になったときの長さ（回転だけで済ませる） */
const LEN = 132;
const THICK = 7;

export interface Region { key: string; label: string; codes: number[] }

/** 地方区分（JISコード順） */
export const REGIONS: Region[] = [
  { key: 'hokkaido', label: '北海道', codes: [1] },
  { key: 'tohoku', label: '東北', codes: [2, 3, 4, 5, 6, 7] },
  { key: 'kanto', label: '関東', codes: [8, 9, 10, 11, 12, 13, 14] },
  { key: 'chubu', label: '中部', codes: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  { key: 'kinki', label: '近畿', codes: [24, 25, 26, 27, 28, 29, 30] },
  { key: 'chugoku', label: '中国', codes: [31, 32, 33, 34, 35] },
  { key: 'shikoku', label: '四国', codes: [36, 37, 38, 39] },
  { key: 'kyushu', label: '九州・沖縄', codes: [40, 41, 42, 43, 44, 45, 46, 47] },
];

/**
 * 全国のゲージの溝。満ちる部分は明るい黄緑で固定だが、溝は地の色に合わせる。
 * 明るい地では黒、暗い地では生成り寄りの白
 * （黒地に黒い溝で、ゲージそのものが見えなくなっていた）。
 */
const TRACK_LIGHT = '#1B1815';
const TRACK_DARK = 'rgba(237,233,224,0.85)';
const GREEN_TOP = '#9BE33F';

/** 地方のゲージ。上から下へ順に薄くしていく */
const GREENS = ['#3F7500', '#4E8C00', '#5CA000', '#69AF00', '#7ABE24', '#8CCB47', '#9FD86B', '#B2E58F'];

export function CoverageGauge({
  visitedCodes,
  total = 47,
}: {
  visitedCodes: number[];
  total?: number;
}) {
  const { palette, scheme } = useTheme();
  const track = scheme === 'dark' ? TRACK_DARK : TRACK_LIGHT;
  const { t } = useI18n();
  const { width: winW, height: winH } = useWindowDimensions();
  const visited = new Set(visitedCodes);
  const overall = visitedCodes.length / total;

  const [open, setOpen] = useState(false);
  const barRef = useRef<View | null>(null);
  // 縦ゲージの画面上の位置（回転アニメの開始点に使う）
  const from = useRef({ x: winW / 2, y: winH / 2 });

  // 0 = 元の位置で縦, 1 = 上部で横
  const flip = useRef(new Animated.Value(0)).current;
  // 各地方の入場（右から）
  const rows = useRef(REGIONS.map(() => new Animated.Value(0))).current;
  const veil = useRef(new Animated.Value(0)).current;

  const openPanel = () => {
    barRef.current?.measureInWindow((x, y) => {
      from.current = { x, y };
      setOpen(true);
      flip.setValue(0);
      veil.setValue(0);
      rows.forEach((r) => r.setValue(0));
      Animated.sequence([
        Animated.parallel([
          Animated.timing(veil, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(flip, {
            toValue: 1,
            duration: 620,
            easing: Easing.bezier(0.2, 0.7, 0.2, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.stagger(
          70,
          rows.map((r) =>
            Animated.timing(r, {
              toValue: 1,
              duration: 460,
              easing: Easing.bezier(0.2, 0.7, 0.2, 1),
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(veil, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 0, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ...rows.map((r) => Animated.timing(r, { toValue: 0, duration: 200, useNativeDriver: true })),
    ]).start(({ finished }) => finished && setOpen(false));
  };

  // パネルの版面
  // 画面が狭いと「ラベル + ゲージ + 数値」が版面をはみ出すので、
  // ゲージ長も含めて画面幅から決め直し、必ず中央に収める
  const labelW = winW < 380 ? 62 : 78;
  const tailW = 46; // 右端の "3/6" ぶん
  const gaugeLen = Math.min(LEN, winW - space.lg * 2 - labelW - tailW);
  const panelW = Math.min(winW - space.lg * 2, labelW + gaugeLen + tailW);
  const panelLeft = (winW - panelW) / 2;
  const gaugeX = panelLeft + labelW;      // 横ゲージの左端
  const topY = winH * 0.2;                // 「日本全国」行のY
  const rowGap = 44;

  // 縦ゲージは下端が軸。回転後に左端が gaugeX、上端が topY に来るよう逆算する
  const startX = from.current.x;
  const startY = from.current.y;
  const tx = flip.interpolate({ inputRange: [0, 1], outputRange: [0, gaugeX - startX] });
  const ty = flip.interpolate({ inputRange: [0, 1], outputRange: [0, topY - (startY + LEN)] });
  const rot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] });
  // 画面が狭いと横ゲージが LEN より短くなるので、倒れながら長さも合わせる
  const lenScale = flip.interpolate({ inputRange: [0, 1], outputRange: [1, gaugeLen / LEN] });

  return (
    <>
      {/* --- 通常時の縦ゲージ --- */}
      <Pressable onPress={openPanel} hitSlop={14} style={{ alignItems: 'center' }}>
        {/* 溝は白地に白だと消えてしまうので、必ず見える色と縁をつける */}
        <View
          ref={barRef}
          style={[styles.track, { height: LEN, backgroundColor: track }]}
        >
          <View style={[styles.fill, { height: `${Math.max(3, overall * 100)}%`, backgroundColor: GREEN_TOP }]} />
        </View>
        <Gap h={6} />
        <AppText variant="small" tone="inkFaint" style={{ fontSize: 9, letterSpacing: 1.2 }}>
          {t('goshuin.byRegion')}
        </AppText>
      </Pressable>

      {/* --- 展開後 --- */}
      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,14,10,0.86)', opacity: veil }]} />

          {/* 元の位置から倒れてくるゲージ（＝日本全国） */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: startX,
              top: startY,
              width: THICK,
              height: LEN,
              transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }, { scaleY: lenScale }],
              // 下端を軸に倒す
              transformOrigin: 'bottom left' as any,
            }}
          >
            <View style={[styles.track, { height: LEN, backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <View style={[styles.fill, { height: `${Math.max(3, overall * 100)}%`, backgroundColor: GREEN_TOP }]} />
            </View>
          </Animated.View>

          {/* 日本全国の見出しと数値 */}
          <Animated.View style={{ position: 'absolute', left: panelLeft, top: topY - 30, width: panelW, opacity: veil }}>
            <AppText style={{ fontFamily: fonts.gothicMedium, fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.6)' }}>
              {t('goshuin.allJapan')}
            </AppText>
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute', left: panelLeft, top: topY - 6, width: panelW,
              flexDirection: 'row', alignItems: 'center', opacity: veil,
            }}
          >
            <View style={{ width: labelW }} />
            <View style={{ width: gaugeLen }} />
            <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 20, color: '#fff', marginLeft: space.sm }}>
              {Math.round(overall * 100)}%
            </AppText>
          </Animated.View>

          {/* 地方ごと（右から順に入る） */}
          {REGIONS.map((r, i) => {
            const got = r.codes.filter((c) => visited.has(c)).length;
            const ratio = got / r.codes.length;
            const y = topY + rowGap + i * rowGap;
            const anim = rows[i];
            return (
              <Animated.View
                key={r.key}
                style={{
                  position: 'absolute',
                  left: panelLeft,
                  top: y,
                  width: panelW,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: anim,
                  transform: [
                    { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [winW * 0.55, 0] }) },
                  ],
                }}
              >
                <AppText
                  style={{ width: labelW, fontFamily: fonts.minchoBold, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}
                  numberOfLines={1}
                >
                  {r.label}
                </AppText>
                <View style={[styles.hTrack, { width: gaugeLen }]}>
                  <View style={[styles.hFill, { width: `${Math.max(2, ratio * 100)}%`, backgroundColor: GREENS[i % GREENS.length] }]} />
                </View>
                <AppText
                  style={{ marginLeft: space.sm, fontFamily: fonts.gothicRegular, fontSize: 11, color: 'rgba(255,255,255,0.66)' }}
                >
                  {got}/{r.codes.length}
                </AppText>
              </Animated.View>
            );
          })}

        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // 縦: 下から満ちる
  track: { width: THICK, borderRadius: THICK / 2, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: THICK / 2 },
  // 横: 左から満ちる
  hTrack: { height: THICK, borderRadius: THICK / 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.16)' },
  hFill: { height: '100%', borderRadius: THICK / 2 },
});
