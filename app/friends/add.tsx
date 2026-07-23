import { useState } from 'react';
import { View, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { suggestedFriends } from '@/lib/mock';

export default function AddFriend() {
  const { palette } = useTheme();
  const [sent, setSent] = useState<Record<string, boolean>>({});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Add friends" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <Row style={[styles.search, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="search" size={18} color={palette.inkFaint} />
          <TextInput placeholder="Search by username" placeholderTextColor={palette.inkFaint} style={[styles.searchInput, { color: palette.ink }]} autoCapitalize="none" />
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>Suggested</Eyebrow>
        <Gap h={space.md} />
        <Rule />
        {suggestedFriends.map((f) => (
          <View key={f.id}>
            <Row style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: f.color }]}>
                <AppText variant="bodyStrong" style={{ color: '#fff' }}>{f.name.slice(0, 1)}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" tone="ink">{f.name}</AppText>
                <AppText variant="small" tone="inkFaint">@{f.username}</AppText>
              </View>
              <Pressable
                onPress={() => setSent((s) => ({ ...s, [f.id]: !s[f.id] }))}
                style={[styles.addBtn, { borderColor: sent[f.id] ? palette.rule : palette.matcha }, sent[f.id] && { backgroundColor: 'transparent' }]}
              >
                <AppText variant="small" tone={sent[f.id] ? 'inkFaint' : 'matcha'}>
                  {sent[f.id] ? 'Requested' : 'Add'}
                </AppText>
              </Pressable>
            </Row>
            <Rule />
          </View>
        ))}

        <Gap h={space.lg} />
        <Row style={{ gap: 6 }}>
          <Ionicons name="information-circle-outline" size={14} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
            Sending requests will be wired to Supabase (friend_requests) once auth is connected.
          </AppText>
        </Row>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { alignItems: 'center', gap: space.sm, borderBottomWidth: hairline * 2, paddingBottom: space.sm },
  searchInput: { flex: 1, fontFamily: fonts.gothicRegular, fontSize: type.body, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  addBtn: { borderWidth: hairline * 2, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 999 },
});
