import { View, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { UgcCard } from '@/components/UgcCard';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { gallery, trendingSpots } from '@/lib/mock';

export default function Explore() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const colW = (width - space.lg * 2 - space.md) / 2;

  // 2カラムのざっくりmasonry（左右に振り分け）
  const left = gallery.filter((_, i) => i % 2 === 0);
  const right = gallery.filter((_, i) => i % 2 === 1);

  return (
    <Screen>
      <Gap h={space.md} />
      <AppText variant="eyebrow" tone="shu">EXPLORE</AppText>
      <Gap h={space.sm} />
      <AppText variant="h2" tone="ink">みんなの足跡を、旅の参考に</AppText>

      {/* 検索（下線のみ） */}
      <Gap h={space.lg} />
      <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
        <Ionicons name="search" size={18} color={palette.inkFaint} />
        <TextInput
          placeholder="地名・スポット・ユーザーを検索"
          placeholderTextColor={palette.inkFaint}
          style={[styles.searchInput, { color: palette.ink }]}
        />
      </Row>

      {/* トレンドスポット */}
      <Gap h={space.xl} />
      <Eyebrow>いま人気のスポット</Eyebrow>
      <Gap h={space.md} />
      <Rule />
      {trendingSpots.map((s, i) => (
        <View key={s.name}>
          <Row style={styles.spot}>
            <AppText variant="h3" tone="inkFaint" style={{ width: 30 }}>
              {String(i + 1).padStart(2, '0')}
            </AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{s.name}</AppText>
              <AppText variant="small" tone="inkFaint">{s.prefecture}</AppText>
            </View>
            <Row style={{ gap: 4 }}>
              <Ionicons name="footsteps-outline" size={13} color={palette.aiSoft} />
              <AppText variant="small" tone="aiSoft">{s.visits.toLocaleString()}</AppText>
            </Row>
          </Row>
          <Rule />
        </View>
      ))}

      {/* 人気UGC */}
      <Gap h={space.xl} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>人気のカード</Eyebrow>
        <Pressable onPress={() => router.push('/gallery')}>
          <AppText variant="small" tone="ai">ギャラリー →</AppText>
        </Pressable>
      </Row>
      <Gap h={space.md} />
      <Row style={{ alignItems: 'flex-start', gap: space.md }}>
        <View style={{ gap: space.md, flex: 1 }}>
          {left.map((c) => (
            <Pressable key={c.id} onPress={() => router.push('/gallery')}>
              <UgcCard card={c} width={colW} />
            </Pressable>
          ))}
        </View>
        <View style={{ gap: space.md, flex: 1 }}>
          {right.map((c) => (
            <Pressable key={c.id} onPress={() => router.push('/gallery')}>
              <UgcCard card={c} width={colW} />
            </Pressable>
          ))}
        </View>
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    gap: space.sm,
    borderBottomWidth: hairline * 2,
    paddingBottom: space.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.gothicRegular,
    fontSize: type.body,
    paddingVertical: 4,
  },
  spot: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
