/**
 * /admin/sponsors — スポンサーカードの管理（全権の管理者だけが書ける）。
 *
 * /explore の「注目の旅」に混ぜて出すカード。旅カードと同じ見た目で、
 * 題の下にサービス名（表示名）を出すことで出所を示す
 * （「PR」の文字は置かない方針。オーナー判断）。
 * 会社名は社内向けの覚え書きで、画面には出さない。
 *
 * 背景画像は**この画面から上げる**。URLを貼るだけだと、相手のサイトの
 * 画像を直に指すことになり、消されたり差し替えられたりする。
 * 上げた画像は写真と同じ 'photos' バケットの `<自分のuid>/sponsors/` に入り、
 * 送る前に必ず 1600px に縮める（lib/api の uploadSponsorImage）。
 * URLを貼る道も残してあるが、そちらは控え。
 */
import { useCallback, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AdminShell, Panel } from '@/components/admin/AdminShell';
import { PhotoPicker } from '@/components/PhotoPicker';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useAdmin } from '@/lib/useAdmin';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchAllSponsoredCards, saveSponsoredCard, deleteSponsoredCard, uploadSponsorImage,
  type SponsoredCard,
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
  const [uploading, setUploading] = useState(false);
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

  /**
   * 画像を選んだら、その場で縮めて上げ、返ってきた公開URLを持つ。
   * 大きすぎて縮められなかったものは送らない（黙って原寸を送らない）。
   */
  const pickImage = async (files: File[]) => {
    const file = files[0];
    if (!file || uploading) return;
    setUploading(true);
    setMsg(null);
    const url = await uploadSponsorImage(file);
    setUploading(false);
    if (url) setForm((f) => ({ ...f, imageUrl: url }));
    else setMsg('画像を上げられませんでした。大きすぎるか、形式が読めない画像かもしれません。');
  };

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
      // RLSに弾かれたときもここに来る（書けるのは全権の管理者だけ）
      setMsg('保存できませんでした。広告を触れるのは全権の管理者だけです。');
    }
  };

  /** 一覧から表示/非表示だけを切り替える（削除せずに下げられるように） */
  const toggleActive = async (c: SponsoredCard) => {
    if (busy) return;
    setBusy(true);
    const ok = await saveSponsoredCard({ ...c, active: !c.active });
    setBusy(false);
    if (ok) load();
    else setMsg('変更できませんでした。広告を触れるのは全権の管理者だけです。');
  };

  const remove = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    setBusy(true);
    const ok = await deleteSponsoredCard(id);
    setBusy(false);
    if (ok) { if (editingId === id) cancelEdit(); load(); }
    else setMsg('消せませんでした。広告を触れるのは全権の管理者だけです。');
  };

  return (
    <AdminShell title="広告" role={role}>
      <AppText variant="small" tone="inkFaint">
        /explore の「注目の旅」の並びに、旅カードと同じ見た目で混ぜて出すカード。
        題の下に出る表示名が出所の表示を兼ねる。
      </AppText>

      {/* 追加 / 編集 */}
      <Gap h={space.lg} />
      <Eyebrow tone="matcha">{editingId ? 'カードを直す' : '新しいカード'}</Eyebrow>
      <Gap h={space.md} />
      <Panel>
        <Field label="会社名（社内用・画面には出ない）" value={form.company} onChange={set('company')} placeholder="例: 株式会社◯◯トラベル" palette={palette} />
        <Field label="表示名（題の下に出る）" value={form.displayName} onChange={set('displayName')} placeholder="例: ◯◯レールパス" palette={palette} />
        <Field label="題" value={form.title} onChange={set('title')} placeholder="カードの見出し" palette={palette} />
        <Field label="リンク先" value={form.url} onChange={set('url')} placeholder="https://…" palette={palette} keyboardType="url" />

        {/* 背景画像 */}
        <View style={{ marginBottom: space.md }}>
          <AppText variant="eyebrow" tone="inkFaint">背景画像</AppText>
          <Gap h={space.sm} />
          <Row style={{ gap: space.md, alignItems: 'center' }}>
            <View style={[styles.preview, { backgroundColor: palette.fill, borderColor: palette.rule }]}>
              {form.imageUrl
                ? <Image source={{ uri: form.imageUrl }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                : <Ionicons name="image-outline" size={20} color={palette.inkFaint} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <PhotoPicker onPick={pickImage} style={styles.pickBtnWrap}>
                <View style={[styles.pickBtn, { borderColor: palette.ruleStrong }]}>
                  <Ionicons name="cloud-upload-outline" size={16} color={palette.matcha} />
                  <AppText variant="small" tone="matcha">
                    {uploading ? '上げています…' : form.imageUrl ? '画像を選び直す' : '画像を選ぶ'}
                  </AppText>
                </View>
              </PhotoPicker>
              <Gap h={4} />
              <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                1600×1000px 以上・16:10・JPEG か WebP を推奨。送る前に縮めます。
              </AppText>
            </View>
          </Row>
        </View>

        {/* 控えの道。手元に画像が無く、URLしか無いときのため */}
        <Field
          label="画像のURLを貼る（画像を選べないとき）"
          value={form.imageUrl}
          onChange={set('imageUrl')}
          placeholder="https://…"
          palette={palette}
          keyboardType="url"
        />

        <Row style={{ gap: space.lg, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">並び順</AppText>
            <TextInput
              value={form.position}
              onChangeText={set('position')}
              placeholder="0"
              placeholderTextColor={palette.inkFaint}
              keyboardType="number-pad"
              style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
            />
            <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>小さいほど先に出る。</AppText>
          </View>
          <Row style={{ gap: space.sm, alignItems: 'center' }}>
            <AppText variant="eyebrow" tone="inkFaint">出す</AppText>
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
              {busy ? '…' : editingId ? '保存する' : '追加する'}
            </AppText>
          </Pressable>
          {editingId && (
            <Pressable onPress={cancelEdit} style={[styles.btn, { backgroundColor: palette.fill }]}>
              <AppText variant="bodyStrong" tone="inkFaint" style={{ fontSize: 14 }}>やめる</AppText>
            </Pressable>
          )}
        </Row>
        {!!msg && (<><Gap h={space.sm} /><AppText variant="small" tone="shu">{msg}</AppText></>)}
      </Panel>

      {/* 一覧 */}
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">いまのカード</Eyebrow>
      <Gap h={space.md} />
      {cards === null ? (
        <AppText variant="small" tone="inkFaint">読み込み中…</AppText>
      ) : cards.length === 0 ? (
        <View style={[styles.empty, { borderColor: palette.rule }]}>
          <Ionicons name="megaphone-outline" size={22} color={palette.inkFaint} />
          <AppText variant="small" tone="inkFaint" center>カードはまだありません。上から追加してください。</AppText>
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
                    {c.displayName} · {c.company} · 並び{c.position}{c.active ? '' : ' · 非表示'}
                  </AppText>
                </View>
                <Row style={{ gap: space.md, alignItems: 'center' }}>
                  <Pressable onPress={() => startEdit(c)} hitSlop={6}>
                    <AppText variant="small" tone="matcha">直す</AppText>
                  </Pressable>
                  <Pressable onPress={() => toggleActive(c)} hitSlop={6}>
                    <AppText variant="small" tone="inkFaint">{c.active ? '下げる' : '出す'}</AppText>
                  </Pressable>
                  <Pressable onPress={() => remove(c.id)} hitSlop={6}>
                    <AppText variant="small" tone="shu">{confirmDelete === c.id ? '消しますか？' : '消す'}</AppText>
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
  preview: { width: 96, height: 60, borderRadius: 6, overflow: 'hidden', borderWidth: hairline, alignItems: 'center', justifyContent: 'center' },
  // ピッカーは本物の <input type="file"> を透明に重ねる作りなので、
  // 押せる面そのものに大きさを持たせる（PhotoPicker の style がその面になる）
  pickBtnWrap: { alignSelf: 'flex-start', borderRadius: 999 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: hairline * 2 },
});
