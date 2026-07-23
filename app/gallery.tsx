import { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { UgcCard } from '@/components/UgcCard';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { gallery, type GalleryCard } from '@/lib/mock';
import { ScrollView } from 'react-native-gesture-handler';

const filters = ['All', 'Route', 'Goshuin', 'Recap'] as const;

export default function Gallery() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<string>('All');
  const colW = (width - space.lg * 2 - space.md) / 2;
  const left = gallery.filter((_, i) => i % 2 === 0);
  const right = gallery.filter((_, i) => i % 2 === 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top']}>
      <Header title="Community Cards" />
      <Rule />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 56 }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.lg, alignItems: 'center' }}>
        {filters.map((f) => {
          const on = filter === f;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}>
              <AppText variant="bodyStrong" tone={on ? 'shu' : 'inkFaint'}>{f}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <Rule />

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Row style={{ alignItems: 'flex-start', gap: space.md }}>
          <View style={{ flex: 1, gap: space.lg }}>
            {left.map((c) => <GalleryEntry key={c.id} card={c} width={colW} palette={palette} />)}
          </View>
          <View style={{ flex: 1, gap: space.lg }}>
            {right.map((c) => <GalleryEntry key={c.id} card={c} width={colW} palette={palette} />)}
          </View>
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}

function GalleryEntry({ card, width, palette }: { card: GalleryCard; width: number; palette: any }) {
  const [liked, setLiked] = useState(false);
  return (
    <View>
      <Pressable onPress={() => router.push('/share')}>
        <UgcCard card={card} width={width} />
      </Pressable>
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => setLiked((v) => !v)}>
          <Row style={{ gap: 4 }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? palette.shu : palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">{card.likes + (liked ? 1 : 0)}</AppText>
          </Row>
        </Pressable>
        <Row style={{ gap: space.md }}>
          <Pressable><Ionicons name="bookmark-outline" size={16} color={palette.inkFaint} /></Pressable>
          <Pressable onPress={() => router.push('/trip/t1')}>
            <Row style={{ gap: 3 }}>
              <Ionicons name="map-outline" size={15} color={palette.aiSoft} />
              <AppText variant="small" tone="aiSoft">View route</AppText>
            </Row>
          </Pressable>
        </Row>
      </Row>
    </View>
  );
}
