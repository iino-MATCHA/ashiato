/**
 * URLを1行見せて、押したらコピーする。それ以上のことはしない。
 * 文言は置かない（コピーできたことはアイコンがチェックに変わることで伝える）。
 */
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row } from '@/components/ui';
import { useTheme } from '@/lib/useTheme';

export function CopyLink({ url }: { url: string }) {
  const { palette } = useTheme();
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {}
  };

  return (
    <Pressable onPress={copy} hitSlop={8} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
      <Row style={{ gap: 6, alignItems: 'center', maxWidth: 320 }}>
        <Ionicons
          name={done ? 'checkmark' : 'link-outline'}
          size={14}
          color={done ? palette.matcha : palette.inkFaint}
        />
        <AppText variant="small" tone={done ? 'matcha' : 'inkFaint'} numberOfLines={1} style={{ fontSize: 12 }}>
          {url.replace(/^https?:\/\//, '')}
        </AppText>
      </Row>
    </Pressable>
  );
}
