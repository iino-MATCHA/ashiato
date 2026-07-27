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
  authorName: string;
  avatarUrl?: string;
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

      {/* 地点の写真（丸抜き） */}
      <Defs>
        {s.pins.map((p, i) => (
          <ClipPath key={i} id={`pin${i}`}>
            <Circle cx={p.x} cy={p.y} r={p.r} />
          </ClipPath>
        ))}
      </Defs>
      {s.pins.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={p.r + p.r * 0.09} fill={PALETTE.pinRing} />
          <SvgImage
            x={p.x - p.r}
            y={p.y - p.r}
            width={p.r * 2}
            height={p.r * 2}
            href={{ uri: p.uri } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#pin${i})`}
          />
          <Circle cx={p.x} cy={p.y} r={p.r} fill="none" stroke={PALETTE.border} strokeWidth={0.5} />
        </G>
      ))}

      {/* 四隅の文字 */}
      <SvgText
        x={text.eyebrow.x} y={text.eyebrow.y}
        fontFamily={fonts.gothicMedium} fontSize={text.eyebrow.size}
        fill={PALETTE.inkFaint} letterSpacing={text.eyebrow.size * 0.4}
      >
        ASHIATO
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

      {/* 投稿者 */}
      <Defs>
        <ClipPath id="avatar">
          <Circle cx={text.author.cx} cy={text.author.cy} r={text.author.r} />
        </ClipPath>
      </Defs>
      <Circle cx={text.author.cx} cy={text.author.cy} r={text.author.r} fill={PALETTE.paperEdge} />
      {!!props.avatarUrl && (
        <SvgImage
          x={text.author.cx - text.author.r}
          y={text.author.cy - text.author.r}
          width={text.author.r * 2}
          height={text.author.r * 2}
          href={{ uri: props.avatarUrl } as any}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#avatar)"
        />
      )}
      <Circle cx={text.author.cx} cy={text.author.cy} r={text.author.r} fill="none" stroke={PALETTE.border} strokeWidth={1} />
      <SvgText
        x={text.author.cx} y={text.author.nameY} textAnchor="middle"
        fontFamily={fonts.gothicMedium} fontSize={text.author.size} fill={PALETTE.inkSoft}
      >
        {props.authorName}
      </SvgText>
    </Svg>
  );
}
