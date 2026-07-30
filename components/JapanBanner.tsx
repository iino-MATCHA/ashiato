/**
 * /map の最上段。回る地球儀の代わりに置く、和紙のバナー。
 *
 * - 動くものは何も置かない（発熱対策の続き）。「浮いている」は
 *   傾きと影で見せる。アニメーションはしない
 * - **暗いテーマでもここだけは和紙**。旅の記録は紙の上、という見立てなので
 *   地の色は明所の和紙で固定し、地図の色も明所のもので固定する
 * - 一枚の紙に日本地図を刷り、斜めに浮かせて下に影を落とす。
 *   後ろに二枚目の紙を覗かせ、右下に朱印と「N / 47」を置く
 */
import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { fonts } from '@/lib/theme';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { useI18n } from '@/lib/i18n';

/** 和紙の面。テーマに寄らず固定（このバナーだけは常に紙） */
const WASHI = '#F7F4EB';
const RULE = '#E3DECE';
const PAPER = '#FFFDF8';
const PAPER_BACK = '#EFEAD9';
const MATCHA = '#69AF00';
const EMPTY = '#ECE8DB';
const SHU = '#C4432B';

export function JapanBanner({
  visited,
  width,
}: {
  /** 訪れた都道府県コード */
  visited: number[];
  width: number;
}) {
  const { t } = useI18n();
  const paperW = Math.min(width - 72, 330);
  const mapW = paperW - 44;
  const paperH = mapW * 0.97 + 58; // 地図 + 下段（朱印と数）のぶん

  return (
    <View
      style={{
        backgroundColor: WASHI,
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: RULE,
        overflow: 'hidden',
      }}
    >
      <AppText style={{ fontFamily: fonts.gothicMedium, fontSize: 10, letterSpacing: 4, color: '#A29B8B' }}>
        {t('banner.eyebrow')}
      </AppText>
      <View style={{ height: 18 }} />

      <View style={{ width: paperW + 40, height: paperH + 26, alignItems: 'center' }}>
        {/* 影。紙より先に描いて下に敷く。ぼかしの代わりに楕円を重ねる */}
        <Svg
          width={paperW + 40}
          height={44}
          viewBox={`0 0 ${paperW + 40} 44`}
          style={{ position: 'absolute', bottom: -8, left: 0 }}
        >
          <Ellipse cx={(paperW + 40) / 2} cy={22} rx={paperW * 0.46} ry={15} fill="#3A3427" opacity={0.05} />
          <Ellipse cx={(paperW + 40) / 2} cy={22} rx={paperW * 0.38} ry={11} fill="#3A3427" opacity={0.08} />
          <Ellipse cx={(paperW + 40) / 2} cy={22} rx={paperW * 0.28} ry={7} fill="#3A3427" opacity={0.12} />
        </Svg>

        {/* 後ろの紙。少しだけ逆に傾けて、重なりを見せる */}
        <View
          style={{
            position: 'absolute',
            top: 16,
            width: paperW,
            height: paperH,
            backgroundColor: PAPER_BACK,
            borderRadius: 10,
            transform: [{ perspective: 900 }, { rotateX: '7deg' }, { rotateZ: '2.4deg' }],
          }}
        />

        {/* 表の紙。斜めに浮かせる */}
        <View
          style={{
            width: paperW,
            height: paperH,
            backgroundColor: PAPER,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#EEE9DA',
            paddingTop: 18,
            alignItems: 'center',
            transform: [{ perspective: 900 }, { rotateX: '8deg' }, { rotateZ: '-2.2deg' }],
            // Webでは box-shadow、ネイティブでは shadow* が効く
            shadowColor: '#2A2417',
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 14 },
          }}
        >
          <JapanSvgMap visited={visited} width={mapW} okinawaInset tint={MATCHA} emptyFill={EMPTY} />

          {/* 下段: 集めた数と、右下の朱印 */}
          <View
            style={{
              position: 'absolute',
              left: 18,
              right: 16,
              bottom: 12,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 24, color: '#1B1815' }}>
                {visited.length}
              </AppText>
              <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: 11, color: '#8F887A' }}>/ 47</AppText>
            </View>
            {/* 朱印。枠だけの円に「旅」 */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 2,
                borderColor: SHU,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '8deg' }],
                opacity: 0.9,
              }}
            >
              <AppText style={{ fontFamily: fonts.brush, fontSize: 17, color: SHU, lineHeight: 20 }}>旅</AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
