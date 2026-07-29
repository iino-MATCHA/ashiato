import { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { DateInput } from '@/components/DateInput';
import { PhotoPicker } from '@/components/PhotoPicker';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  searchPlaces, resolvePlace, createStep, updateStep,
  fetchStepPhotos, deleteStepPhotos, type PlaceHit, type StoredPhoto,
} from '@/lib/api';
import type { Step } from '@/lib/mock';

import { useI18n } from '@/lib/i18n';
import { useStampPress } from '@/lib/stampPress';
import { fetchUserPrefectures } from '@/lib/api';
interface SelectedPlace {
  title: string;
  subtitle: string;
  municipalityCode: number;
  prefectureCode?: number;
}

export function StepEditor({ step, tripId }: { step?: Step; tripId?: string }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { pressStamp } = useStampPress();
  const editing = Boolean(step);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<SelectedPlace | null>(
    step ? { title: step.placeName, subtitle: step.prefectureName, municipalityCode: 0 } : null
  );
  // default the date to today — most stops are logged the day you're there
  const [when, setWhen] = useState(step?.loggedAt ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(step?.title ?? '');
  const [note, setNote] = useState(step?.note ?? '');
  const [photos, setPhotos] = useState<{ blob: Blob; url: string; onDay?: boolean }[]>([]);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  /**
   * すでに付いている写真。編集を開いた時点で読み込む。
   * これを出さないと、入れた写真をあとから消す手段が無くなる。
   * 消す指定は保存まで確定させない（× を押した直後に戻れるように）。
   */
  const [existing, setExisting] = useState<StoredPhoto[]>([]);
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!step?.id || !isSupabaseConfigured) return;
    let alive = true;
    fetchStepPhotos(step.id).then((p) => alive && setExisting(p)).catch(() => {});
    return () => { alive = false; };
  }, [step?.id]);

  const kept = existing.filter((p) => !dropped.has(p.id));

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

  // compression happens on upload
  const addPhotos = (files: File[]) => {
    // その日に撮った写真を先に見せる。選んだ日付と同じ日のものを前へ寄せ、
    // 違う日のものは「別の日」として畳んでおく（写真アプリで探す手間を省く）
    const day = (when || '').replace(/\./g, '-').slice(0, 10);
    const sameDay = (f: File) =>
      !!day && new Date(f.lastModified || Date.now()).toISOString().slice(0, 10) === day;

    const sorted = [...files].sort((a, b) => Number(sameDay(b)) - Number(sameDay(a)));
    const next = sorted.slice(0, 10).map((f) => ({
      blob: f as Blob,
      url: URL.createObjectURL(f),
      onDay: sameDay(f),
    }));
    setPhotos((cur) => [...cur, ...next].slice(0, 10));
    const off = next.filter((n) => !n.onDay).length;
    setPhotoHint(day && off > 0 ? t('editor.otherDayPhotos', { n: off }) : null);
  };

  const save = async () => {
    setSaveMsg(null);
    // editing an existing stop: update title / note / date (+append photos); place is locked
    if (editing && step && isSupabaseConfigured && tripId) {
      setSaving(true);
      // ×を付けた写真は、ここで初めて実際に消す
      const remove = existing.filter((p) => dropped.has(p.id));
      if (remove.length) {
        await deleteStepPhotos(remove);
        setExisting((cur) => cur.filter((p) => !dropped.has(p.id)));
        setDropped(new Set());
      }
      const ok = await updateStep(step.id, {
        title: title.trim() || step.title,
        note: note.trim(),
        loggedAt: (when || step.loggedAt).replace(/\./g, '-'),
        tripId,
        newPhotos: photos.map((p) => p.blob),
      });
      setSaving(false);
      if (!ok) { setSaveMsg(t('editor.saveFailed')); return; }
      router.back();
      return;
    }
    if (tripId && place?.municipalityCode && place.prefectureCode && isSupabaseConfigured) {
      setSaving(true);
      // createStep 後に判定すると必ず「既訪」になるので、先に控えておく
      const before = await fetchUserPrefectures();
      const isNewPrefecture = !!place.prefectureCode && !before.includes(place.prefectureCode);

      const res = await createStep({
        tripId,
        title: title.trim() || place.title,
        note: note.trim(),
        municipalityCode: place.municipalityCode,
        prefectureCode: place.prefectureCode,
        loggedAt: (when || new Date().toISOString().slice(0, 10)).replace(/\./g, '-'),
        transport: 'train',
        photoBlobs: photos.map((p) => p.blob),
      });
      setSaving(false);
      if (!res.id) {
        setSaveMsg(t('editor.saveFailed'));
        return;
      }
      if (res.photoFailed > 0) {
        setSaveMsg(t('editor.savePhotoFailed', { n: res.photoFailed }));
        setTimeout(() => router.back(), 1500);
        return;
      }
      // その県が初めてなら、御朱印が押される演出を見せてから戻る
      if (isNewPrefecture && place.prefectureCode) {
        const code = place.prefectureCode;
        router.back();
        setTimeout(() => pressStamp(code), 260);
        return;
      }
    }
    router.back();
  };

  const canSave = editing || (!!place && (!isSupabaseConfigured || !!place.prefectureCode));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title={editing ? t('editor.editStop') : t('editor.addStop')}
        right={<Pressable onPress={save} hitSlop={10} disabled={!canSave || saving}><AppText variant="bodyStrong" tone={canSave ? 'matcha' : 'inkFaint'}>{saving ? '…' : t('common.save')}</AppText></Pressable>}
      />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 1) WHERE — search */}
        <Eyebrow tone="matcha">{t('editor.where')}</Eyebrow>
        <Gap h={space.sm} />
        {place ? (
          <Row style={[styles.selected, { borderColor: palette.matcha }]}>
            <Ionicons name="location" size={18} color={palette.matcha} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{place.title}</AppText>
              {!!place.subtitle && <AppText variant="small" tone="inkFaint">{place.subtitle}</AppText>}
            </View>
            {/* the place can't be changed once a stop exists */}
            {!editing && (
              <Pressable onPress={() => setPlace(null)} hitSlop={8}><Ionicons name="close-circle" size={20} color={palette.inkFaint} /></Pressable>
            )}
          </Row>
        ) : (
          <>
            <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
              <Ionicons name="search" size={18} color={palette.inkFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('editor.searchPh')}
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
          </>
        )}

        {/* 2) WHEN */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">{t('editor.when')}</Eyebrow>
        <Gap h={space.sm} />
        <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="calendar-outline" size={18} color={palette.inkFaint} />
          <View style={{ flex: 1 }}>
            <DateInput value={when} onChange={setWhen} />
          </View>
        </Row>

        {/* 3) PHOTOS + TEXT */}
        <Gap h={space.xl} />
        <Eyebrow tone="matcha">{t('editor.photosNotes')}</Eyebrow>
        <Gap h={space.md} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          <PhotoPicker onPick={addPhotos} multiple style={[styles.addPhoto, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={26} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">{t('common.add')}</AppText>
          </PhotoPicker>
          {/* すでに入っている写真。×で消す指定にして、保存で確定する */}
          {kept.map((p) => (
            <View key={p.id} style={styles.photoWrap}>
              <Image source={{ uri: p.url }} style={styles.photo} resizeMode="cover" />
              <Pressable
                onPress={() => setDropped((cur) => new Set(cur).add(p.id))}
                style={styles.photoX}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Image source={{ uri: p.url }} style={styles.photo} resizeMode="cover" />
              {/* この日に撮られた写真だけ印をつける */}
              {p.onDay && (
                <View style={[styles.photoDay, { backgroundColor: palette.matcha }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
              <Pressable onPress={() => setPhotos((cur) => cur.filter((_, j) => j !== i))} style={styles.photoX}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
        {!!photoHint && (
          <><Gap h={space.sm} /><AppText variant="small" tone="inkFaint">{photoHint}</AppText></>
        )}
        {dropped.size > 0 && (
          <><Gap h={space.sm} /><AppText variant="small" tone="shu">{t('editor.removingPhotos', { n: dropped.size })}</AppText></>
        )}

        <Gap h={space.lg} />
        <TextInput value={title} onChangeText={setTitle} placeholder={t('editor.titlePh')} placeholderTextColor={palette.inkFaint} style={[styles.titleInput, { color: palette.ink }]} />
        <Rule strong />
        <Gap h={space.md} />
        <TextInput value={note} onChangeText={setNote} placeholder={t('editor.notePh')} placeholderTextColor={palette.inkFaint} multiline style={[styles.noteInput, { color: palette.inkSoft }]} />

        {!!saveMsg && (<><Gap h={space.md} /><AppText variant="small" tone="shu" center>{saveMsg}</AppText></>)}
        <Gap h={space.xl} />
        <Button label={saving ? t('common.saving') : editing ? t('common.saveChanges') : t('editor.saveStop')} tone="matcha" onPress={save} disabled={!canSave || saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
  hit: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.06)' },
  selected: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, borderColor: 'rgba(0,0,0,0)', paddingVertical: space.sm },
  addPhoto: { width: 96, height: 96, borderRadius: 8, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoWrap: { position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  photoDay: { position: 'absolute', left: 4, bottom: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  photoX: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h2, paddingVertical: space.sm },
  noteInput: { fontFamily: fonts.gothicRegular, fontSize: type.body, lineHeight: type.body * 1.8, minHeight: 96, textAlignVertical: 'top' },
});
