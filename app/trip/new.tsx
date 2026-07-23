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
  { key: 'train', label: '電車', icon: 'train-outline' },
  { key: 'car', label: '車', icon: 'car-outline' },
  { key: 'plane', label: '飛行機', icon: 'airplane-outline' },
  { key: 'walk', label: '徒歩', icon: 'walk-outline' },
  { key: 'ferry', label: '船', icon: 'boat-outline' },
] as const;

const visibilities = [
  { key: 'private', label: '非公開', desc: '自分と同行者のみ' },
  { key: 'friends', label: '友達', desc: '友達まで公開' },
  { key: 'public', label: '公開', desc: '発見に掲載' },
] as const;

export default function NewTrip() {
  const { palette } = useTheme();
  const [title, setTitle] = useState('');
  const [transport, setTransport] = useState<string>('train');
  const [visibility, setVisibility] = useState<string>('friends');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header closeIcon title="新しい旅" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />

        {/* タイトル */}
        <TextInput
          placeholder="旅のタイトル"
          placeholderTextColor={palette.inkFaint}
          value={title}
          onChangeText={setTitle}
          style={[styles.titleInput, { color: palette.ink }]}
          multiline
        />
        <Rule strong />

        {/* 日程 */}
        <Gap h={space.xl} />
        <Eyebrow>日程</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          <DateField label="出発" value="2026.07.28" palette={palette} />
          <Ionicons name="arrow-forward" size={16} color={palette.inkFaint} />
          <DateField label="帰着" value="未定" palette={palette} />
        </Row>

        {/* 移動手段 */}
        <Gap h={space.xl} />
        <Eyebrow>主な移動手段</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
          {transports.map((t) => {
            const on = transport === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTransport(t.key)}
                style={[
                  styles.chip,
                  { borderColor: on ? palette.ai : palette.rule },
                  on && { backgroundColor: palette.ai },
                ]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={15}
                  color={on ? palette.paper : palette.inkSoft}
                />
                <AppText variant="small" style={{ color: on ? palette.paper : palette.inkSoft }}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </Row>

        {/* 同行者 */}
        <Gap h={space.xl} />
        <Eyebrow>同行者</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          <View style={[styles.member, { backgroundColor: palette.shu }]}>
            <AppText variant="h3" style={{ color: palette.paper }}>太</AppText>
          </View>
          <Pressable style={[styles.memberAdd, { borderColor: palette.ruleStrong }]}>
            <Ionicons name="add" size={22} color={palette.inkFaint} />
          </Pressable>
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            友達を招待して{'\n'}一緒に記録できます
          </AppText>
        </Row>

        {/* 公開範囲 */}
        <Gap h={space.xl} />
        <Eyebrow>公開範囲</Eyebrow>
        <Gap h={space.sm} />
        <Rule />
        {visibilities.map((v) => {
          const on = visibility === v.key;
          return (
            <View key={v.key}>
              <Pressable
                onPress={() => setVisibility(v.key)}
                style={styles.visRow}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" tone={on ? 'ai' : 'ink'}>{v.label}</AppText>
                  <AppText variant="small" tone="inkFaint">{v.desc}</AppText>
                </View>
                <Ionicons
                  name={on ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={on ? palette.ai : palette.rule}
                />
              </Pressable>
              <Rule />
            </View>
          );
        })}
      </View>

      <View style={{ padding: space.lg }}>
        <Button label="旅をはじめる" tone="shu" onPress={() => router.replace('/trip/t3')} />
      </View>
    </SafeAreaView>
  );
}

function DateField({ label, value, palette }: any) {
  return (
    <Pressable style={{ flex: 1 }}>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
      <Gap h={4} />
      <AppText style={{ fontFamily: fonts.minchoMedium, fontSize: type.h3, color: palette.ink }}>
        {value}
      </AppText>
      <Gap h={space.sm} />
      <Rule strong />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontFamily: fonts.minchoBold,
    fontSize: type.h1,
    lineHeight: type.h1 * 1.3,
    paddingBottom: space.sm,
    minHeight: 44,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: hairline * 2,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 2,
  },
  member: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberAdd: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: hairline * 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
});
