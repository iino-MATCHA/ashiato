import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { Header } from '@/components/Header';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { hairline } from '@/lib/theme';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { saveVisitedPrefectures, fetchUserPrefectures } from '@/lib/api';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';
import { AutoTripModal } from '@/components/AutoTripModal';
import { useI18n } from '@/lib/i18n';

export default function PrefectureOnboarding() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  // 都道府県を保存したあと、写真から旅を起こすかを聞く（初回のみ）
  const [askAuto, setAskAuto] = useState(false);
  const baseW = Math.min(width - space.lg * 2, 420);

  // when re-editing, preload what's already saved
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchUserPrefectures().then((codes) => alive && setSelected(new Set(codes))).catch(() => {});
    return () => { alive = false; };
  }, []);

  const toggle = (code: number) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const start = async () => {
    setError(null);
    if (isSupabaseConfigured) {
      setSaving(true);
      const ok = await saveVisitedPrefectures(Array.from(selected));
      setSaving(false);
      if (!ok) {
        setError(t('prefs.saveFailed'));
        return;
      }
    }
    if (isEdit && router.canGoBack()) return router.back();
    // 初回だけ、地図の選択のあとに写真の話をする。
    // ここで閉じる／断ると /map へ進む（AutoTripModal の onClose）
    setAskAuto(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={isEdit ? ['top', 'bottom'] : ['top', 'bottom']}>
      {isEdit && <><Header title={t('prefs.header')} /><Rule /></>}
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Gap h={space.lg} />
        <Eyebrow tone="matcha">{isEdit ? t('common.edit') : t('prefs.welcome')}</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="h1" tone="ink">{t('prefs.title')}</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="inkSoft">{t('prefs.lead')}</AppText>

        <Gap h={space.lg} />
        <Row style={{ justifyContent: 'flex-end', gap: space.sm, marginBottom: space.sm }}>
          <Pressable onPress={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} style={[styles.zoomBtn, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="remove" size={20} color={palette.ink} />
          </Pressable>
          <Pressable onPress={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))} style={[styles.zoomBtn, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={20} color={palette.ink} />
          </Pressable>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={zoom > 1} contentContainerStyle={{ minWidth: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {/* 沖縄もインセットで選択できるようにする（以前は非表示で選べなかった） */}
          <JapanSvgMap visited={selected} onToggle={toggle} width={baseW * zoom} okinawaInset />
        </ScrollView>

        <Gap h={space.md} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="small" tone="inkFaint">{t('prefs.selected')}</AppText>
          <AppText variant="h3" tone="matcha">{selected.size} / 47</AppText>
        </Row>
        <Gap h={space.xs} />
        <AppText variant="small" tone="inkFaint" numberOfLines={2}>
          {Array.from(selected).map((c) => PREFECTURE_EN_BY_ID[c]).filter(Boolean).join(' · ') || t('prefs.noneYet')}
        </AppText>
        {!!error && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{error}</AppText></>)}
      </ScrollView>

      <View style={{ padding: space.lg }} pointerEvents="box-none">
        <Rule />
        <Gap h={space.md} />
        <Button
          label={
            saving ? t('common.saving')
              : isEdit ? t('common.save')
              : selected.size ? t('prefs.startWith', { n: selected.size })
              : t('prefs.startBlank')
          }
          tone="matcha"
          onPress={start}
          disabled={saving}
        />
      </View>

      {/* 「旅してますか？」→ 写真選択 → 読込 → 「見ますか？」 */}
      <AutoTripModal visible={askAuto} onClose={() => { setAskAuto(false); router.replace('/(tabs)/map'); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  zoomBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
});
