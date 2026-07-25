import { useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { JapanSvgMap } from '@/components/JapanSvgMap';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { saveVisitedPrefectures } from '@/lib/api';
import { PREFECTURE_EN_BY_ID } from '@/lib/prefectures';

export default function PrefectureOnboarding() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (code: number) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const start = async () => {
    if (isSupabaseConfigured) {
      setSaving(true);
      await saveVisitedPrefectures(Array.from(selected));
      setSaving(false);
    }
    router.replace('/(tabs)/map');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Gap h={space.lg} />
        <Eyebrow tone="matcha">WELCOME</Eyebrow>
        <Gap h={space.sm} />
        <AppText variant="h1" tone="ink">Where have you{'\n'}been in Japan?</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="inkSoft">Tap every prefecture you’ve already visited. We’ll mark them on your map from day one.</AppText>

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
      </ScrollView>

      <View style={{ padding: space.lg }}>
        <Rule />
        <Gap h={space.md} />
        <Button label={saving ? 'Saving…' : selected.size ? `Start with ${selected.size} prefectures` : 'Start with a blank map'} tone="matcha" onPress={start} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}
