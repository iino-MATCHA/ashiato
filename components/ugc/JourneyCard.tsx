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
import { PALETTE, PHOTO, approxTextWidth } from '@/lib/ugc/layout';
import { buildScene, type SceneStop } from '@/lib/ugc/scene';
import { fonts } from '@/lib/theme';

/** 題が版面からはみ出すときだけ字を小さくする（canvas 側の fitText と同じ考え方）。 */
/**
 * 入りきらない題を縮める。下限は元の 0.45 倍。
 * 0.6 で止めていたときは「Two weeks in Kyoto only」のような長い題が
 * 書き出し側で切れた。旅の題は札の主役なので、小さくなっても
 * 最後まで出す方を採る（canvas 側と同じ式・同じ下限）。
 */
function fitTitleSize(title: string, size: number, maxW: number): number {
  // CJKは全角、それ以外はおよそ0.55em で見積もる
  let em = 0;
  for (const ch of title) em += /[⺀-鿿豈-﫿＀-￯　-ヿ]/.test(ch) ? 1 : 0.55;
  const w = em * size;
  return w <= maxW ? size : Math.max(size * 0.45, (size * maxW) / w);
}

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

      <Defs>
        {s.pins.map((p, i) => (
          <ClipPath key={`cp${i}`} id={`pin${i}`}>
            <Circle cx={p.x} cy={p.y} r={p.r} />
          </ClipPath>
        ))}
        {s.photos.map((p, i) => (
          <ClipPath key={`pcp${i}`} id={`photo${i}`}>
            <Rect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} rx={p.radius} />
          </ClipPath>
        ))}
      </Defs>

      {/* 地の模様になる大判写真。**地図より下**に敷き、薄く沈めて
          題と数字を邪魔しない（以前は地図の上に明るいまま置いていた） */}
      {s.photos.map((p, i) => (
        <G key={`photo${i}`} transform={`translate(${p.cx} ${p.cy}) rotate(${p.rot})`} opacity={PHOTO.opacity}>
          <SvgImage
            x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h}
            href={{ uri: p.uri } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#photo${i})`}
          />
        </G>
      ))}

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
        fontFamily={fonts.minchoBold}
        fontSize={fitTitleSize(props.title, text.title.size, text.title.maxW)}
        fill={PALETTE.ink}
      >
        {props.title}
      </SvgText>

      {/* 数字は大きく、単位は小さく添える。幅は見積もりで流す */}
      {(() => {
        const { size, labelSize } = text.stats;
        let x = text.stats.x;
        return stats.map(([value, label]) => {
          const vx = x;
          const lx = vx + approxTextWidth(value, size) + size * 0.14;
          x = lx + label.length * labelSize * 0.62 + size * 0.5;
          return (
            <G key={label}>
              <SvgText x={vx} y={text.stats.y} fontFamily={fonts.minchoBold} fontSize={size} fill={PALETTE.ink}>
                {value}
              </SvgText>
              <SvgText x={lx} y={text.stats.y} fontFamily={fonts.gothicRegular} fontSize={labelSize} fill={PALETTE.inkFaint}>
                {label}
              </SvgText>
            </G>
          );
        });
      })()}
    </Svg>
  );
}
