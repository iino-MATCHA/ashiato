import { useCallback, useRef, useState } from 'react';
import { View, Image, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { Header } from '@/components/Header';
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

  const dismiss = async (id: string) => {
    setItems((cur) => cur.filter((i) => i.commentId !== id)); // optimistic
    await markNotificationRead(id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('noti.header')} />
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
              <NotificationCard key={n.commentId} n={n} palette={palette} onRead={() => dismiss(n.commentId)} onReplied={load} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({ n, palette, onRead, onReplied }: { n: CommentNotification; palette: any; onRead: () => void; onReplied: () => void }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const ok = await addComment(n.logId, n.tripId, reply);
    setSending(false);
    if (ok) { setReply(''); setSent(true); onReplied(); }
  };

  return (
    <Swipeable
      renderLeftActions={() => (
        <View style={styles.readAction}>
          <Ionicons name="checkmark" size={22} color="#fff" />
          <AppText variant="small" style={{ color: '#fff' }}>{t('noti.read')}</AppText>
        </View>
      )}
      leftThreshold={70}
      onSwipeableOpen={(direction) => { if (direction === 'left') onRead(); }}
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
