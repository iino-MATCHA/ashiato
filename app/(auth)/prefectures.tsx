import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { saveVisitedPrefectures, fetchUserPrefectures } from '@/lib/api';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

export default function PrefectureOnboarding() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('Could not save. Make sure you are signed in and migration 0003 has been run.');
        return;
      }
    }
    if (isEdit && router.canGoBack()) router.back();
    else router.replace('/(tabs)/map');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Gap h={space.lg} />
        <Eyebrow tone="matcha">{isEdit ? 'EDIT' : 'WELCOME'}</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="h1" tone="ink">Where have you{'\n'}been in Japan?</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="inkSoft">Tap every prefecture you’ve already visited. We’ll mark them on your map and goshuin book.</AppText>

        <Gap h={space.lg} />
        <View style={{ alignItems: 'center' }}>
          <JapanSvgMap visited={selected} onToggle={toggle} width={Math.min(width - space.lg * 2, 420)} />
        </View>

        <Gap h={space.md} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="small" tone="inkFaint">Selected</AppText>
          <AppText variant="h3" tone="matcha">{selected.size} / 47</AppText>
        </Row>
        <Gap h={space.xs} />
        <AppText variant="small" tone="inkFaint" numberOfLines={2}>
          {Array.from(selected).map((c) => PREFECTURE_EN_BY_ID[c]).filter(Boolean).join(' · ') || 'None yet'}
        </AppText>
        {!!error && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{error}</AppText></>)}
      </ScrollView>

      <View style={{ padding: space.lg }}>
        <Rule />
        <Gap h={space.md} />
        <Button
          label={saving ? 'Saving…' : isEdit ? 'Save' : selected.size ? `Start with ${selected.size} prefectures` : 'Start with a blank map'}
          tone="matcha"
          onPress={start}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
}
