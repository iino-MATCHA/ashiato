/**
 * 立ち寄り先1つぶんのシェアカード。
 *
 * 旅のカードは旅が終わらないと作れないが、これは旅の途中で何度でも作れる。
 * ほとんどの人は旅全体ではなく写真1枚を貼るので、発行のきっかけが桁で多い。
 *
 * 構図は「写真が主役、文字は下の帯」。地図は出さない ―― 1地点の話に
 * 日本全体の地図を添えても、どこの話なのかはかえって伝わらない。
 * 代わりに県名と地名を大きく置く。
 */
import Svg, {
  ClipPath, Defs, G, Image as SvgImage, Rect, Text as SvgText,
} from 'react-native-svg';
import { PALETTE } from '@/lib/ugc/layout';
import { wrapText } from '@/lib/ugc/wrap';
import { fonts } from '@/lib/theme';
import { SITE_HOST } from '@/lib/site';

export interface StopCardProps {
  width: number;
  /** 写真。無ければ地の色だけの札になる */
  image: string;
  /** 立ち寄り先の題（利用者が書いたもの） */
  title: string;
  /** 市区町村 */
  place: string;
  /** 都道府県 */
  prefecture: string;
  /** 2026.04.04 のような短い表記 */
  dateLabel: string;
}

export function StopCard(props: StopCardProps) {
  const w = props.width;
  const h = w * (16 / 9);
  const m = w * 0.085;

  // 写真は上から下へ、文字の帯を残して敷く
  const photoTop = h * 0.11;
  const photoH = h * 0.62;

  const t = {
    eyebrow: w * 0.026,
    pref: w * 0.030,
    title: w * 0.062,
    place: w * 0.030,
    mark: w * 0.026,
  };

  // 題は2行まで。1行に収まらないものが普通にある
  const titleLines = wrapText(props.title, t.title, w - m * 2, 2);

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect x={0} y={0} width={w} height={h} fill={PALETTE.paper} />

      <Defs>
        <ClipPath id="stopPhoto">
          <Rect x={m} y={photoTop} width={w - m * 2} height={photoH} />
        </ClipPath>
      </Defs>

      {/* 写真。白い縁をつけて、地から一枚浮かせる */}
      <G>
        <Rect
          x={m - w * 0.012}
          y={photoTop - w * 0.012}
          width={w - m * 2 + w * 0.024}
          height={photoH + w * 0.024}
          fill={PALETTE.pinRing}
        />
        {props.image ? (
          <SvgImage
            x={m}
            y={photoTop}
            width={w - m * 2}
            height={photoH}
            href={{ uri: props.image } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#stopPhoto)"
          />
        ) : (
          <Rect x={m} y={photoTop} width={w - m * 2} height={photoH} fill={PALETTE.paperEdge} />
        )}
      </G>

      {/* 上の帯 */}
      <SvgText
        x={m} y={m * 0.95}
        fontFamily={fonts.gothicMedium} fontSize={t.eyebrow}
        fill={PALETTE.inkFaint} letterSpacing={t.eyebrow * 0.4}
      >
        MY JAPAN
      </SvgText>
      <SvgText
        x={w - m} y={m * 0.95} textAnchor="end"
        fontFamily={fonts.gothicRegular} fontSize={t.eyebrow} fill={PALETTE.inkFaint}
      >
        {props.dateLabel}
      </SvgText>

      {/* 下の帯。県名 → 題 → 地名の順に読ませる */}
      <SvgText
        x={m} y={photoTop + photoH + w * 0.10}
        fontFamily={fonts.gothicMedium} fontSize={t.pref}
        fill={PALETTE.matcha} letterSpacing={t.pref * 0.22}
      >
        {props.prefecture.toUpperCase()}
      </SvgText>
      {titleLines.map((line, i) => (
        <SvgText
          key={i}
          x={m} y={photoTop + photoH + w * 0.19 + i * t.title * 1.25}
          fontFamily={fonts.minchoBold} fontSize={t.title} fill={PALETTE.ink}
        >
          {line}
        </SvgText>
      ))}
      <SvgText
        x={m} y={photoTop + photoH + w * 0.255 + (titleLines.length - 1) * t.title * 1.25}
        fontFamily={fonts.gothicRegular} fontSize={t.place} fill={PALETTE.inkSoft}
      >
        {props.place}
      </SvgText>

      <SvgText
        x={m} y={h - m * 0.7}
        fontFamily={fonts.gothicRegular} fontSize={t.mark} fill={PALETTE.inkFaint}
      >
        {SITE_HOST.replace(/^www\./, '')}
      </SvgText>
    </Svg>
  );
}
