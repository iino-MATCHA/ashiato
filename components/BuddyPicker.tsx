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
import { shareInvite } from '@/lib/invite';
import { useI18n } from '@/lib/i18n';

export function BuddyPicker({
  selected,
  onChange,
  tripTitle,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** 招待カードに載せる旅の名前。無ければアプリ全体への招待になる */
  tripTitle?: string;
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

  // 共有シートが無い環境では文面がクリップボードへ入る。通知は出さない
  const invite = () => { shareInvite(tripTitle); };

  /** 「家族や友達を招待する」。小さく、罫線も枠も付けない */
  const InviteLink = (
    <Pressable onPress={invite} hitSlop={8}>
      <Row style={{ gap: 5, alignItems: 'center' }}>
        <Ionicons name="paper-plane-outline" size={13} color={palette.matcha} />
        <AppText variant="small" tone="matcha" style={{ fontSize: 12 }}>{t('buddy.invite')}</AppText>
      </Row>
    </Pressable>
  );

  if (loading) return null;

  if (!friends.length) {
    return (
      <View>
        <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>{t('buddy.none')}</AppText>
        <Gap h={space.sm} />
        {InviteLink}
      </View>
    );
  }

  return (
    <View>
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
      <Gap h={space.md} />
      {InviteLink}
    </View>
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
