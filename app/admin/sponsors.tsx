/**
 * /admin/sponsors — スポンサーカードの管理（superadmin のみ書ける）。
 *
 * /explore の「注目の旅」に混ぜて出すカード。旅カードと同じ見た目で、
 * 題の下にサービス名（Display name）を出すことで出所を示す
 * （「PR」の文字は置かない方針。オーナー判断）。
 * Company は社内向けの覚え書きで、画面には出さない。
 */
import { useCallback, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AdminShell, Panel } from '@/components/admin/AdminShell';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchAllSponsoredCards, saveSponsoredCard, deleteSponsoredCard, type SponsoredCard,
} from '@/lib/api';

const EMPTY_FORM = {
  company: '', displayName: '', title: '', url: '', imageUrl: '', active: true, position: '0',
};

export default function AdminSponsors() {
  const { palette } = useTheme();
  const { role } = useAdmin();
  const [cards, setCards] = useState<SponsoredCard[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return setCards([]);
    fetchAllSponsoredCards().then(setCards).catch(() => setCards([]));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = (key: keyof typeof EMPTY_FORM) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const startEdit = (c: SponsoredCard) => {
    setEditingId(c.id);
    setForm({
      company: c.company, displayName: c.displayName, title: c.title,
      url: c.url, imageUrl: c.imageUrl, active: c.active, position: String(c.position),
    });
    setMsg(null);
  };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); setMsg(null); };

  const canSave =
    form.company.trim() && form.displayName.trim() && form.title.trim() &&
    form.url.trim() && form.imageUrl.trim();

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setMsg(null);
    const ok = await saveSponsoredCard({
      id: editingId ?? undefined,
      company: form.company.trim(),
      displayName: form.displayName.trim(),
      title: form.title.trim(),
      url: form.url.trim(),
      imageUrl: form.imageUrl.trim(),
      active: form.active,
      position: Number.parseInt(form.position, 10) || 0,
    });
    setBusy(false);
    if (ok) {
      cancelEdit();
      load();
    } else {
      // RLSに弾かれたときもここに来る（書けるのは superadmin だけ）
      setMsg('Could not save. Only superadmins can write sponsored cards.');
    }
  };

  /** 一覧から表示/非表示だけを切り替える（削除せずに下げられるように） */
  const toggleActive = async (c: SponsoredCard) => {
    if (busy) return;
    setBusy(true);
    const ok = await saveSponsoredCard({ ...c, active: !c.active });
    setBusy(false);
    if (ok) load();
    else setMsg('Could not update. Only superadmins can write sponsored cards.');
  };

  const remove = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    setBusy(true);
    const ok = await deleteSponsoredCard(id);
    setBusy(false);
    if (ok) { if (editingId === id) cancelEdit(); load(); }
    else setMsg('Could not delete. Only superadmins can write sponsored cards.');
  };

  return (
    <AdminShell title="Sponsors" role={role}>
      <AppText variant="small" tone="inkFaint">
        Sponsored cards are mixed into the Featured journeys carousel on /explore,
        styled like the journey cards. The display name shown under the title is the attribution.
      </AppText>

      {/* 追加 / 編集 */}
      <Gap h={space.lg} />
      <Eyebrow tone="matcha">{editingId ? 'Edit card' : 'New card'}</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <Field label="Company (internal, not shown)" value={form.company} onChange={set('company')} placeholder="e.g. ACME Travel Inc." palette={palette} />
        <Field label="Display name (shown under the title)" value={form.displayName} onChange={set('displayName')} placeholder="e.g. ACME Rail Pass" palette={palette} />
        <Field label="Title" value={form.title} onChange={set('title')} placeholder="Card headline" palette={palette} />
        <Field label="URL" value={form.url} onChange={set('url')} placeholder="https://…" palette={palette} keyboardType="url" />
        <Field
          label="Background image URL"
          value={form.imageUrl}
          onChange={set('imageUrl')}
          placeholder="https://…"
          palette={palette}
          keyboardType="url"
          hint="Recommended: 1600×1000px or larger, 16:10, JPEG/WebP."
        />

        <Row style={{ gap: space.lg, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">Position</AppText>
            <TextInput
              value={form.position}
              onChangeText={set('position')}
              placeholder="0"
              placeholderTextColor={palette.inkFaint}
              keyboardType="number-pad"
              style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
            />
            <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>Lower comes first.</AppText>
          </View>
          <Row style={{ gap: space.sm, alignItems: 'center' }}>
            <AppText variant="eyebrow" tone="inkFaint">Active</AppText>
            <Switch
              value={form.active}
              onValueChange={(v) => setForm((f) => ({ ...f, active: v }))}
              trackColor={{ true: palette.matcha, false: palette.fill }}
              thumbColor="#fff"
            />
          </Row>
        </Row>

        <Gap h={space.lg} />
        <Row style={{ gap: space.sm }}>
          <Pressable
            disabled={!canSave || busy}
            onPress={save}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: canSave ? palette.matcha : palette.fill },
              (pressed || busy) && { opacity: 0.7 },
            ]}
          >
            <AppText variant="bodyStrong" style={{ color: canSave ? '#fff' : palette.inkFaint, fontSize: 14 }}>
              {busy ? '…' : editingId ? 'Save changes' : 'Add card'}
            </AppText>
          </Pressable>
          {editingId && (
            <Pressable onPress={cancelEdit} style={[styles.btn, { backgroundColor: palette.fill }]}>
              <AppText variant="bodyStrong" tone="inkFaint" style={{ fontSize: 14 }}>Cancel</AppText>
            </Pressable>
          )}
        </Row>
        {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{msg}</AppText></>)}
      </Panel>

      {/* 一覧 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">Cards</Eyebrow>
      <Gap h={space.md} />
      {cards === null ? (
        <AppText variant="small" tone="inkFaint">Loading…</AppText>
      ) : cards.length === 0 ? (
        <View style={[styles.empty, { borderColor: palette.rule }]}>
          <Ionicons name="megaphone-outline" size={22} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" center>No sponsored cards yet. Add one above.</AppText>
        </View>
      ) : (
        <Panel>
          {cards.map((c, i) => (
            <View key={c.id}>
              {i > 0 && <Rule />}
              <Row style={styles.cardRow}>
                <View style={[styles.thumb, { backgroundColor: palette.fill }]}>
                  {!!c.imageUrl && <Image source={{ uri: c.imageUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodyStrong" tone={c.active ? 'ink' : 'inkFaint'} numberOfLines={1}>{c.title}</AppText>
                  <AppText variant="small" tone="inkFaint" numberOfLines={1}>
                    {c.displayName} · {c.company} · pos {c.position}{c.active ? '' : ' · hidden'}
                  </AppText>
                </View>
                <Row style={{ gap: space.md, alignItems: 'center' }}>
                  <Pressable onPress={() => startEdit(c)} hitSlop={6}>
                    <AppText variant="small" tone="matcha">Edit</AppText>
                  </Pressable>
                  <Pressable onPress={() => toggleActive(c)} hitSlop={6}>
                    <AppText variant="small" tone="inkFaint">{c.active ? 'Hide' : 'Show'}</AppText>
                  </Pressable>
                  <Pressable onPress={() => remove(c.id)} hitSlop={6}>
                    <AppText variant="small" tone="shu">{confirmDelete === c.id ? 'Sure?' : 'Delete'}</AppText>
                  </Pressable>
                </Row>
              </Row>
            </View>
          ))}
        </Panel>
      )}
      <View style={{ height: space.xl }} />
    </AdminShell>
  );
}

function Field({
  label, value, onChange, placeholder, palette, hint, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  palette: any;
  hint?: string;
  keyboardType?: 'url' | 'default';
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      <AppText variant="eyebrow" tone="inkFaint">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.inkFaint}
        autoCapitalize="none"
        keyboardType={keyboardType}
        style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
      />
      {!!hint && <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>{hint}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: hairline * 2,
    paddingVertical: 8,
    fontFamily: fonts.gothicRegular,
    fontSize: type.body,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { borderWidth: hairline, borderStyle: 'dashed', borderRadius: 10, padding: space.lg, alignItems: 'center', gap: 6 },
  cardRow: { gap: space.md, alignItems: 'center', paddingVertical: 10 },
  thumb: { width: 64, height: 40, borderRadius: 6, overflow: 'hidden' },
});
