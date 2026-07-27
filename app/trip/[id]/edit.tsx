import { useEffect, useState } from 'react';
import { View, TextInput, Pressable, Switch, StyleSheet, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { DateInput } from '@/components/DateInput';
import { PhotoPicker } from '@/components/PhotoPicker';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { updateTrip, deleteTrip, uploadTripCover } from '@/lib/api';
import { useTrip } from '@/lib/useData';

export default function EditTrip() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);
  const [title, setTitle] = useState(trip?.title ?? '');
  const [start, setStart] = useState(trip?.startDate ?? '');
  const [end, setEnd] = useState(trip?.endDate ?? '');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(trip?.steps[0]?.images[0] ?? null);
  const [ready, setReady] = useState(false);

  // trip loads async — prefill the form once it arrives
  useEffect(() => {
    if (trip && !ready) {
      setTitle(trip.title ?? '');
      setStart(trip.startDate ?? '');
      setEnd(trip.endDate ?? '');
      setIsPublic(trip.visibility === 'public');
      if (!coverPreview) setCoverPreview(trip.steps[0]?.images[0] ?? null);
      setReady(true);
    }
  }, [trip, ready]);

  const pickCover = (files: File[]) => {
    const f = files[0];
    if (f) { setCoverBlob(f); setCoverPreview(URL.createObjectURL(f)); }
  };

  const save = async () => {
    if (id && isSupabaseConfigured) {
      setSaving(true);
      let coverPhotoUrl: string | undefined;
      if (coverBlob) coverPhotoUrl = (await uploadTripCover(id, coverBlob)) ?? undefined;
      await updateTrip(id, {
        title: title.trim() || 'Untitled trip',
        visibility: isPublic ? 'public' : 'private',
        startDate: start || null,
        endDate: end || null,
        coverPhotoUrl,
      });
      setSaving(false);
    }
    router.back();
  };

  const remove = async () => {
    if (id && isSupabaseConfigured) await deleteTrip(id);
    router.replace('/(tabs)/map');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Edit trip" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <Eyebrow>Cover photo</Eyebrow>
        <Gap h={space.sm} />
        <PhotoPicker onPick={pickCover} style={[styles.cover, { backgroundColor: palette.fill, borderColor: palette.ruleStrong }]}>
          {coverPreview ? (
            <Image source={{ uri: coverPreview }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
          ) : null}
          <View style={styles.coverBtn}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <AppText variant="small" style={{ color: '#fff' }}>Change cover</AppText>
          </View>
        </PhotoPicker>

        <Gap h={space.xl} />
        <Eyebrow>Title</Eyebrow>
        <TextInput value={title} onChangeText={setTitle} placeholder="Trip title" placeholderTextColor={palette.inkFaint} style={[styles.titleInput, { color: palette.ink }]} multiline />
        <Rule strong />

        <Gap h={space.xl} />
        <Eyebrow>Dates</Eyebrow>
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
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Ionicons name={isPublic ? 'earth-outline' : 'lock-closed-outline'} size={18} color={isPublic ? palette.matcha : palette.inkSoft} />
            <AppText variant="bodyStrong" tone="ink">Public</AppText>
          </Row>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: palette.matcha, false: palette.rule }} thumbColor="#fff" />
        </Row>

        {/* 画面が詰まっていても最低限の余白が残るようにする */}
        <View style={{ flex: 1, minHeight: space.xxl }} />
        <Button label={saving ? 'Saving…' : 'Save changes'} tone="matcha" onPress={save} disabled={saving} />
        <Gap h={space.sm} />
        <Pressable onPress={remove} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: space.md }]}>
          <Row style={{ justifyContent: 'center', gap: 6 }}>
            <Ionicons name="trash-outline" size={16} color={palette.shu} />
            <AppText variant="bodyStrong" tone="shu">Delete this trip</AppText>
          </Row>
        </Pressable>
        <Gap h={space.sm} />
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, palette }: any) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
      <Gap h={4} />
      <TextInput value={value} onChangeText={onChangeText} placeholder="2026.04.01" placeholderTextColor={palette.inkFaint} style={{ fontFamily: fonts.minchoMedium, fontSize: type.h3, color: palette.ink, paddingVertical: 2 }} />
      <Gap h={space.xs} />
      <Rule strong />
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h1, lineHeight: type.h1 * 1.3, paddingBottom: space.sm, minHeight: 44 },
  cover: { height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: hairline, alignItems: 'center', justifyContent: 'center' },
  coverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
