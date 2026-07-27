/**
 * SVG map of Japan (47 prefectures). Used to visualise which prefectures have
 * been visited — for the goshuin page header and UGC creation.
 * Regular slippy maps use Mapbox; this is a static shape map for the "coverage" view.
 * Paths adapted from the search_onmap project (viewBox 0 0 860 830).
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PREFECTURE_PATHS } from '@/lib/mappath';
import { PREFECTURE_SLUG_BY_ID, PREFECTURE_ID_BY_SLUG, slugForName } from '@/lib/prefectures';
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
  hideOkinawa = false,
  intensity,
}: {
  /** 都道府県ID(1..47) / 名前 / slug の配列またはSet */
  visited: Set<string | number> | Array<string | number>;
  width?: number;
  tint?: string;
  /** 指定すると各県がタップ可能になり、prefecture_code を返す */
  onToggle?: (prefectureCode: number) => void;
  /** 表示地図から沖縄を除外する */
  hideOkinawa?: boolean;
  /** コロプレス表示: prefecture_code → 0..1 の濃さ（管理画面の分析で使用） */
  intensity?: Record<number, number>;
}) {
  const { palette } = useTheme();
  const set = toSlugSet(visited);
  const height = (width * VB_H) / VB_W;
  const fillVisited = tint ?? palette.matcha;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {Object.entries(PREFECTURE_PATHS).map(([slug, d]) => {
          if (hideOkinawa && slug === 'okinawa') return null;
          const on = set.has(slug);
          let fill = on ? fillVisited : palette.fill;
          if (intensity) {
            // 0 は無着色、1 に近づくほど濃く。薄い側でも見えるよう 0.12 を下限に。
            const v = intensity[PREFECTURE_ID_BY_SLUG[slug]] ?? 0;
            fill = v > 0 ? withAlpha(fillVisited, 0.12 + v * 0.88) : palette.fill;
          }
          return (
            <Path
              key={slug}
              d={d}
              fill={fill}
              // 県境は塗りに関わらず同じ太さ・色で常に見えるようにする
              stroke={palette.inkFaint}
              strokeWidth={0.8}
              strokeLinejoin="round"
              opacity={1}
              onPress={onToggle ? () => onToggle(PREFECTURE_ID_BY_SLUG[slug]) : undefined}
            />
          );
        })}
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
