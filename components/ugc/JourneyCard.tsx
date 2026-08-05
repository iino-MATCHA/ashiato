/**
 * シェア用のカード。
 *
 * 日本地図を据え、行った場所の写真を丸くして地図の上に置くだけ。
 * 文字は上に集めてあるので、地図は下いっぱいまで使える。
 *
 * 書き出し(lib/shareCard.web.ts)と同じ scene を使うので、
 * 見えている通りに保存される。
 */
import Svg, {
  Circle, ClipPath, Defs, G, Image as SvgImage, Path, Rect, Text as SvgText,
} from 'react-native-svg';
import { PALETTE } from '@/lib/ugc/layout';
import { buildScene, type SceneStop } from '@/lib/ugc/scene';
import { fonts } from '@/lib/theme';

export interface JourneyCardProps {
  width: number;
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: SceneStop[];
  visitedPrefectureCodes: number[];
}

export function JourneyCard(props: JourneyCardProps) {
  const s = buildScene({
    width: props.width,
    stops: props.stops,
    visitedPrefectureCodes: props.visitedPrefectureCodes,
  });
  const { text } = s;
  const stats = [
    [String(props.prefectures), 'pref'],
    [String(props.days), 'days'],
    [props.km.toLocaleString(), 'km'],
  ];

  return (
    <Svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
      <Rect x={0} y={0} width={s.w} height={s.h} fill={PALETTE.paper} />

      {/* 日本地図 */}
      <G transform={`translate(${s.map.tx} ${s.map.ty}) scale(${s.map.scale})`}>
        {s.paths.map((p, i) => (
          <G key={i} transform={p.okinawa ? `translate(${s.okinawa.dx} ${s.okinawa.dy})` : undefined}>
            <Path
              d={p.d}
              fill={p.visited ? PALETTE.landVisited : PALETTE.land}
              stroke={PALETTE.border}
              strokeWidth={1 / s.map.scale}
              strokeLinejoin="round"
            />
          </G>
        ))}
      </G>

      <Defs>
        {s.pins.map((p, i) => (
          <ClipPath key={`cp${i}`} id={`pin${i}`}>
            <Circle cx={p.x} cy={p.y} r={p.r} />
          </ClipPath>
        ))}
      </Defs>

      {/* 地点の丸写真。縁を敷いて、県の塗りから切り離す */}
      {s.pins.map((p, i) => (
        <G key={`pin${i}`}>
          <Circle cx={p.x} cy={p.y} r={p.r + p.r * 0.1} fill={PALETTE.pinRing} />
          <SvgImage
            x={p.x - p.r} y={p.y - p.r} width={p.r * 2} height={p.r * 2}
            href={{ uri: p.uri } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#pin${i})`}
          />
        </G>
      ))}

      {/* 上の帯 */}
      <SvgText
        x={text.eyebrow.x} y={text.eyebrow.y}
        fontFamily={fonts.gothicMedium} fontSize={text.eyebrow.size}
        fill={PALETTE.inkFaint} letterSpacing={text.eyebrow.size * 0.4}
      >
        MY JAPAN
      </SvgText>
      <SvgText
        x={text.dates.x} y={text.dates.y} textAnchor="end"
        fontFamily={fonts.gothicRegular} fontSize={text.dates.size} fill={PALETTE.inkFaint}
      >
        {props.dateLabel}
      </SvgText>

      <SvgText
        x={text.title.x} y={text.title.y}
        fontFamily={fonts.minchoBold} fontSize={text.title.size} fill={PALETTE.ink}
      >
        {props.title}
      </SvgText>
      <SvgText
        x={text.subtitle.x} y={text.subtitle.y}
        fontFamily={fonts.handRegular} fontSize={text.subtitle.size} fill={PALETTE.matcha}
      >
        A journey of memories
      </SvgText>

      {stats.map(([value, label], i) => {
        const x = text.stats.x + i * text.stats.gap * 2.1;
        return (
          <G key={label}>
            <SvgText x={x} y={text.stats.y} fontFamily={fonts.minchoBold} fontSize={text.stats.size} fill={PALETTE.ink}>
              {value}
            </SvgText>
            <SvgText
              x={x + text.stats.size * (value.length * 0.62 + 0.35)} y={text.stats.y}
              fontFamily={fonts.gothicRegular} fontSize={text.stats.size * 0.72} fill={PALETTE.inkFaint}
            >
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
