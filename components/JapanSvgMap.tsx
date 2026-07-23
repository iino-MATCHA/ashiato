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
import { PREFECTURE_SLUG_BY_ID, slugForName } from '@/lib/prefectures';
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

export function JapanSvgMap({
  visited,
  width = 320,
  tint,
}: {
  /** 都道府県ID(1..47) / 名前 / slug の配列またはSet */
  visited: Set<string | number> | Array<string | number>;
  width?: number;
  tint?: string;
}) {
  const { palette } = useTheme();
  const set = toSlugSet(visited);
  const height = (width * VB_H) / VB_W;
  const fillVisited = tint ?? palette.matcha;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {Object.entries(PREFECTURE_PATHS).map(([slug, d]) => {
          const on = set.has(slug);
          return (
            <Path
              key={slug}
              d={d}
              fill={on ? fillVisited : palette.fill}
              stroke={on ? fillVisited : palette.ruleStrong}
              strokeWidth={on ? 0.6 : 0.5}
              opacity={on ? 1 : 0.9}
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
