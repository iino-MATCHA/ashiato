/**
 * /admin/manage — 運営作業のページ。製本の注文、管理者の付け外し、直近の登録と旅。
 *
 * 管理者の付け外しは 0032 の admin_set_role() を叩く。
 * 真偽値ではなく理由が返るので、「いない利用者」「権限が足りない」「自分自身」を
 * 言い分けられる ―― できませんでした、だけだと直しようがない。
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Gap, Eyebrow } from '@/components/ui';
import { AdminShell, Panel, TableRow } from '@/components/admin/AdminShell';
import { Segmented } from '@/components/admin/Charts';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { setAdminRoleByEmail, fetchMyEmail, type AdminEmailResult } from '@/lib/api';

/** admin_role 型（0002）の3つ。これ以外は入れない */
const ROLES = [
  { key: 'viewer', label: '閲覧のみ' },
  { key: 'moderator', label: '編集' },
  { key: 'superadmin', label: '全権' },
];
const ROLE_LABEL: Record<string, string> = {
  viewer: '閲覧のみ', moderator: '編集', superadmin: '全権',
};

/** 注文の状態（/admin/orders と同じ言い方に揃える） */
const ORDER_LABEL: Record<string, string> = {
  pending: '未入金', paid: '入金済み', printing: '印刷中', shipped: '発送済み',
  delivered: 'お届け済み', cancelled: 'キャンセル', refunded: '返金済み',
};

/** 結果を日本語の一言に。何が悪かったのかまで書く */
function messageFor(result: AdminEmailResult, email: string, roleLabel: string): string {
  switch (result) {
    case 'ok': return `${email} を「${roleLabel}」にしました。`;
    case 'not_found':
      return `${email} の利用者が見つかりません。そのアドレスで登録が済んでいるか確かめてください。`;
    case 'self': return '自分の権限は変えられません。ほかの全権の管理者に頼んでください。';
    case 'owner': return 'このアドレスの全権は外せません。';
    case 'forbidden': return '管理者の付け外しができるのは全権の管理者だけです。';
    case 'bad_role': return 'その権限は使えません（閲覧のみ / 編集 / 全権 のどれか）。';
    default: return '変更できませんでした。少し時間をおいて試してください。';
  }
}

