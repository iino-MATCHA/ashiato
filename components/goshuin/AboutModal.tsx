/**
 * 「御朱印バッジとは？」の説明モーダル。
 *
 * 中央に1枚のカードで出す（画面遷移はしない）。本物の御朱印と
 * 混同されると信用に関わるので、初めて /goshuin を開いたときに
 * 一度だけ自動で開き、以降は見出し脇のリンクから読み返せる。
 * 「一度見た」は端末に覚えさせる（localStorage。ネイティブや
 * プライベートブラウズでは黙って諦め、自動では開かないだけにする）。
 *
 * 朱色(#C4432B = palette.shu)は御朱印の文脈なのでここでは使ってよい。
 * 地の文は枠で囲まない ―― 囲ってよいのはモーダルのカードだけ。
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Gap, Button } from '@/components/ui';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

/** 端末に「もう見た」を覚えさせる印。 */
const SEEN_KEY = 'mj-goshuin-about-seen';

/** 初めての端末なら true（自動で開いてよい）。 */
export function shouldAutoOpenAbout(): boolean {
  try {
    return typeof localStorage !== 'undefined' && !localStorage.getItem(SEEN_KEY);
  } catch {
    return false; // 読めない環境では自動では開かない（リンクからはいつでも）
  }
}

/** 自動で開いたら呼ぶ。二度と自動では開かない。 */
export function markAboutSeen(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEY, '1');
  } catch {}
}

export function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  // visible={false} でも中身がDOMに残るので、開いている間だけ組み立てる
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: palette.paper, borderColor: palette.rule }]}
          onPress={() => {}}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="bookmark-outline" size={30} color={palette.shu} />
            <Gap h={space.md} />
            <AppText style={[styles.title, { color: palette.ink }]} center>
              {t('goshuin.aboutTitle')}
            </AppText>
          </View>
          <Gap h={space.lg} />
          <AppText variant="small" tone="ink" style={{ lineHeight: 22, opacity: 0.88 }}>
            {t('goshuin.aboutBody1')}
          </AppText>
          <Gap h={space.lg} />
          <AppText variant="small" style={[styles.notice, { color: palette.shu }]}>
            {t('goshuin.aboutNotice')}
          </AppText>
          <Gap h={space.sm} />
          <AppText variant="small" tone="ink" style={{ lineHeight: 22, opacity: 0.88 }}>
            {t('goshuin.aboutBody2')}
          </AppText>
          <Gap h={space.md} />
          <AppText variant="small" tone="inkSoft" style={{ lineHeight: 22 }}>
            {t('goshuin.aboutBody3')}
          </AppText>
          <Gap h={space.xl} />
          <Button label={t('common.close')} tone="matcha" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: space.lg,
    borderWidth: hairline,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  title: { fontFamily: fonts.minchoBold, fontSize: 20, lineHeight: 29 },
  notice: { fontFamily: fonts.gothicBold, lineHeight: 20 },
});
