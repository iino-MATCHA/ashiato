/**
 * ゲストが「保存が要る操作」を押したときに出す中央のモーダル。
 *
 * 画面を飛ばさない。押した文脈のまま出して、ログインするか、そのまま
 * 見続けるかを選ばせる。ゲートで弾いてログイン画面に落とすと、
 * 何をしようとしていたのかが分からなくなる。
 */
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Gap, Button } from '@/components/ui';
import { space, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

export function SignInPrompt({
  visible,
  onClose,
  /** 何をしようとして止まったのか。辞書のキー（guest.why.*） */
  reason,
}: {
  visible: boolean;
  onClose: () => void;
  reason?: 'save' | 'comment' | 'like' | 'collect' | 'order';
}) {
  const { palette } = useTheme();
  const { t } = useI18n();

  const go = (mode: 'signin' | 'signup') => {
    onClose();
    router.push(`/(auth)/login${mode === 'signup' ? '?signup=1' : ''}` as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.paper, borderColor: palette.rule }]} onPress={() => {}}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="footsteps-outline" size={34} color={palette.matcha} />
            <Gap h={space.md} />
            <AppText style={[styles.title, { color: palette.ink }]} center>{t('guest.promptTitle')}</AppText>
            <Gap h={space.sm} />
            <AppText variant="small" tone="ink" center style={{ lineHeight: 21, opacity: 0.86 }}>
              {t(`guest.why.${reason ?? 'save'}`)}
            </AppText>
          </View>

          <Gap h={space.xl} />
          <Button label={t('guest.signUp')} tone="matcha" onPress={() => go('signup')} />
          <Gap h={space.sm} />
          <Button label={t('common.signin')} tone="ink" variant="outline" onPress={() => go('signin')} />
          <Gap h={space.md} />
          <Pressable onPress={onClose} hitSlop={8}>
            <AppText variant="small" tone="inkFaint" center>{t('guest.keepLooking')}</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: {
    width: '100%', maxWidth: 360, borderRadius: 18, padding: space.lg, borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  title: { fontFamily: fonts.minchoBold, fontSize: 24, lineHeight: 33 },
});