export default function AdminManage() {
  const { palette } = useTheme();
  const { role, stats, orders, admins, reload } = useAdmin();
  const [grantEmail, setGrantEmail] = useState('');
  const [grantRole, setGrantRole] = useState('moderator');
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState<string | null>(null);

  useEffect(() => { fetchMyEmail().then(setMe).catch(() => setMe(null)); }, []);

  const canManage = role === 'superadmin';

  const show = useCallback((result: AdminEmailResult, email: string, roleLabel: string) => {
    setOk(result === 'ok');
    setMsg(messageFor(result, email, roleLabel));
  }, []);

  const grant = async () => {
    const email = grantEmail.trim().toLowerCase();
    if (!email || busy) return;
    setBusy(true);
    setMsg(null);
    const result = await setAdminRoleByEmail(email, grantRole);
    setBusy(false);
    show(result, email, ROLE_LABEL[grantRole] ?? grantRole);
    if (result === 'ok') { setGrantEmail(''); reload(); }
  };

  /** 権限を外す。押し間違いが効くので2度押しにする */
  const revoke = async (email: string) => {
    if (busy) return;
    if (confirmOff !== email) { setConfirmOff(email); return; }
    setConfirmOff(null);
    setBusy(true);
    setMsg(null);
    const result = await setAdminRoleByEmail(email, null);
    setBusy(false);
    setOk(result === 'ok');
    setMsg(result === 'ok'
      ? `${email} の管理者権限を外しました。`
      : messageFor(result, email, ''));
    if (result === 'ok') reload();
  };

  return (
    <AdminShell title="運営" role={role}>
      {/* 製本 */}
      <Eyebrow tone="matcha">製本の注文</Eyebrow>
      <Gap h={space.md} />
      {(orders ?? []).length === 0 ? (
        <View style={[styles.empty, { borderColor: palette.rule }]}>
          <Ionicons name="book-outline" size={22} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" center>注文はまだありません。買われるとここに並びます。</AppText>
        </View>
      ) : (
        <Panel>
          <TableRow cells={['注文日', '買った人', '本', '状態', '¥']} header wide={2} />
          {(orders ?? []).map((o: any) => (
            <TableRow
              key={o.id}
              wide={2}
              cells={[o.ordered, `@${o.buyer ?? '-'}`, o.book_title ?? '-', ORDER_LABEL[o.status] ?? o.status, String(o.amount_jpy ?? 0)]}
            />
          ))}
        </Panel>
      )}

      {/* 管理者 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">管理者</Eyebrow>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">
        閲覧のみ＝見るだけ。編集＝注文や記事を触れる。全権＝広告と管理者の付け外しまで。
      </AppText>
      <Gap h={space.md} />
      <Panel>
        {admins.length === 0 && <AppText variant="small" tone="inkFaint">まだ誰もいません。</AppText>}
        {admins.map((a) => (
          <Row key={a.email || a.username} style={styles.adminRow}>
            <Ionicons name="shield-checkmark" size={16} color={palette.matcha} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="bodyStrong" tone="ink">{a.email || a.name}</AppText>
              <AppText variant="small" tone="inkFaint">
                {ROLE_LABEL[a.role] ?? a.role}
                {a.isOwner ? '（持ち主）' : a.email && a.email === me ? '（自分）' : ''}
              </AppText>
            </View>
            {canManage && !a.isOwner && a.email !== me && !!a.email && (
              <Pressable onPress={() => revoke(a.email)} hitSlop={8}>
                <AppText variant="small" tone="shu">{confirmOff === a.email ? '外しますか？' : '外す'}</AppText>
              </Pressable>
            )}
          </Row>
        ))}
      </Panel>

      {canManage ? (
        <>
          <Gap h={space.md} />
          <AppText variant="eyebrow" tone="inkFaint">権限</AppText>
          <Gap h={space.sm} />
          <Segmented options={ROLES} value={grantRole} onChange={setGrantRole} />
          <Gap h={space.md} />
          <View style={[styles.grantBar, { borderColor: palette.ruleStrong }]}>
            <TextInput
              value={grantEmail}
              onChangeText={setGrantEmail}
              placeholder="メールアドレス"
              placeholderTextColor={palette.inkFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.grantInput, { color: palette.ink }]}
              onSubmitEditing={grant}
            />
            <Pressable
              onPress={grant}
              disabled={!grantEmail.trim() || busy}
              style={[styles.grantBtn, { backgroundColor: grantEmail.trim() && !busy ? palette.matcha : palette.fill }]}
            >
              <AppText variant="small" style={{ color: grantEmail.trim() && !busy ? '#fff' : palette.inkFaint }}>
                {busy ? '…' : '追加'}
              </AppText>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint">管理者の付け外しができるのは全権の管理者だけです。</AppText>
        </>
      )}
      {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone={ok ? 'matcha' : 'shu'}>{msg}</AppText></>)}

      {/* 直近 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">最近の登録</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['登録日', '名前', 'ユーザー名']} header />
        {(stats?.recent_users ?? []).map((u: any) => (
          <TableRow key={u.username} cells={[u.joined, u.display_name ?? '-', `@${u.username}`]} />
        ))}
      </Panel>

      <Gap h={space.xl} />
      <Eyebrow tone="matcha">最近の旅</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <TableRow cells={['作成日', '題', '持ち主', '公開']} header />
        {(stats?.recent_trips ?? []).map((t: any, i: number) => (
          <TableRow
            key={`${t.title}-${i}`}
            cells={[t.created, t.title, `@${t.owner ?? '-'}`, t.visibility === 'public' ? '公開' : '非公開']}
          />
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
