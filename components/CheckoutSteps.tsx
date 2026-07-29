/**
 * かご → お支払い → 完了 の3画面で共通に出す進捗。
 * 箱で囲わず、細い罫と数字だけで「いまどこか」を示す。
 */
import { View } from 'react-native';
import { AppText, Row } from '@/components/ui';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

export function CheckoutSteps({ at }: { at: 1 | 2 | 3 }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const labels = [t('cart.header'), t('checkout.header'), t('done.header')];

  return (
    <Row style={{ gap: space.sm, alignItems: 'center' }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < at;
        const on = n === at;
        const color = on ? palette.matcha : done ? palette.inkSoft : palette.inkFaint;
        return (
          <Row key={label} style={{ gap: space.sm, alignItems: 'center', flexShrink: 1 }}>
            {i > 0 && (
              <View style={{ width: 18, height: hairline * 2, backgroundColor: palette.rule }} />
            )}
            <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 13, color, letterSpacing: 1 }}>
              {n}
            </AppText>
            <AppText
              variant="small"
              numberOfLines={1}
              style={{ color, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 1 }}
            >
              {label}
            </AppText>
          </Row>
        );
      })}
    </Row>
  );
}
