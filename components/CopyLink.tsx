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
