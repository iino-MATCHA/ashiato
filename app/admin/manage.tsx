/**
 * /admin/manage — 運営作業のページ。製本の注文、管理者の管理、直近の登録と旅。
 */
import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel, TableRow } from '@/components/admin/AdminShell';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { setAdminRole } from '@/lib/api';

export default function AdminManage() {
  const { palette } = useTheme();
  const { role, stats, orders, admins, reload } = useAdmin();
  const [grantName, setGrantName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const grant = async () => {
    const name = grantName.trim().replace(/^@/, '');
    if (!name) return;
    setMsg(null);
    const ok = await setAdminRole(name, 'moderator');
    setMsg(ok ? `@${name} is now a moderator.` : `Could not find @${name}.`);
    setGrantName('');
    reload();
  };
  const revoke = async (username: string) => {
    await setAdminRole(username, null);
    reload();
  };

  return (
    <AdminShell title="Manage" role={role}>
      {/* 製本 */}
      <Eyebrow tone="matcha">Photo book orders</Eyebrow>
      <Gap h={space.md} />
      {(orders ?? []).length === 0 ? (
        <View style={[styles.empty, { borderColor: palette.rule }]}>
          <Ionicons name="book-outline" size={22} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" center>No orders yet. They will appear here once photo-book checkout launches.</AppText>
        </View>
      ) : (
        <Panel>
          <TableRow cells={['Ordered', 'Buyer', 'Book', 'Status', '¥']} header wide={2} />
          {(orders ?? []).map((o: any) => (
            <TableRow key={o.id} wide={2} cells={[o.ordered, `@${o.buyer ?? '-'}`, o.book_title ?? '-', o.status, String(o.amount_jpy ?? 0)]} />
          ))}
        </Panel>
      )}

      {/* 管理者 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Administrators</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        {admins.map((a) => (
          <Row key={a.username} style={styles.adminRow}>
            <Ionicons name="shield-checkmark" size={16} color={palette.matcha} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" tone="ink">{a.name}</AppText>
              <AppText variant="small" tone="inkFaint">@{a.username} · {a.role}</AppText>
            </View>
            {a.role !== 'superadmin' && (
              <Pressable onPress={() => revoke(a.username)} hitSlop={8}>
                <AppText variant="small" tone="shu">Remove</AppText>
              </Pressable>
            )}
          </Row>
        ))}
      </Panel>
      <Gap h={space.sm} />
      <View style={[styles.grantBar, { borderColor: palette.ruleStrong }]}>
        <TextInput
          value={grantName}
          onChangeText={setGrantName}
          placeholder="username to grant moderator"
          placeholderTextColor={palette.inkFaint}
          autoCapitalize="none"
          style={[styles.grantInput, { color: palette.ink }]}
          onSubmitEditing={grant}
        />
        <Pressable onPress={grant} style={[styles.grantBtn, { backgroundColor: grantName.trim() ? palette.matcha : palette.fill }]}>
          <AppText variant="small" style={{ color: grantName.trim() ? '#fff' : palette.inkFaint }}>Grant</AppText>
        </Pressable>
      </View>
      {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="inkSoft">{msg}</AppText></>)}

      {/* 直近 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Recent signups</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['Joined', 'Name', 'Username']} header />
        {(stats?.recent_users ?? []).map((u: any) => (
          <TableRow key={u.username} cells={[u.joined, u.display_name ?? '-', `@${u.username}`]} />
        ))}
      </Panel>

      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Recent trips</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['Created', 'Title', 'Owner', 'Visibility']} header />
        {(stats?.recent_trips ?? []).map((t: any, i: number) => (
          <TableRow key={`${t.title}-${i}`} cells={[t.created, t.title, `@${t.owner ?? '-'}`, t.visibility]} />
        ))}
      </Panel>
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  empty: { borderWidth: hairline, borderStyle: 'dashed', borderRadius: 10, padding: space.lg, alignItems: 'center', gap: 6 },
  adminRow: { gap: space.sm, alignItems: 'center', paddingVertical: 10, borderBottomWidth: hairline, borderBottomColor: 'rgba(0,0,0,0.05)' },
  grantBar: { position: 'relative', height: 44, borderWidth: hairline * 2, borderRadius: 22, justifyContent: 'center' },
  grantInput: { fontFamily: fonts.gothicRegular, fontSize: type.small, paddingLeft: space.md, paddingRight: 76, minWidth: 0 },
  grantBtn: { position: 'absolute', right: 5, top: 5, height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
