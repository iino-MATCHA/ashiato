/**
 * リンクをコピーする一行。
 *
 * URLをそのまま並べても、何のリンクなのか・押していいのかが分からない。
 * 「旅路を共有する」のように**行き先を言葉で言い**、コピーの印を添える。
 * 押したら印がチェックに変わる ―― 文言は増やさず、それだけで伝える。
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';

export function CopyLink({
  url,
  /** 見出しの言葉。省くと「旅路を共有する」 */
  label,
  /** URL も小さく見せる。貼り先を確かめたい共有画面では出す */
  showUrl = true,
}: {
  url: string;
  label?: string;
  showUrl?: boolean;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  const copy = async () => {
    // clipboard API はジェスチャ切れや権限で普通に落ちる。
    // 駄目なら選択→execCommand('copy') の古い道で拾う
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {}
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch {}
    }
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }
  };

  return (
    <Pressable
      onPress={copy}
      hitSlop={8}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, alignSelf: 'stretch' }]}
    >
      <Row
        style={{
          gap: space.sm,
          alignItems: 'center',
          borderWidth: hairline * 2,
          borderColor: done ? palette.matcha : palette.ruleStrong,
          borderRadius: 10,
          paddingVertical: space.sm + 2,
          paddingHorizontal: space.md,
          maxWidth: 340,
          alignSelf: 'center',
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="bodyStrong" tone={done ? 'matcha' : 'ink'} numberOfLines={1}>
            {done ? t('share.copied') : (label ?? t('share.copyTripLink'))}
          </AppText>
          {showUrl && (
            <AppText variant="small" tone="inkFaint" numberOfLines={1} style={{ fontSize: 11 }}>
              {url.replace(/^https?:\/\//, '')}
            </AppText>
          )}
        </View>
        <Ionicons
          name={done ? 'checkmark' : 'copy-outline'}
          size={19}
          color={done ? palette.matcha : palette.inkSoft}
        />
      </Row>
    </Pressable>
  );
}
