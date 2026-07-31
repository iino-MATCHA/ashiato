import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Image, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchCommentNotifications, markNotificationRead, addComment, type CommentNotification } from '@/lib/api';

import { useI18n, t } from '@/lib/i18n';
export default function Notifications() {
  const { palette } = useTheme();
  useI18n(); // 言語切替の再レンダー購読
  const [items, setItems] = useState<CommentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    fetchCommentNotifications()
      .then((n) => alive.current && setItems(n))
      .catch(() => {})
      .finally(() => alive.current && setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]));

  /** 既読にする。カードが倒れ切るのを待たない（動きが止まっても用件は片付く）。 */
  const markRead = (id: string) => { markNotificationRead(id).catch(() => {}); };
  /** 倒れ切ったカードを一覧から外す。 */
  const remove = (id: string) => setItems((cur) => cur.filter((i) => i.commentId !== id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      {/* タブの画面なので戻る矢印は置かない（戻り先が無い） */}
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md }}>
        <AppText variant="h2" tone="ink">{t('noti.header')}</AppText>
      </View>
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, alignItems: 'center' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <><Gap h={space.xxl} /><ActivityIndicator color={palette.matcha} /></>
        ) : items.length === 0 ? (
          <>
            <Gap h={space.xxl} />
            <Ionicons name="checkmark-done-circle-outline" size={44} color={palette.matcha} />
            <Gap h={space.sm} />
            <AppText variant="h3" tone="ink">{t('noti.caughtUp')}</AppText>
            <AppText variant="small" tone="inkFaint">New comments on your stops will appear here.</AppText>
          </>
        ) : (
          <>
            <Row style={{ gap: 6 }}>
              <Ionicons name="arrow-forward" size={13} color={palette.inkFaint} />
              <AppText variant="small" tone="inkFaint">{t('noti.swipeHint')}</AppText>
            </Row>
            <Gap h={space.md} />
            {items.map((n) => (
              <NotificationCard
                key={n.commentId}
                n={n}
                palette={palette}
                onRead={() => markRead(n.commentId)}
                onGone={() => remove(n.commentId)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({
  n, palette, onRead, onGone,
}: {
  n: CommentNotification;
  palette: any;
  /** 既読としてDBに記録する */
  onRead: () => void;
  /** 倒れ切ったので一覧から外していい */
  onGone: () => void;
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  // 0 = そのまま / 1 = 倒れ切った
  const fall = useRef(new Animated.Value(0)).current;
  const alive = useRef(true);
  const going = useRef(false);
  useEffect(() => () => { alive.current = false; }, []);

  /**
   * カードを倒して片付ける。
   * 傾きながら滑り落ちて薄くなる ―― 机の上の紙を払うような動き。
   *
   * 既読は動きを待たずに先に記録する。タブが裏に回るなどして
   * アニメーションが進まなくても、用件だけは必ず片付くようにする
   * （実際、描画が止まっている環境では完了コールバックが来ない）。
   * 保険として、動き終わらなくても一定時間後に一覧から外す。
   */
  const fallAway = () => {
    if (going.current) return;
    going.current = true;
    onRead();
    const gone = () => { if (alive.current) onGone(); };
    const guard = setTimeout(gone, 900);
    Animated.timing(fall, {
      toValue: 1,
      duration: 460,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => { clearTimeout(guard); gone(); });
  };

  /**
   * 返信したら、その用件は済んでいる。
   * 「返信しました」を一拍だけ見せてから、同じ動きで片付ける。
   */
  const send = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const created = await addComment(n.logId, n.tripId, reply);
    if (!alive.current) return;
    setSending(false);
    if (!created) return;
    setReply('');
    setSent(true);
    setTimeout(() => { if (alive.current) fallAway(); }, 900);
  };

  const anim = {
    opacity: fall.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.85, 0] }),
    transform: [
      { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) },
      { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, 34] }) },
      { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '11deg'] }) },
      { scale: fall.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
    ],
  };

  return (
    <Animated.View style={[{ width: '100%', maxWidth: 380, alignSelf: 'center' }, anim]}>
    <Swipeable
      renderLeftActions={() => (
        <View style={styles.readAction}>
          <Ionicons name="checkmark" size={22} color="#fff" />
          <AppText variant="small" style={{ color: '#fff' }}>{t('noti.read')}</AppText>
        </View>
      )}
      leftThreshold={70}
      onSwipeableOpen={(direction) => { if (direction === 'left') fallAway(); }}
    >
      <View style={[styles.card, { backgroundColor: palette.paper, borderColor: palette.rule }]}>
        {/* the stop this comment belongs to (no map, just the card) */}
        <Row style={{ gap: space.md, alignItems: 'center' }}>
          {n.photo ? (
            <Image source={{ uri: n.photo }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: palette.fill, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="location-outline" size={20} color={palette.inkFaint} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="matcha">{t('noti.yourStop')}</AppText>
            <AppText variant="h3" tone="ink" numberOfLines={1}>{n.stepTitle}</AppText>
          </View>
        </Row>

        <Gap h={space.md} />
        <Rule />
        <Gap h={space.md} />
        <Row style={{ gap: 6, alignItems: 'baseline' }}>
          <AppText variant="bodyStrong" tone="ink">{n.author}</AppText>
          <AppText variant="small" tone="inkFaint">{n.createdAt}</AppText>
        </Row>
        <AppText variant="body" tone="inkSoft">{n.body}</AppText>

        <Gap h={space.md} />
        {sent ? (
          <Row style={{ gap: 6 }}>
            <Ionicons name="checkmark-circle" size={15} color={palette.matcha} />
            <AppText variant="small" tone="matcha">{t('noti.replySent')}</AppText>
          </Row>
        ) : (
          <View style={[styles.replyBar, { borderColor: palette.ruleStrong }]}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder={t('noti.replyPh')}
              placeholderTextColor={palette.inkFaint}
              style={[styles.replyInput, { color: palette.ink }]}
              onSubmitEditing={send}
            />
            <Pressable onPress={send} disabled={sending || !reply.trim()} style={[styles.sendBtn, { backgroundColor: reply.trim() ? palette.matcha : palette.fill }]}>
              <Ionicons name="arrow-up" size={16} color={reply.trim() ? '#fff' : palette.inkFaint} />
            </Pressable>
          </View>
        )}
      </View>
    </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 380, alignSelf: 'center', borderWidth: hairline, borderRadius: 14, padding: space.md, marginBottom: space.md },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  readAction: { width: 84, borderRadius: 14, marginBottom: space.md, backgroundColor: '#69AF00', alignItems: 'center', justifyContent: 'center', gap: 2 },
  replyBar: { position: 'relative', width: '100%', height: 42, borderWidth: hairline * 2, borderRadius: 21, justifyContent: 'center' },
  replyInput: { fontFamily: fonts.gothicRegular, fontSize: type.small, paddingLeft: space.md, paddingRight: 46, minWidth: 0 },
  sendBtn: { position: 'absolute', right: 4, top: 4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
