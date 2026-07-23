import { View, Pressable, StyleSheet, Share as RNShare, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { UgcCard } from '@/components/UgcCard';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { gallery } from '@/lib/mock';

const targets = [
  { key: 'instagram', label: 'Instagram\nStories', icon: 'logo-instagram', color: '#C13584' },
  { key: 'x', label: 'X\n(Twitter)', icon: 'logo-twitter', color: '#111' },
  { key: 'line', label: 'LINE', icon: 'chatbubble', color: '#06C755' },
] as const;

export default function ShareScreen() {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const card = gallery[0];
  const previewW = width * 0.52;

  const nativeShare = async () => {
    try {
      await RNShare.share({ message: 'I made a route card of this trip with Ashiato! #ashiato #travel' });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header closeIcon title="Share & Save" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <View style={{ alignItems: 'center', paddingVertical: space.xl }}>
          <UgcCard card={card} width={previewW} />
          <Gap h={space.md} />
          <Row style={{ gap: 6 }}>
            <Ionicons name="pricetag-outline" size={13} color={palette.inkFaint} />
            <AppText variant="small" tone="inkFaint">A logo and QR code are added automatically</AppText>
          </Row>
        </View>

        <Eyebrow>Share to</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ gap: space.md }}>
          {targets.map((t) => (
            <Pressable key={t.key} onPress={nativeShare} style={({ pressed }) => [styles.target, { borderColor: palette.rule }, pressed && { opacity: 0.6 }]}>
              <Ionicons name={t.icon as any} size={26} color={t.color === '#111' ? palette.ink : t.color} />
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkSoft" center>{t.label}</AppText>
            </Pressable>
          ))}
        </Row>

        <Gap h={space.xl} />
        <Rule />
        <ActionRow icon="download-outline" label="Save to device" desc="Save the image to your camera roll" palette={palette} onPress={() => {}} />
        <Rule />
        <ActionRow icon="share-outline" label="More apps" desc="Open the system share sheet" palette={palette} onPress={nativeShare} />
        <Rule />
        <ActionRow icon="link-outline" label="Copy link" desc="Public trip page (coming soon)" palette={palette} onPress={() => {}} />
        <Rule />
      </View>
    </SafeAreaView>
  );
}

function ActionRow({ icon, label, desc, palette, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={palette.inkSoft} />
      <View style={{ flex: 1 }}>
        <AppText variant="body" tone="ink">{label}</AppText>
        <AppText variant="small" tone="inkFaint">{desc}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { flex: 1, borderWidth: hairline, borderRadius: 3, paddingVertical: space.lg, alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
