import { useEffect, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Share as RNShare, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { ShareMap } from '@/components/map/ShareMap';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { useProfile } from '@/lib/useProfile';
import { fetchUserProfile } from '@/lib/api';
import { exportShareCard } from '@/lib/shareCard';

function daysBetween(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export default function TripShare() {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);
  const { profile } = useProfile();
  const [saving, setSaving] = useState(false);
  // 他の人（サンプル含む）の旅なら、その所有者のアイコンを載せる
  const [owner, setOwner] = useState<{ name: string; username: string; avatarUrl: string } | null>(null);
  const ownerId = trip?.authorId && trip.authorId !== 'me' ? trip.authorId : null;
  useEffect(() => {
    if (!ownerId) { setOwner(null); return; }
    let alive = true;
    fetchUserProfile(ownerId).then((u) => { if (alive && u) setOwner(u); });
    return () => { alive = false; };
  }, [ownerId]);

  const base = owner ?? { name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl };
  // アイコン未設定でもカードの丸が空にならないよう、旅の1枚目の写真で埋める
  const author = { ...base, avatarUrl: base.avatarUrl || trip?.steps[0]?.images[0] || '' };

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      </SafeAreaView>
    );
  }

  // 9:16 story card, sized to fit the screen
  const cardW = Math.min(width - space.lg * 2, (height - 260) * 9 / 16, 340);
  const cardH = (cardW * 16) / 9;

  const prefs = trip.prefectures.length;
  const days = daysBetween(trip.startDate, trip.endDate);
  const km = trip.distanceKm;

  // 1080×1920 で描き直したカードを保存する（プレビューのキャプチャではない）
  const download = async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || saving) return;
    setSaving(true);
    const dataUrl = await exportShareCard(trip.steps, {
      title: trip.title,
      prefectures: prefs,
      days,
      km,
      authorName: author.name || 'Traveller',
      authorHandle: author.username || 'traveller',
      avatarUrl: author.avatarUrl || undefined,
    });
    setSaving(false);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `ashiato-${trip.id}.png`;
    link.href = dataUrl;
    link.click();
  };
  const nativeShare = async (to: string) => {
    const text = `${trip.title} — ${prefs} prefectures, ${km} km with Ashiato #ashiato`;
    if (to === 'x' && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
    try { await RNShare.share({ message: text }); } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Share this trip" />
      <Rule />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        {/* Story card */}
        <View style={[styles.card, { width: cardW, height: cardH }]}>
          <View style={StyleSheet.absoluteFill as any}>
            <ShareMap steps={trip.steps} height={cardH} />
          </View>
          {/* 上下の暗幕。単色の帯だと境目に線が見えるので、必ずグラデーションで落とす */}
          <LinearGradient
            colors={['rgba(4,10,20,0.78)', 'rgba(4,10,20,0.42)', 'rgba(4,10,20,0)']}
            locations={[0, 0.55, 1]}
            style={[styles.scrim, { top: 0, height: cardH * 0.34 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(4,10,20,0)', 'rgba(4,10,20,0.55)', 'rgba(4,10,20,0.88)']}
            locations={[0, 0.45, 1]}
            style={[styles.scrim, { bottom: 0, height: cardH * 0.42 }]}
            pointerEvents="none"
          />

          {/* title top-left */}
          <View style={styles.tl}>
            <AppText style={styles.eyebrow}>ASHIATO</AppText>
            <Gap h={6} />
            <AppText style={styles.title} numberOfLines={2}>{trip.title}</AppText>
            <Gap h={8} />
            <View style={styles.hairline} />
          </View>

          {/* stats bottom-left + author bottom-right */}
          <View style={styles.bl}>
            <Row style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <StatLine value={String(prefs)} label="prefectures" />
                <StatLine value={String(days)} label="days" />
                <StatLine value={km.toLocaleString()} label="km travelled" />
              </View>
              <View style={{ alignItems: 'center', marginLeft: space.md }}>
                <View style={styles.avatar}>
                  {author.avatarUrl ? (
                    <Image source={{ uri: author.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={18} color="rgba(255,255,255,0.9)" />
                  )}
                </View>
                <Gap h={6} />
                <AppText style={styles.authorName} numberOfLines={1}>{author.name || 'Traveller'}</AppText>
              </View>
            </Row>
          </View>
        </View>

        {/* export buttons */}
        <Gap h={space.lg} />
        <Row style={{ gap: space.xl }}>
          <ExportBtn icon="download-outline" label={saving ? 'Saving…' : 'Save'} onPress={download} palette={palette} />
          <ExportBtn icon="logo-instagram" label="Stories" onPress={() => nativeShare('stories')} palette={palette} color="#C13584" />
          <ExportBtn icon="logo-twitter" label="X" onPress={() => nativeShare('x')} palette={palette} color={palette.ink} />
        </Row>
      </View>
    </SafeAreaView>
  );
}

function StatLine({ value, label }: { value: string; label: string }) {
  return (
    <Row style={{ alignItems: 'baseline', gap: 7, marginBottom: 5 }}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </Row>
  );
}

function ExportBtn({ icon, label, onPress, palette, color }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignItems: 'center', opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.exportCircle, { borderColor: palette.ruleStrong }]}>
        <Ionicons name={icon} size={22} color={color ?? palette.ink} />
      </View>
      <Gap h={4} />
      <AppText variant="small" tone="inkSoft">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0b1a2b' },
  scrim: { position: 'absolute', left: 0, right: 0 },
  tl: { position: 'absolute', top: space.lg, left: space.lg, right: space.lg },
  eyebrow: { fontFamily: fonts.gothicMedium, fontSize: 9, letterSpacing: 3.5, color: 'rgba(255,255,255,0.75)' },
  title: { fontFamily: fonts.minchoBold, fontSize: 19, lineHeight: 26, color: '#fff' },
  hairline: { width: 26, height: 1, backgroundColor: 'rgba(255,255,255,0.5)' },
  bl: { position: 'absolute', bottom: space.lg, left: space.lg, right: space.lg },
  statValue: { fontFamily: fonts.minchoBold, fontSize: 17, color: '#fff' },
  statLabel: { fontFamily: fonts.gothicRegular, fontSize: 9.5, letterSpacing: 0.6, color: 'rgba(255,255,255,0.72)' },
  avatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  authorName: { fontFamily: fonts.gothicMedium, fontSize: 9.5, color: 'rgba(255,255,255,0.9)', maxWidth: 80, textAlign: 'center' },
  exportCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
});
