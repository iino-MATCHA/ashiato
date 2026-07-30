import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { rankFor } from '@/components/RankModal';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useVisitedPrefectures } from '@/lib/useData';
import { PREFECTURE_TOTAL } from '@/lib/mock';
import { exportJapanCard } from '@/lib/japanCard';
import { shareImage, type ShareTarget } from '@/lib/shareImage';
import { captureCard } from '@/lib/cardShot';
import { CountUp } from '@/components/CountUp';
import { CopyLink } from '@/components/CopyLink';
import { currentUserId } from '@/lib/api';

import { useI18n } from '@/lib/i18n';
export default function GoshuinShare() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const { codes: visited } = useVisitedPrefectures();
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<ShareTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // ネイティブはこのビューを写し取って画像にする
  const cardRef = useRef<View | null>(null);
  // 自分のプロフィールのURL。ここからそのまま貼れるようにする
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    currentUserId().then((uid) => {
      if (alive && uid) setProfileUrl(`https://www.my-japan-matcha.com/friends/${uid}`);
    });
    return () => { alive = false; };
  }, []);
  const count = visited.length;
  const pct = Math.round((count / PREFECTURE_TOTAL) * 100);

  const cardW = Math.min(width - space.lg * 2, (height - 260) * 9 / 16, 340);
  const cardH = (cardW * 16) / 9;

  // カードは画面より小さいので、共通の型スケールをそのまま使うと文字が大きすぎる。
  // 幅に対する比率で決め直し、主役の「%」だけを大きく残す。
  const f = {
    eyebrow: cardW * 0.029,
    pct: cardW * 0.15,
    pctUnit: cardW * 0.034,
    label: cardW * 0.026,
    rank: cardW * 0.043,
    count: cardW * 0.072,
    countUnit: cardW * 0.030,
    mark: cardW * 0.040,
  };

  const cardMeta = () => ({
    percent: pct,
    count,
    total: PREFECTURE_TOTAL,
    rank: rankFor(count),
    visitedCodes: visited,
  });

  /**
   * カードを画像にして、そのままSNSへ渡す。
   * Web は Canvas で 1080px に描き直し、ネイティブは画面のカードを写し取る。
   */
  const share = async (to: ShareTarget) => {
    if (busy) return;
    setBusy(to);
    setNotice(null);
    const dataUrl = (await captureCard(cardRef)) ?? (await exportJapanCard(cardMeta()));
    const text = `I've visited ${count}/47 prefectures of Japan (${pct}%) — ${rankFor(count)} on My Japan #myjapan`;
    const res = dataUrl
      ? await shareImage(to, dataUrl, text, `my-japan-${count}of${PREFECTURE_TOTAL}.png`)
      : 'failed';
    setBusy(null);
    // 共有シートが使えない環境では画像を保存して投稿画面を開くので、その旨を伝える
    if (res === 'downloaded') setNotice(t('share.savedThenAttach'));
    else if (res === 'failed') setNotice(t('share.failed'));
  };

  // プレビューと同じ構成を 1080×1920 で描き直して1枚のPNGにする
  const download = async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || saving) return;
    setSaving(true);
    const dataUrl = await exportJapanCard(cardMeta());
    setSaving(false);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `my-japan-${count}of${PREFECTURE_TOTAL}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('share.cardHeader')} />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View ref={cardRef} collapsable={false} style={[styles.card, { width: cardW, height: cardH, backgroundColor: palette.paper, borderColor: palette.rule }]}>
          <AppText
            style={{ fontFamily: fonts.gothicMedium, fontSize: f.eyebrow, letterSpacing: f.eyebrow * 0.28 }}
            tone="matcha"
          >
            MY JAPAN
          </AppText>
          <Gap h={space.xs} />
          <Row style={{ alignItems: 'baseline', gap: 5 }}>
            <CountUp
              value={pct}
              format={(n: number) => `${n}%`}
              style={{ fontFamily: fonts.minchoBold, fontSize: f.pct, lineHeight: f.pct * 1.06 }}
              tone="ink"
            />
            <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.pctUnit }} tone="inkFaint">of Japan</AppText>
          </Row>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <JapanSvgMap visited={visited} width={cardW - space.lg * 2} hideOkinawa />
          </View>

          {/* 幅を明示しないと両端が寄って文字が重なる */}
          <Row style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.sm }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText
                style={{ fontFamily: fonts.gothicMedium, fontSize: f.label, letterSpacing: f.label * 0.22 }}
                tone="inkFaint"
              >
                RANK
              </AppText>
              <AppText
                style={{ fontFamily: fonts.minchoBold, fontSize: f.rank }}
                tone="matcha"
                numberOfLines={1}
              >
                {rankFor(count)}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <Row style={{ alignItems: 'baseline', gap: 3 }}>
                <AppText style={{ fontFamily: fonts.minchoBold, fontSize: f.count }} tone="ink">{count}</AppText>
                <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.countUnit }} tone="inkFaint">/ 47</AppText>
              </Row>
              <AppText style={{ fontFamily: fonts.gothicRegular, fontSize: f.label }} tone="inkFaint">prefectures</AppText>
            </View>
          </Row>
          <Gap h={space.sm} />
          <AppText style={[styles.mark, { fontSize: f.mark }]} tone="inkFaint">My Japan</AppText>
        </View>

        <Gap h={space.lg} />
        {profileUrl && (
          <>
            <CopyLink url={profileUrl} />
            <Gap h={space.md} />
          </>
        )}
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label={saving ? t('common.saving') : t('common.save')} onPress={download} palette={palette} />
          <ExportBtn icon="logo-instagram" label={busy === 'instagram' ? '…' : 'Stories'} onPress={() => share('instagram')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label={busy === 'x' ? '…' : 'X'} onPress={() => share('x')} palette={palette} color={palette.ink} />
        </Row>
        {!!notice && (
          <>
            <Gap h={space.md} />
            <AppText variant="small" tone="inkFaint" center style={{ maxWidth: 300, lineHeight: 19 }}>{notice}</AppText>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function ExportBtn({ icon, label, onPress, palette, color }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignItems: 'center', opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.exportCircle, { borderColor: palette.ruleStrong }]}>
        <Ionicons name={icon} size={22} color={color ?? palette.ink} />
      </View>
      <Gap h={4} />
      <AppText variant="small" tone="inkSoft">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // alignItems: 'center' を入れると子が内容幅に縮み、下段の両端揃えが効かなくなる
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  mark: { fontFamily: fonts.minchoBold, alignSelf: 'center', opacity: 0.45 },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
