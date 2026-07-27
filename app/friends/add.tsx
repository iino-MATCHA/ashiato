import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { searchUsers, fetchSuggestedUsers, sendFriendRequest, type UserSummary } from '@/lib/api';

export default function AddFriend() {
  const { palette } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [suggested, setSuggested] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const alive = useRef(true);

  // suggested users on open
  useFocusEffect(useCallback(() => {
    alive.current = true;
    if (isSupabaseConfigured) fetchSuggestedUsers().then((u) => alive.current && setSuggested(u)).catch(() => {});
    return () => { alive.current = false; };
  }, []));

  // debounced DB search
  useEffect(() => {
    const term = q.trim();
    if (!term || !isSupabaseConfigured) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchUsers(term);
      if (alive.current) { setResults(r); setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = async (id: string) => {
    setSent((s) => ({ ...s, [id]: true })); // optimistic
    const ok = await sendFriendRequest(id);
    if (!ok) setSent((s) => ({ ...s, [id]: false }));
  };

  const list = q.trim() ? results : suggested;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Add friends" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="search" size={18} color={palette.inkFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or username"
            placeholderTextColor={palette.inkFaint}
            style={[styles.searchInput, { color: palette.ink }]}
            autoCapitalize="none"
          />
          {searching && <ActivityIndicator size="small" color={palette.inkFaint} />}
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>{q.trim() ? 'Results' : 'Suggested'}</Eyebrow>
        <Gap h={space.md} />
        <Rule />
        {list.map((u) => (
          <View key={u.id}>
            <Row style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: palette.fill }]}>
                {u.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={20} color={palette.matcha} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{u.name}</AppText>
                <AppText variant="small" tone="inkFaint">@{u.username}</AppText>
              </View>
              <Pressable
                onPress={() => !sent[u.id] && add(u.id)}
                style={[styles.addBtn, { borderColor: sent[u.id] ? palette.rule : palette.matcha }]}
              >
                <AppText variant="small" tone={sent[u.id] ? 'inkFaint' : 'matcha'}>
                  {sent[u.id] ? 'Requested' : 'Add'}
                </AppText>
              </Pressable>
            </Row>
            <Rule />
          </View>
        ))}
        {q.trim() !== '' && !searching && results.length === 0 && (
          <><Gap h={space.md} /><AppText variant="small" tone="inkFaint">No one found for “{q.trim()}”.</AppText></>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addBtn: { borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 999 },
});
