import { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { searchPlaces, resolvePlace, createStep, type PlaceHit } from '@/lib/api';
import type { Step } from '@/lib/mock';

interface SelectedPlace {
  title: string;
  subtitle: string;
  municipalityCode: number;
  prefectureCode?: number;
}

export function StepEditor({ step, tripId }: { step?: Step; tripId?: string }) {
  const { palette } = useTheme();
  const editing = Boolean(step);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<SelectedPlace | null>(
    step ? { title: step.placeName, subtitle: step.prefectureName, municipalityCode: 0 } : null
  );
  const [when, setWhen] = useState(step?.loggedAt ?? '');
  const [title, setTitle] = useState(step?.title ?? '');
  const [note, setNote] = useState(step?.note ?? '');
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // debounced place search
  useEffect(() => {
    if (place) return; // already chosen
    const q = query.trim();
    if (q.length < 1) { setHits([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchPlaces(q);
      setHits(r);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, place]);

  const choose = async (h: PlaceHit) => {
    let prefectureCode = h.prefectureCode;
    if (prefectureCode == null) {
      const resolved = await resolvePlace(h.municipalityCode);
      prefectureCode = resolved?.prefectureCode;
      setPlace({ title: h.title, subtitle: resolved?.prefectureEn ?? h.subtitle, municipalityCode: h.municipalityCode, prefectureCode });
    } else {
      setPlace({ title: h.title, subtitle: h.subtitle, municipalityCode: h.municipalityCode, prefectureCode });
    }
    if (!title) setTitle(h.title);
    setQuery('');
    setHits([]);
  };

  // web-only photo picker (compression happens on upload)
  const addPhotos = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      const next = files.slice(0, 10).map((f) => ({ blob: f as Blob, url: URL.createObjectURL(f) }));
      setPhotos((cur) => [...cur, ...next].slice(0, 10));
    };
    input.click();
  };

  const save = async () => {
    if (tripId && place?.municipalityCode && place.prefectureCode && isSupabaseConfigured) {
      setSaving(true);
      await createStep({
        tripId,
        title: title.trim() || place.title,
        note: note.trim(),
        municipalityCode: place.municipalityCode,
        prefectureCode: place.prefectureCode,
        loggedAt: (when || '2026-01-01').replace(/\./g, '-'),
        transport: 'train',
        photoBlobs: photos.map((p) => p.blob),
      });
      setSaving(false);
    }
    router.back();
  };

  const canSave = editing || (!!place && (!isSupabaseConfigured || !!place.prefectureCode));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title={editing ? 'Edit stop' : 'Add stop'}
        right={<Pressable onPress={save} hitSlop={10} disabled={!canSave || saving}><AppText variant="bodyStrong" tone={canSave ? 'matcha' : 'inkFaint'}>{saving ? '…' : 'Save'}</AppText></Pressable>}
      />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 1) WHERE — search */}
        <Eyebrow tone="matcha">Where did you go?</Eyebrow>
        <Gap h={space.sm} />
        {place ? (
          <Row style={[styles.selected, { borderColor: palette.matcha }]}>
            <Ionicons name="location" size={18} color={palette.matcha} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{place.title}</AppText>
              {!!place.subtitle && <AppText variant="small" tone="inkFaint">{place.subtitle}</AppText>}
            </View>
            <Pressable onPress={() => setPlace(null)} hitSlop={8}><Ionicons name="close-circle" size={20} color={palette.inkFaint} /></Pressable>
          </Row>
        ) : (
          <>
            <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
              <Ionicons name="search" size={18} color={palette.inkFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search a place or area (not a prefecture)"
                placeholderTextColor={palette.inkFaint}
                style={[styles.searchInput, { color: palette.ink }]}
                autoCapitalize="none"
              />
              {searching && <ActivityIndicator size="small" color={palette.inkFaint} />}
            </Row>
            {hits.map((h) => (
              <Pressable key={h.key} onPress={() => choose(h)} style={styles.hit}>
                <Ionicons name="location-outline" size={16} color={palette.aiSoft} />
                <View style={{ flex: 1 }}>
                  <AppText variant="body" tone="ink">{h.title}</AppText>
                  {!!h.subtitle && <AppText variant="small" tone="inkFaint">{h.subtitle}</AppText>}
                </View>
              </Pressable>
            ))}
            {!isSupabaseConfigured && (
              <AppText variant="small" tone="inkFaint" style={{ marginTop: space.sm }}>
                Connect Supabase (env) to search municipalities_master / tourism_area_master.
              </AppText>
            )}
          </>
        )}

        {/* 2) WHEN */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">When did you go?</Eyebrow>
        <Gap h={space.sm} />
        <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="calendar-outline" size={18} color={palette.inkFaint} />
          <TextInput value={when} onChangeText={setWhen} placeholder="2026.04.01" placeholderTextColor={palette.inkFaint} style={[styles.searchInput, { color: palette.ink }]} />
        </Row>

        {/* 3) PHOTOS + TEXT */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Photos & notes</Eyebrow>
        <Gap h={space.md} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          <Pressable onPress={addPhotos} style={[styles.addPhoto, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={26} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">Add</AppText>
          </Pressable>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Image source={{ uri: p.url }} style={styles.photo} resizeMode="cover" />
              <Pressable onPress={() => setPhotos((cur) => cur.filter((_, j) => j !== i))} style={styles.photoX}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <Gap h={space.xs} />
        <Row style={{ gap: 6 }}>
          <Ionicons name="information-circle-outline" size={13} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint">Photos are compressed before upload to keep storage small.</AppText>
        </Row>

        <Gap h={space.lg} />
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={palette.inkFaint} style={[styles.titleInput, { color: palette.ink }]} />
        <Rule strong />
        <Gap h={space.md} />
        <TextInput value={note} onChangeText={setNote} placeholder="Write what you felt, what to remember…" placeholderTextColor={palette.inkFaint} multiline style={[styles.noteInput, { color: palette.inkSoft }]} />

        <Gap h={space.xl} />
        <Button label={saving ? 'Saving…' : editing ? 'Save changes' : 'Save stop'} tone="matcha" onPress={save} disabled={!canSave || saving} />
        {!editing && !isSupabaseConfigured && (
          <>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint" center>Sign in with Supabase connected to actually record to the database.</AppText>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
  hit: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.06)' },
  selected: { alignItems: 'center', gap: space.sm, borderWidth: hairline * 2, borderRadius: 10, padding: space.md },
  addPhoto: { width: 96, height: 96, borderRadius: 8, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoWrap: { position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  photoX: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h2, paddingVertical: space.sm },
  noteInput: { fontFamily: fonts.gothicRegular, fontSize: type.body, lineHeight: type.body * 1.8, minHeight: 96, textAlignVertical: 'top' },
});
