/**
 * シェア用のカード。日本地図を中央に置き、訪れた地点の写真を丸く抜いて
 * その場所に貼る。文字は小さく四隅へ寄せ、地図と写真を主役にする。
 * 書き出し(lib/shareCard.web.ts)と同じ scene を使うので、見えている通りに保存される。
 */
import Svg, {
  Circle, ClipPath, Defs, G, Image as SvgImage, Path, Rect, Text as SvgText,
} from 'react-native-svg';
import { PALETTE } from '@/lib/ugc/layout';
import { buildScene } from '@/lib/ugc/scene';
import { fonts } from '@/lib/theme';

export interface JourneyCardProps {
  width: number;
  title: string;
  dateLabel: string;
  prefectures: number;
  days: number;
  km: number;
  stops: { lat: number; lng: number; image: string }[];
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

      {/* 旅の写真。額縁に入れて地図の上に留める */}
      <Defs>
        {s.frames.map((f, i) => (
          <ClipPath key={i} id={`fr${i}`}>
            <Rect x={f.x} y={f.y} width={f.w} height={f.h} />
          </ClipPath>
        ))}
      </Defs>
      {s.frames.map((f, i) => {
        const b = s.w * 0.016; // 白い縁の太さ
        return (
          <G key={i} transform={`rotate(${f.rotate} ${f.x + f.w / 2} ${f.y + f.h / 2})`}>
            <Rect
              x={f.x - b} y={f.y - b}
              width={f.w + b * 2} height={f.h + b * 2}
              fill={PALETTE.pinRing}
            />
            <SvgImage
              x={f.x} y={f.y} width={f.w} height={f.h}
              href={{ uri: f.uri } as any}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#fr${i})`}
            />
          </G>
        );
      })}

      {/* 四隅の文字 */}
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
