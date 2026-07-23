import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { Stamp } from '@/components/Stamp';
import { AppText, Row, Gap, Button, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { findGoshuin } from '@/lib/mock';

const rarityLabel = {
  normal: 'Standard',
  limited: 'Limited edition',
  seasonal: 'Seasonal',
  collab: 'Collaboration',
} as const;

export default function GoshuinDetail() {
  const { palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goshuin = findGoshuin(id);
  const hasLimited = goshuin.rarity !== 'normal';
  const [edition, setEdition] = useState<'normal' | 'limited'>(hasLimited ? 'limited' : 'normal');
  const shown = { ...goshuin, rarity: edition === 'limited' ? goshuin.rarity : ('normal' as const) };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={goshuin.prefectureName} />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <View style={styles.stage}>
          {goshuin.acquired ? (
            <Stamp goshuin={shown} size={240} rotate={-3} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Stamp goshuin={shown} size={240} />
              <Gap h={space.md} />
              <Row style={{ gap: 6 }}>
                <Ionicons name="lock-closed" size={14} color={palette.inkFaint} />
                <AppText variant="small" tone="inkFaint">Not collected</AppText>
              </Row>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'center' }}>
          <Eyebrow tone={goshuin.rarity === 'normal' ? 'shu' : 'gold'}>{rarityLabel[goshuin.rarity]}</Eyebrow>
          <Gap h={space.sm} />
          <AppText variant="h1" tone="ink">{goshuin.name}</AppText>
          {goshuin.acquired && goshuin.acquiredAt && (
            <>
              <Gap h={space.xs} />
              <AppText variant="small" tone="inkFaint">Received {goshuin.acquiredAt.replace(/-/g, '.')}</AppText>
            </>
          )}
        </View>

        {hasLimited && goshuin.acquired && (
          <>
            <Gap h={space.xl} />
            <Row style={[styles.toggle, { borderColor: palette.rule }]}>
              {(['normal', 'limited'] as const).map((e) => {
                const on = edition === e;
                return (
                  <Pressable key={e} onPress={() => setEdition(e)} style={[styles.toggleBtn, on && { backgroundColor: palette.ink }]}>
                    <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>
                      {e === 'normal' ? 'Standard' : rarityLabel[goshuin.rarity]}
                    </AppText>
                  </Pressable>
                );
              })}
            </Row>
          </>
        )}

        <View style={{ flex: 1 }} />

        {goshuin.acquired ? (
          <Button label="Share this goshuin" tone="shu" onPress={() => router.push('/share?kind=goshuin')} />
        ) : (
          <View style={[styles.locked, { borderColor: palette.rule }]}>
            <AppText variant="small" tone="inkFaint" center>
              Check in to {goshuin.prefectureName} on a trip{'\n'}to receive this goshuin.
            </AppText>
          </View>
        )}
        <Gap h={space.md} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', maxHeight: 360 },
  toggle: { flexDirection: 'row', borderWidth: hairline, borderRadius: 3, padding: 3, alignSelf: 'center' },
  toggleBtn: { paddingHorizontal: space.lg, paddingVertical: 8, borderRadius: 2 },
  locked: { borderWidth: hairline, borderRadius: 3, padding: space.lg },
});
