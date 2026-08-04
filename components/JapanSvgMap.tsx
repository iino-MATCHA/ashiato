/**
 * SVG map of Japan (47 prefectures). Used to visualise which prefectures have
 * been visited — for the goshuin page header and UGC creation.
 * Regular slippy maps use Mapbox; this is a static shape map for the "coverage" view.
 * Paths adapted from the search_onmap project (viewBox 0 0 860 830).
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Text as SvgText, Rect } from 'react-native-svg';
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID, PREFECTURE_ID_BY_SLUG, slugForName } from '@/lib/prefectures';
import { okinawaOffset, contentHeight, pathBox } from '@/lib/ugc/geo';
import { fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const VB_W = 860;
const VB_H = 830;

/**
 * 訪問済み判定。要素は都道府県ID(number, 1..47)・都道府県名・slug のいずれでも可。
 * SVGは Prefecture_master の id と紐付く（id→slug は lib/prefectures）。
 */
function toSlugSet(visited: Iterable<string | number>): Set<string> {
  const s = new Set<string>();
  for (const v of visited) {
    if (typeof v === 'number') {
      const slug = PREFECTURE_SLUG_BY_ID[v];
      if (slug) s.add(slug);
    } else if (v) {
      s.add(slugForName(v));
    }
  }
  return s;
}

/** #RRGGBB → rgba(). コロプレスの濃淡に使う。 */
function withAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(3)})`;
}

export function JapanSvgMap({
  visited,
  width = 320,
  tint,
  onToggle,
  emptyFill,
  strokeFill,
  hideOkinawa = false,
  okinawaInset = false,
  intensity,
}: {
  /** 都道府県ID(1..47) / 名前 / slug の配列またはSet */
  visited: Set<string | number> | Array<string | number>;
  width?: number;
  tint?: string;
  /** 指定すると各県がタップ可能になり、prefecture_code を返す */
  onToggle?: (prefectureCode: number) => void;
  /** 「まだ行っていない県」の塗り。常に明るい地に置くLPなどで、テーマに寄らず固定したいとき */
  emptyFill?: string;
  /** 県境の色。シェアカードのようにテーマに寄らせたくない場所で指定する */
  strokeFill?: string;
  /** 表示地図から沖縄を除外する */
  hideOkinawa?: boolean;
  /** 沖縄を千葉の下のインセットとして表示する（小さくOKINAWAラベルつき） */
  okinawaInset?: boolean;
  /** コロプレス表示: prefecture_code → 0..1 の濃さ（管理画面の分析で使用） */
  intensity?: Record<number, number>;
}) {
  const { palette } = useTheme();
  const set = toSlugSet(visited);
  // インセット時は沖縄を下げた分だけ版面が縦に伸びる
  const vbH = okinawaInset ? contentHeight() : VB_H;
  const height = (width * vbH) / VB_W;
  const fillVisited = tint ?? palette.matcha;
  const oki = okinawaInset ? okinawaOffset() : null;
  const okiBox = okinawaInset ? pathBox(PREFECTURE_PATHS.okinawa) : null;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${vbH}`}>
        {Object.entries(PREFECTURE_PATHS).map(([slug, d]) => {
          const isOki = slug === 'okinawa';
          if (hideOkinawa && isOki && !okinawaInset) return null;
          const on = set.has(slug);
          let fill = on ? fillVisited : (emptyFill ?? palette.mapEmpty);
          if (intensity) {
            // 0 は無着色、1 に近づくほど濃く。薄い側でも見えるよう 0.12 を下限に。
            const v = intensity[PREFECTURE_ID_BY_SLUG[slug]] ?? 0;
            fill = v > 0 ? withAlpha(fillVisited, 0.12 + v * 0.88) : (emptyFill ?? palette.mapEmpty);
          }
          const path = (
            <Path
              key={slug}
              d={d}
              fill={fill}
              // 県境は塗りに関わらず同じ太さ・色で常に見えるようにする
              stroke={strokeFill ?? palette.inkFaint}
              strokeWidth={0.8}
              strokeLinejoin="round"
              opacity={1}
              onPress={onToggle ? () => onToggle(PREFECTURE_ID_BY_SLUG[slug]) : undefined}
            />
          );
          // 沖縄はSVG上では房総沖に浮いて見えるので、千葉の下へ移して置く
          if (isOki && okinawaInset && oki) {
            return (
              <G key={slug} transform={`translate(${oki.dx} ${oki.dy})`}>
                {path}
                {/* 沖縄は細長くて狙いにくいので、見えない当たり判定を島の周りに敷く */}
                {onToggle && okiBox && (
                  <Rect
                    x={okiBox.minX - 22}
                    y={okiBox.minY - 22}
                    width={okiBox.maxX - okiBox.minX + 44}
                    height={okiBox.maxY - okiBox.minY + 44}
                    fill="transparent"
                    onPress={() => onToggle(PREFECTURE_ID_BY_SLUG.okinawa)}
                  />
                )}
              </G>
            );
          }
          return path;
        })}
        {okinawaInset && oki && okiBox && (
          <SvgText
            x={okiBox.maxX + oki.dx + 14}
            y={(okiBox.minY + okiBox.maxY) / 2 + oki.dy + 5}
            fontSize={15}
            fontFamily={fonts.gothicMedium}
            letterSpacing={2}
            fill={palette.inkFaint}
          >
            OKINAWA
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

/** Derive visited prefecture slugs from trips + acquired goshuin. */
export function visitedSlugs(
  tripPrefectureNames: string[],
  goshuinPrefectureNames: string[]
): Set<string> {
  const s = new Set<string>();
  [...tripPrefectureNames, ...goshuinPrefectureNames].forEach((n) =>
    s.add(n.toLowerCase())
  );
  return s;
}
