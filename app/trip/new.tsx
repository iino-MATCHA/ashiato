import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { DateInput } from '@/components/DateInput';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTrip } from '@/lib/api';

export default function NewTrip() {
  const { palette } = useTheme();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(''); // YYYY-MM-DD
  const [end, setEnd] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && start.length > 0;

  const create = async () => {
    if (!canSave) return;
    if (isSupabaseConfigured) {
      setSaving(true);
      const id = await createTrip({
        title: title.trim(),
        visibility: isPublic ? 'public' : 'private',
        startDate: start,
        endDate: end || undefined,
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
        <Row style={{ gap: 6 }}>
          <Eyebrow>Dates</Eyebrow>
          <AppText variant="small" tone="shu">*</AppText>
        </Row>
        <Gap h={space.md} />
        <Row style={{ gap: space.lg, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">Start</AppText>
            <Gap h={4} />
            <DateInput value={start} onChange={setStart} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>
          <Ionicons name="arrow-forward" size={16} color={palette.inkFaint} style={{ marginBottom: 12 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">End</AppText>
            <Gap h={4} />
            <DateInput value={end} onChange={setEnd} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Visibility</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm }}>
          <VisBtn label="Private" active={!isPublic} onPress={() => setIsPublic(false)} palette={palette} />
          <VisBtn label="Public" active={isPublic} onPress={() => setIsPublic(true)} palette={palette} />
        </Row>
        <Gap h={space.sm} />
        <Row style={{ gap: 6 }}>
          <Ionicons name={isPublic ? 'earth-outline' : 'lock-closed-outline'} size={14} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            {isPublic ? 'Public — shown in Explore for everyone.' : 'Private — only you. Friends can still see it on their feed.'}
          </AppText>
        </Row>
      </View>

      <View style={{ padding: space.lg }}>
        {!canSave && <><AppText variant="small" tone="inkFaint" center>Add a title and a start date to continue.</AppText><Gap h={space.sm} /></>}
        <Button label={saving ? 'Creating…' : 'Start the trip'} tone="matcha" onPress={create} disabled={!canSave || saving} />
      </View>
    </SafeAreaView>
  );
}

function VisBtn({ label, active, onPress, palette }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.visBtn, { borderColor: active ? palette.matcha : palette.ruleStrong }, active && { backgroundColor: palette.matcha }]}>
      <AppText variant="bodyStrong" style={{ color: active ? '#fff' : palette.inkSoft }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h1, lineHeight: type.h1 * 1.3, paddingBottom: space.sm, minHeight: 44 },
  visBtn: { paddingHorizontal: space.xl, paddingVertical: 10, borderRadius: 999, borderWidth: hairline * 2 },
});
