/**
 * 一緒に行った人を選ぶ。
 * 友だちの一覧を横に並べ、押すと選択が入れ替わるだけ。
 * 枠で囲うのは押せるもの（アバター）だけで、説明は罫線も付けない。
 */
import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { fetchFriends, type UserSummary } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export function BuddyPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchFriends()
      .then((f) => alive && setFriends(f))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (loading) return null;

  if (!friends.length) {
    return <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>{t('buddy.none')}</AppText>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
      {friends.map((f) => {
        const on = selected.includes(f.id);
        return (
          <Pressable key={f.id} onPress={() => toggle(f.id)} style={{ alignItems: 'center', width: 62 }}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: palette.fill, borderColor: on ? palette.matcha : palette.rule },
                on && { borderWidth: 2 },
              ]}
            >
              {f.avatarUrl ? (
                <Image source={{ uri: f.avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={20} color={palette.matcha} />
              )}
              {on && (
                <View style={[styles.tick, { backgroundColor: palette.matcha }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}
            </View>
            <Gap h={5} />
            <AppText variant="small" tone={on ? 'ink' : 'inkFaint'} numberOfLines={1} center style={{ fontSize: 11 }}>
              {f.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: hairline * 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  tick: {
    position: 'absolute', right: -1, bottom: -1,
    width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
});
