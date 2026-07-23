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
import { useTheme } from '@/lib/useTheme';

const VB_W = 860;
const VB_H = 830;

export function JapanSvgMap({
  visited,
  width = 320,
  tint,
}: {
  /** prefecture slugs that count as visited (e.g. 'kyoto', 'tokyo') */
  visited: Set<string> | string[];
  width?: number;
  tint?: string;
}) {
  const { palette } = useTheme();
  const set = visited instanceof Set ? visited : new Set(visited);
  const height = (width * VB_H) / VB_W;
  const fillVisited = tint ?? palette.shu;

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
