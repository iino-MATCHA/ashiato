import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { goshuinList, type Step } from '@/lib/mock';

const suggestPrefs = ['Okinawa', 'Kyoto', 'Tokyo', 'Hokkaido', 'Hiroshima', 'Nagano'];
const spotTags = ['Shrine/Temple', 'Scenery', 'Food', 'Onsen', 'City walk', 'Sea', 'Mountain', 'Museum'];

export function StepEditor({ step }: { step?: Step }) {
  const { palette } = useTheme();
  const editing = Boolean(step);
  const [title, setTitle] = useState(step?.title ?? '');
  const [note, setNote] = useState(step?.note ?? '');
  const [prefecture, setPrefecture] = useState<string | null>(step?.prefectureName ?? null);
  const [tags, setTags] = useState<string[]>([]);

  const availableGoshuin = prefecture ? goshuinList.find((g) => g.prefectureName === prefecture) : null;
  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header
        title={editing ? 'Edit Stop' : 'Add Stop'}
        right={<Pressable onPress={() => router.back()} hitSlop={10}><AppText variant="bodyStrong" tone="ai">Save</AppText></Pressable>}
      />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Eyebrow>Photos & video</Eyebrow>
        <Gap h={space.md} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          <Pressable style={[styles.addPhoto, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={26} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">Add</AppText>
          </Pressable>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.photo, { backgroundColor: palette.fill }]}>
              <Ionicons name="image-outline" size={22} color={palette.inkFaint} />
            </View>
          ))}
        </ScrollView>
        <Gap h={space.sm} />
        <Row style={{ gap: 6 }}>
          <Ionicons name="sparkles-outline" size={13} color={palette.aiSoft} />
          <AppText variant="small" tone="inkFaint">Photos are ordered automatically from EXIF capture time. Up to 10 per stop.</AppText>
        </Row>

        <Gap h={space.xl} />
        <TextInput placeholder="Title for this place" placeholderTextColor={palette.inkFaint} value={title} onChangeText={setTitle} style={[styles.titleInput, { color: palette.ink }]} />
        <Rule strong />

        <Gap h={space.lg} />
        <TextInput placeholder="Write down what you felt, what you want to remember…" placeholderTextColor={palette.inkFaint} value={note} onChangeText={setNote} multiline style={[styles.noteInput, { color: palette.inkSoft }]} />

        <Gap h={space.xl} />
        <Eyebrow tone="matcha">Where did you go? (check in)</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {suggestPrefs.map((p) => {
            const on = prefecture === p;
            return (
              <Pressable key={p} onPress={() => setPrefecture(on ? null : p)} style={[styles.chip, { borderColor: on ? palette.matcha : palette.rule }, on && { backgroundColor: palette.matcha }]}>
                <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>{p}</AppText>
              </Pressable>
            );
          })}
          <Pressable style={[styles.chip, { borderColor: palette.rule }]}>
            <Ionicons name="search" size={13} color={palette.inkSoft} />
            <AppText variant="small" tone="inkSoft">Other</AppText>
          </Pressable>
        </Row>

        {availableGoshuin && !availableGoshuin.acquired && (
          <>
            <Gap h={space.md} />
            <Row style={[styles.goshuinHint, { borderColor: palette.shu }]}>
              <Ionicons name="ribbon" size={20} color={palette.shu} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="shu">You can receive the “{availableGoshuin.name}” goshuin</AppText>
                <AppText variant="small" tone="inkFaint">It will be stamped into your book when you save</AppText>
              </View>
            </Row>
          </>
        )}
        {availableGoshuin?.acquired && (
          <>
            <Gap h={space.md} />
            <Row style={{ gap: 6 }}>
              <Ionicons name="checkmark-circle" size={15} color={palette.aiSoft} />
              <AppText variant="small" tone="inkFaint">You already have the {availableGoshuin.prefectureName} goshuin</AppText>
            </Row>
          </>
        )}

        <Gap h={space.xl} />
        <Eyebrow>Spot tags</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {spotTags.map((t) => {
            const on = tags.includes(t);
            return (
              <Pressable key={t} onPress={() => toggleTag(t)} style={[styles.tag, { borderColor: on ? palette.ai : palette.rule }, on && { backgroundColor: palette.ai }]}>
                <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>{t}</AppText>
              </Pressable>
            );
          })}
        </Row>

        <Gap h={space.xl} />
        <Button label={editing ? 'Save changes' : 'Save stop'} tone="matcha" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addPhoto: { width: 96, height: 96, borderRadius: 3, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photo: { width: 96, height: 96, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h2, paddingVertical: space.sm },
  noteInput: { fontFamily: fonts.gothicRegular, fontSize: type.body, lineHeight: type.body * 1.8, minHeight: 96, textAlignVertical: 'top' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 2 },
  tag: { borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 7, borderRadius: 999 },
  goshuinHint: { gap: space.sm, alignItems: 'center', borderWidth: hairline * 2, borderRadius: 3, padding: space.md },
});
