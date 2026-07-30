import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

export const RANKS: { label: string; range: string; min: number }[] = [
  { label: 'First Steps', range: '0 – 4', min: 0 },
  { label: 'On the Path', range: '5 – 14', min: 5 },
  { label: 'Pilgrim', range: '15 – 29', min: 15 },
  { label: 'Wayfarer', range: '30 – 46', min: 30 },
  { label: 'Grand Master', range: '47', min: 47 },
];

export function rankFor(count: number): string {
  let r = RANKS[0].label;
  for (const x of RANKS) if (count >= x.min) r = x.label;
  return r;
}

export function RankModal({ visible, onClose, count }: { visible: boolean; onClose: () => void; count: number }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const current = rankFor(count);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: palette.washi }]} onPress={() => {}}>
          <AppText variant="h3" tone="ink">{t('rank.title')}</AppText>
          <AppText variant="small" tone="inkFaint">{t('rank.based')}</AppText>
          <Gap h={space.md} />
          <Rule />
          {RANKS.map((r) => {
            const on = r.label === current;
            return (
              <View key={r.label}>
                <Row style={{ justifyContent: 'space-between', paddingVertical: space.sm }}>
                  <Row style={{ gap: space.sm, alignItems: 'center' }}>
                    {on && <View style={[styles.dot, { backgroundColor: palette.shu }]} />}
                    <AppText variant="bodyStrong" tone={on ? 'shu' : 'ink'}>{r.label}</AppText>
                  </Row>
                  <AppText variant="small" tone="inkFaint">{t('rank.range', { range: r.range })}</AppText>
                </Row>
                <Rule />
              </View>
            );
          })}
          <Gap h={space.md} />
          <Pressable onPress={onClose} style={[styles.close, { backgroundColor: palette.ink }]}>
            <AppText variant="bodyStrong" style={{ color: palette.paper }}>{t('common.close')}</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: space.lg },
  dot: { width: 7, height: 7, borderRadius: 4 },
  close: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
