/**
 * シェア用のカード。
 *
 * 「旅の切り抜きを貼った台紙」に見せる。日本地図を据え、そこへ
 * ポラロイド・地点の丸写真・日付の付箋を貼り、付箋は地点と破線でつなぐ。
 * 下に手書きの便箋を置いて、旅の記録という体裁で締める。
 *
 * 書き出し(lib/shareCard.web.ts)と同じ scene を使うので、
 * 見えている通りに保存される。
 */
import Svg, {
  Circle, ClipPath, Defs, G, Image as SvgImage, Line, Path, Rect, Text as SvgText,
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
  /** ポラロイドに添える地名 */
  coverCaption?: string;
}

export function JourneyCard(props: JourneyCardProps) {
  const s = buildScene({
    width: props.width,
    stops: props.stops,
    visitedPrefectureCodes: props.visitedPrefectureCodes,
    coverCaption: props.coverCaption,
  });
  const { text } = s;
  const w = s.w;
  const stats = [
    [String(props.prefectures), 'pref'],
    [String(props.days), 'days'],
    [props.km.toLocaleString(), 'km'],
  ];
  const border = w * 0.013; // ポラロイドの白い縁

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

      {/* 付箋から地点へ伸びる破線。紙より先に敷いて、紙の下から出ているように見せる */}
      {s.tags.map((t, i) => (
        <Line
          key={`th${i}`}
          x1={t.fromX} y1={t.fromY} x2={t.toX} y2={t.toY}
          stroke={PALETTE.thread}
          strokeWidth={w * 0.004}
          strokeDasharray={`${w * 0.012} ${w * 0.012}`}
          strokeLinecap="round"
        />
      ))}

      <Defs>
        {s.pins.map((p, i) => (
          <ClipPath key={`cp${i}`} id={`pin${i}`}>
            <Circle cx={p.x} cy={p.y} r={p.r} />
          </ClipPath>
        ))}
        {s.frames.map((f, i) => (
          <ClipPath key={`cf${i}`} id={`fr${i}`}>
            <Rect x={f.x} y={f.y} width={f.w} height={f.h} />
          </ClipPath>
        ))}
      </Defs>

      {/* 地点の丸写真 */}
      {s.pins.map((p, i) => (
        <G key={`pin${i}`}>
          <Circle cx={p.x} cy={p.y} r={p.r + p.r * 0.1} fill={PALETTE.note} />
          <SvgImage
            x={p.x - p.r} y={p.y - p.r} width={p.r * 2} height={p.r * 2}
            href={{ uri: p.uri } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#pin${i})`}
          />
        </G>
      ))}

      {/* 日付の付箋 */}
      {s.tags.map((t, i) => (
        <G key={`tag${i}`} transform={`rotate(${t.rotate} ${t.x + t.w / 2} ${t.y + t.h / 2})`}>
          <Rect x={t.x} y={t.y} width={t.w} height={t.h} fill={PALETTE.note} />
          <Rect
            x={t.x} y={t.y} width={t.w} height={t.h}
            fill="none" stroke={PALETTE.noteEdge} strokeWidth={w * 0.002}
          />
          <SvgText
            x={t.x + t.w / 2} y={t.y + t.h * 0.44}
            textAnchor="middle"
            fontFamily={fonts.handBold} fontSize={w * 0.040} fill={PALETTE.noteInk}
          >
            {t.day}
          </SvgText>
          <SvgText
            x={t.x + t.w / 2} y={t.y + t.h * 0.80}
            textAnchor="middle"
            fontFamily={fonts.handRegular} fontSize={w * 0.038} fill={PALETTE.noteInk}
          >
            {t.place}
          </SvgText>
        </G>
      ))}

      {/* ポラロイド。下に余白を残して手書きの地名を入れる */}
      {s.frames.map((f, i) => (
        <G key={`fr${i}`} transform={`rotate(${f.rotate} ${f.x + f.w / 2} ${f.y + f.h / 2})`}>
          <Rect
            x={f.x - border} y={f.y - border}
            width={f.w + border * 2}
            height={f.h + border * 2 + w * 0.062}
            fill={PALETTE.note}
          />
          <SvgImage
            x={f.x} y={f.y} width={f.w} height={f.h}
            href={{ uri: f.uri } as any}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#fr${i})`}
          />
          {!!f.caption && (
            <SvgText
              x={f.x + f.w / 2} y={f.y + f.h + w * 0.050}
              textAnchor="middle"
              fontFamily={fonts.handRegular} fontSize={w * 0.042} fill={PALETTE.noteInk}
            >
              {f.caption}
            </SvgText>
          )}
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

      {/* 下の便箋。罫線を引いて手書きを載せる */}
      <G transform={`rotate(-1.5 ${text.note.x + text.note.w / 2} ${text.note.y + text.note.h / 2})`}>
        <Rect x={text.note.x} y={text.note.y} width={text.note.w} height={text.note.h} fill={PALETTE.note} />
        {text.note.lines.map((line, i) => {
          const y = text.note.y + text.note.h * 0.24 + i * text.note.size * 1.28;
          return (
            <G key={i}>
              <Line
                x1={text.note.x + w * 0.02} y1={y + text.note.size * 0.22}
                x2={text.note.x + text.note.w - w * 0.02} y2={y + text.note.size * 0.22}
                stroke={PALETTE.noteEdge} strokeWidth={w * 0.0015}
              />
              <SvgText
                x={text.note.x + w * 0.035} y={y}
                fontFamily={fonts.handRegular} fontSize={text.note.size} fill={PALETTE.noteInk}
              >
                {line}
              </SvgText>
            </G>
          );
        })}
        <SvgText
          x={text.note.x + w * 0.035}
          y={text.note.y + text.note.h * 0.24 + 3 * text.note.size * 1.28}
          fontFamily={fonts.handBold} fontSize={text.note.size} fill={PALETTE.matcha}
        >
          My Japan
        </SvgText>
      </G>
    </Svg>
  );
}
