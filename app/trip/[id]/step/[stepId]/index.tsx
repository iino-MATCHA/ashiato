import { useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchStepSocial, toggleLike, addComment, type StepSocial } from '@/lib/api';
import { transportLabel, type TransportMode } from '@/lib/mock';

const transportIcon: Record<TransportMode, any> = {
  car: 'car-outline', train: 'subway-outline', shinkansen: 'train-outline',
  plane: 'airplane-outline', walk: 'walk-outline', ferry: 'boat-outline', bus: 'bus-outline',
};

export default function StepDetail() {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const { id, stepId, readonly } = useLocalSearchParams<{ id: string; stepId: string; readonly?: string }>();
  const { trip } = useTrip(id);
  const step = trip?.steps.find((s) => s.id === stepId);
  const canEdit = (trip?.authorId === 'me' || !trip?.authorId) && readonly !== '1';

  const [hero, setHero] = useState(0);
  const [social, setSocial] = useState<StepSocial | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadSocial = () => {
    if (isSupabaseConfigured && stepId) fetchStepSocial(stepId).then(setSocial).catch(() => {});
  };
  useEffect(loadSocial, [stepId]);

  if (!trip || !step) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }

  const coverH = Math.min(height * 0.3, 240);

  const like = async () => {
    if (!social) return;
    const prev = social;
    setMsg(null);
    setSocial({ ...social, likedByMe: !social.likedByMe, likes: social.likes + (social.likedByMe ? -1 : 1) });
    const ok = await toggleLike(step.id, trip.id, social.likedByMe);
    if (!ok) { setSocial(prev); setMsg('Sign in to like this stop.'); return; }
    loadSocial();
  };
  const post = async () => {
    if (!draft.trim()) return;
    setMsg(null);
    setPosting(true);
    const ok = await addComment(step.id, trip.id, draft);
    setPosting(false);
    if (ok) { setDraft(''); loadSocial(); }
    else setMsg('Could not post. Please sign in and try again.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={step.placeName} />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: step.images[hero] }} style={{ width: '100%', height: coverH, borderRadius: 10, backgroundColor: palette.fill }} resizeMode="cover" />
        {step.images.length > 1 && (
          <Row style={{ gap: 6, marginTop: space.sm }}>
            {step.images.slice(0, 8).map((uri, i) => (
              <Pressable key={i} onPress={() => setHero(i)}>
                <Image source={{ uri }} style={[styles.thumb, { borderColor: i === hero ? palette.matcha : 'transparent' }]} resizeMode="cover" />
              </Pressable>
            ))}
          </Row>
        )}

        <Gap h={space.md} />
        <Row style={{ gap: 8, alignItems: 'center' }}>
          <View style={[styles.transport, { backgroundColor: palette.matcha }]}>
            <Ionicons name={transportIcon[step.transport]} size={13} color="#fff" />
            <AppText variant="small" style={{ color: '#fff' }}>{transportLabel[step.transport]}</AppText>
          </View>
          <AppText variant="small" tone="inkFaint">{step.loggedAt.replace(/-/g, '.')} · {step.images.length} photos</AppText>
        </Row>

        <Gap h={space.sm} />
        <Eyebrow tone="matcha">{step.prefectureName}</Eyebrow>
        <Gap h={4} />
        <AppText variant="h2" tone="ink">{step.title}</AppText>
        <AppText variant="small" tone="inkSoft">{step.placeName}</AppText>
        <Gap h={space.sm} />
        <AppText variant="body" tone="ink" style={{ lineHeight: 24 }}>{step.note}</AppText>

        {canEdit && (
          <>
            <Gap h={space.lg} />
            <Button label="Edit this stop" variant="outline" tone="ink" onPress={() => router.push(`/trip/${trip.id}/step/${step.id}/edit`)} />
          </>
        )}

        {/* Likes + comments */}
        {isSupabaseConfigured && (
          <>
            <Gap h={space.xl} />
            <Rule />
            <Gap h={space.md} />
            <Row style={{ gap: space.lg, alignItems: 'center' }}>
              <Pressable onPress={like}>
                <Row style={{ gap: 6, alignItems: 'center' }}>
                  <Ionicons name={social?.likedByMe ? 'heart' : 'heart-outline'} size={22} color={social?.likedByMe ? palette.shu : palette.inkSoft} />
                  <AppText variant="bodyStrong" tone="ink">{social?.likes ?? 0}</AppText>
                </Row>
              </Pressable>
              <Row style={{ gap: 6, alignItems: 'center' }}>
                <Ionicons name="chatbubble-outline" size={20} color={palette.inkSoft} />
                <AppText variant="bodyStrong" tone="ink">{social?.comments.length ?? 0}</AppText>
              </Row>
            </Row>

            <Gap h={space.md} />
            {(social?.comments ?? []).map((c) => (
              <View key={c.id} style={{ marginBottom: space.md }}>
                <Row style={{ gap: 6, alignItems: 'baseline' }}>
                  <AppText variant="bodyStrong" tone="ink">{c.author}</AppText>
                  <AppText variant="small" tone="inkFaint">{c.createdAt}</AppText>
                </Row>
                <AppText variant="body" tone="inkSoft">{c.body}</AppText>
              </View>
            ))}
            {(social?.comments.length ?? 0) === 0 && (
              <AppText variant="small" tone="inkFaint">Be the first to comment.</AppText>
            )}

            {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{msg}</AppText></>)}

            <Gap h={space.md} />
            {/* send button is ABSOLUTELY positioned inside the bar — can never overflow */}
            <View style={[styles.commentBar, { borderColor: palette.ruleStrong }]}>
              <TextInput
                value={draft} onChangeText={setDraft}
                placeholder="Add a comment…" placeholderTextColor={palette.inkFaint}
                style={[styles.commentInput, { color: palette.ink }]}
                onSubmitEditing={post}
              />
              <Pressable onPress={post} disabled={posting || !draft.trim()} style={[styles.sendBtn, { backgroundColor: draft.trim() ? palette.matcha : palette.fill }]}>
                <Ionicons name="arrow-up" size={18} color={draft.trim() ? '#fff' : palette.inkFaint} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 44, height: 44, borderRadius: 6, borderWidth: 2, backgroundColor: '#eee' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  commentBar: { position: 'relative', width: '100%', height: 46, borderWidth: hairline * 2, borderRadius: 23, justifyContent: 'center' },
  commentInput: { fontFamily: fonts.gothicRegular, fontSize: type.body, paddingLeft: space.md, paddingRight: 52, paddingVertical: 6, minWidth: 0 },
  sendBtn: { position: 'absolute', right: 5, top: 5, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
