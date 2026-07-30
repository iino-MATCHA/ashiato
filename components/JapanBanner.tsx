/**
 * /map の最上段。回る地球儀の代わりに置く、静かな和紙のバナー。
 *
 * - 常時レンダリングを止めるため、動くものは何も置かない（発熱対策の続き）
 * - **暗いテーマでもここだけは和紙**。旅の記録は紙の上、という見立てなので
 *   地の色は明所の和紙で固定し、地図の色も明所のもので固定する
 * - 訪れた県を塗り、その上に旅のルート線を重ねる。
 *   まだ旅が無い人には、渡されたサンプルの旅を線にして見せる
 */
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { fonts } from '@/lib/theme';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { VB_W, contentHeight, project } from '@/lib/ugc/geo';
import type { Trip } from '@/lib/mock';
import { useI18n } from '@/lib/i18n';

/** 和紙の面。テーマに寄らず固定（このバナーだけは常に紙） */
const WASHI = '#F7F4EB';
const RULE = '#E3DECE';
const MATCHA = '#69AF00';
const EMPTY = '#ECE8DB';

export function JapanBanner({
  visited,
  trips,
  width,
}: {
  /** 訪れた都道府県コード */
  visited: number[];
  /** ルート線にする旅（無ければ線は引かない）。サンプルを渡してもよい */
  trips: Trip[];
  width: number;
}) {
  const { t } = useI18n();
  const mapW = Math.min(width - 48, 340);
  const vbH = contentHeight();
  const mapH = (mapW * vbH) / VB_W;

  // 旅ごとに、地点を撮った順で線にする（最大4本まで。多いと網になる）
  const routes = trips
    .slice(0, 4)
    .map((tr) => tr.steps.filter((s) => s.lat && s.lng).map((s) => project(s.lat, s.lng)))
    .filter((pts) => pts.length >= 2);

  return (
    <View style={{ backgroundColor: WASHI, alignItems: 'center', paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: RULE }}>
      <AppText style={{ fontFamily: fonts.gothicMedium, fontSize: 10, letterSpacing: 4, color: '#A29B8B' }}>
        {t('banner.eyebrow')}
      </AppText>
      <View style={{ height: 10 }} />
      <View style={{ width: mapW, height: mapH }}>
        <JapanSvgMap visited={visited} width={mapW} okinawaInset tint={MATCHA} emptyFill={EMPTY} />
        {/* ルート線。地図と同じ viewBox を絶対配置で重ねる */}
        {routes.length > 0 && (
          <View style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
            <Svg width={mapW} height={mapH} viewBox={`0 0 ${VB_W} ${vbH}`}>
              {routes.map((pts, i) => (
                <Polyline
                  key={i}
                  points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#2B4257"
                  strokeWidth={3.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 10"
                  opacity={0.85}
                />
              ))}
              {routes.flat().map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={5} fill="#C4432B" stroke={WASHI} strokeWidth={2} />
              ))}
            </Svg>
          </View>
        )}
      </View>
    </View>
  );
}
