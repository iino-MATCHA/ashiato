import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTrip } from '@/lib/api';

export default function NewTrip() {
  const { palette } = useTheme();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isPublic, setIsPublic] = useState(false); // private (default) or public
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (isSupabaseConfigured) {
      setSaving(true);
      const id = await createTrip({
        title: title.trim() || 'Untitled trip',
        visibility: isPublic ? 'public' : 'private',
        startDate: start ? start.replace(/\./g, '-') : undefined,
        endDate: end ? end.replace(/\./g, '-') : undefined,
      });
      setSaving(false);
      if (id) return router.replace(`/trip/${id}`);
    }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header closeIcon title="New Trip" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <TextInput placeholder="Trip title" placeholderTextColor={palette.inkFaint} value={title} onChangeText={setTitle} style={[styles.titleInput, { color: palette.ink }]} multiline />
        <Rule strong />

        <Gap h={space.xl} />
        <Eyebrow>Dates</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md, alignItems: 'flex-end' }}>
          <DateField label="Start" value={start} onChangeText={setStart} palette={palette} />
          <Ionicons name="arrow-forward" size={16} color={palette.inkFaint} style={{ marginBottom: 14 }} />
          <DateField label="End" value={end} onChangeText={setEnd} palette={palette} />
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Visibility</Eyebrow>
        <Gap h={space.md} />
        <Row style={[styles.toggle, { borderColor: palette.rule }]}>
          <ToggleOption label="Private" active={!isPublic} onPress={() => setIsPublic(false)} palette={palette} />
          <ToggleOption label="Public" active={isPublic} onPress={() => setIsPublic(true)} palette={palette} />
        </Row>
        <Gap h={space.sm} />
        <Row style={{ gap: 6 }}>
          <Ionicons name={isPublic ? 'earth-outline' : 'lock-closed-outline'} size={14} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            {isPublic
              ? 'Public — shown in Explore for everyone.'
              : 'Private — only you. Your friends can still see it on their feed.'}
          </AppText>
        </Row>
      </View>

      <View style={{ padding: space.lg }}>
        <Button label={saving ? 'Creating…' : 'Start the trip'} tone="matcha" onPress={create} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}

function ToggleOption({ label, active, onPress, palette }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleOpt, active && { backgroundColor: palette.matcha }]}>
      <AppText variant="bodyStrong" style={{ color: active ? '#fff' : palette.inkSoft }}>{label}</AppText>
    </Pressable>
  );
}

function DateField({ label, value, onChangeText, palette }: any) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
      <Gap h={4} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="2026.07.28"
        placeholderTextColor={palette.inkFaint}
        style={{ fontFamily: fonts.minchoMedium, fontSize: type.h3, color: palette.ink, paddingVertical: 2 }}
      />
      <Gap h={space.xs} />
      <Rule strong />
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h1, lineHeight: type.h1 * 1.3, paddingBottom: space.sm, minHeight: 44 },
  toggle: { borderWidth: hairline * 2, borderRadius: 10, padding: 3 },
  toggleOpt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
});
