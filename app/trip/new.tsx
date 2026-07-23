import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

const transports = [
  { key: 'train', label: 'Train', icon: 'subway-outline' },
  { key: 'shinkansen', label: 'Shinkansen', icon: 'train-outline' },
  { key: 'car', label: 'Car', icon: 'car-outline' },
  { key: 'plane', label: 'Flight', icon: 'airplane-outline' },
  { key: 'walk', label: 'Walk', icon: 'walk-outline' },
  { key: 'ferry', label: 'Ferry', icon: 'boat-outline' },
] as const;

const visibilities = [
  { key: 'private', label: 'Private', desc: 'Only you and companions' },
  { key: 'friends', label: 'Friends', desc: 'Visible to friends' },
  { key: 'public', label: 'Public', desc: 'Shown in Explore' },
] as const;

export default function NewTrip() {
  const { palette } = useTheme();
  const [title, setTitle] = useState('');
  const [transport, setTransport] = useState<string>('train');
  const [visibility, setVisibility] = useState<string>('friends');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header closeIcon title="New Trip" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <TextInput placeholder="Trip title" placeholderTextColor={palette.inkFaint} value={title} onChangeText={setTitle} style={[styles.titleInput, { color: palette.ink }]} multiline />
        <Rule strong />

        <Gap h={space.xl} />
        <Eyebrow>Dates</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          <DateField label="Start" value="2026.07.28" palette={palette} />
          <Ionicons name="arrow-forward" size={16} color={palette.inkFaint} />
          <DateField label="End" value="TBD" palette={palette} />
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Main transport</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {transports.map((t) => {
            const on = transport === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTransport(t.key)} style={[styles.chip, { borderColor: on ? palette.ai : palette.rule }, on && { backgroundColor: palette.ai }]}>
                <Ionicons name={t.icon as any} size={15} color={on ? palette.paper : palette.inkSoft} />
                <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>{t.label}</AppText>
              </Pressable>
            );
          })}
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Companions</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          <View style={[styles.member, { backgroundColor: palette.shu }]}>
            <AppText variant="h3" style={{ color: palette.paper }}>T</AppText>
          </View>
          <Pressable style={[styles.memberAdd, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={22} color={palette.inkFaint} />
          </Pressable>
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>Invite friends to{'\n'}record together</AppText>
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Visibility</Eyebrow>
        <Gap h={space.sm} />
        <Rule />
        {visibilities.map((v) => {
          const on = visibility === v.key;
          return (
            <View key={v.key}>
              <Pressable onPress={() => setVisibility(v.key)} style={styles.visRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone={on ? 'ai' : 'ink'}>{v.label}</AppText>
                  <AppText variant="small" tone="inkFaint">{v.desc}</AppText>
                </View>
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? palette.ai : palette.rule} />
              </Pressable>
              <Rule />
            </View>
          );
        })}
      </View>

      <View style={{ padding: space.lg }}>
        <Button label="Start the trip" tone="matcha" onPress={() => router.replace('/trip/t3')} />
      </View>
    </SafeAreaView>
  );
}

function DateField({ label, value, palette }: any) {
  return (
    <Pressable style={{ flex: 1 }}>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
      <Gap h={4} />
      <AppText style={{ fontFamily: fonts.minchoMedium, fontSize: type.h3, color: palette.ink }}>{value}</AppText>
      <Gap h={space.sm} />
      <Rule strong />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h1, lineHeight: type.h1 * 1.3, paddingBottom: space.sm, minHeight: 44 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 2 },
  member: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberAdd: { width: 44, height: 44, borderRadius: 22, borderWidth: hairline * 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  visRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
});
