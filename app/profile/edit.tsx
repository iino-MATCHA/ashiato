import { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Image, Modal, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { DateInput } from '@/components/DateInput';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useProfile } from '@/lib/useProfile';
import { PhotoPicker } from '@/components/PhotoPicker';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadAvatar } from '@/lib/api';
import { useI18n, LOCALES } from '@/lib/i18n';
import { NATIONALITIES } from '@/lib/nationalities';

export default function EditProfile() {
  const { palette } = useTheme();
  const { profile, update } = useProfile();
  const { t, locale, setLocale } = useI18n();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [nationality, setNationality] = useState(profile.nationality);
  const [residence, setResidence] = useState(profile.residence || 'domestic');
  const [natOpen, setNatOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // profile loads async — prefill once it arrives
  useEffect(() => {
    if (!ready && (profile.name || profile.username)) {
      setName(profile.name); setUsername(profile.username); setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl); setAvatarPreview(profile.avatarUrl);
      setBirthDate(profile.birthDate); setNationality(profile.nationality);
      setResidence(profile.residence || 'domestic');
      setReady(true);
    }
  }, [profile, ready]);

  const pickAvatar = (files: File[]) => {
    const f = files[0];
    if (f) { setAvatarBlob(f); setAvatarPreview(URL.createObjectURL(f)); }
  };

  const save = async () => {
    setSaving(true);
    let url = avatarUrl;
    if (avatarBlob && isSupabaseConfigured) url = (await uploadAvatar(avatarBlob)) ?? avatarUrl;
    await update({
      name: name.trim() || profile.name,
      username: username.trim() || profile.username,
      bio: bio.trim(),
      avatarUrl: url,
      birthDate,
      nationality,
      residence,
    });
    setSaving(false);
    router.back();
  };

  const selectedNat = NATIONALITIES.find((n) => n.code === nationality);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('profile.edit')} />
      <Rule />
      {/* 項目が増えたので必ずスクロールできるようにする（以前は View でスクロール不可だった） */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Gap h={space.lg} />
          <Row style={{ justifyContent: 'center' }}>
            <PhotoPicker onPick={pickAvatar} style={[styles.avatar, { backgroundColor: palette.fill, borderColor: palette.matcha }]}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={38} color={palette.matcha} />
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </PhotoPicker>
          </Row>

          <Gap h={space.xl} />
          <Field label={t('profile.displayName')} value={name} onChangeText={setName} placeholder="Your name" palette={palette} />
          <Field label={t('profile.username')} value={username} onChangeText={setUsername} placeholder="username" prefix="@" palette={palette} autoCapitalize="none" />
          <Field label={t('profile.bio')} value={bio} onChangeText={setBio} placeholder="A line about you" palette={palette} multiline />

          <View style={{ marginBottom: space.lg }}>
            <AppText variant="small" tone="inkSoft">{t('profile.birthDate')}</AppText>
            <Gap h={4} />
            <DateInput value={birthDate} onChange={setBirthDate} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>

          {/* 国籍は自由入力をやめて選択式に（分析でコードの揺れを無くす） */}
          <View style={{ marginBottom: space.lg }}>
            <AppText variant="small" tone="inkSoft">{t('profile.nationality')}</AppText>
            <Pressable onPress={() => setNatOpen(true)} style={styles.selectRow}>
              <AppText style={styles.input} tone={selectedNat ? 'ink' : 'inkFaint'}>
                {selectedNat ? `${selectedNat.flag}  ${selectedNat.en}` : t('profile.selectNationality')}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={palette.inkFaint} />
            </Pressable>
            <Rule strong />
          </View>

          <AppText variant="small" tone="inkSoft">{t('profile.residence')}</AppText>
          <Gap h={space.sm} />
          <Row style={{ gap: space.sm, marginBottom: space.lg }}>
            {[
              { key: 'domestic', label: t('profile.resident') },
              { key: 'inbound', label: t('profile.visiting') },
            ].map((o) => {
              const on = residence === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setResidence(o.key)}
                  style={[styles.segment, { borderColor: on ? palette.matcha : palette.ruleStrong }, on && { backgroundColor: palette.matcha }]}
                >
                  <AppText variant="small" style={{ color: on ? '#fff' : palette.inkSoft }}>{o.label}</AppText>
                </Pressable>
              );
            })}
          </Row>

          {/* UI言語（保存を待たず即時反映。localStorage + profiles.language に保持） */}
          <AppText variant="small" tone="inkSoft">{t('profile.language')}</AppText>
          <Gap h={space.sm} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
            {LOCALES.map((l) => {
              const on = locale === l.key;
              return (
                <Pressable
                  key={l.key}
                  onPress={() => setLocale(l.key)}
                  style={[styles.segmentFit, { borderColor: on ? palette.matcha : palette.ruleStrong }, on && { backgroundColor: palette.matcha }]}
                >
                  <AppText variant="small" style={{ color: on ? '#fff' : palette.inkSoft }}>{l.label}</AppText>
                </Pressable>
              );
            })}
          </View>

          <Gap h={space.md} />
          <Button label={saving ? t('common.saving') : t('common.save')} tone="matcha" onPress={save} disabled={saving} />
        </View>
      </ScrollView>

      {/* 国籍ピッカー */}
      <Modal visible={natOpen} transparent animationType="fade" onRequestClose={() => setNatOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setNatOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.washi }]} onPress={() => {}}>
            <AppText variant="h3" tone="ink">{t('profile.selectNationality')}</AppText>
            <Gap h={space.md} />
            <FlatList
              data={NATIONALITIES}
              keyExtractor={(n) => n.code}
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const on = item.code === nationality;
                return (
                  <Pressable
                    onPress={() => { setNationality(item.code); setNatOpen(false); }}
                    style={({ pressed }) => [styles.natRow, pressed && { opacity: 0.6 }]}
                  >
                    <AppText variant="body" tone="ink" style={{ width: 32 }}>{item.flag}</AppText>
                    <AppText variant="body" tone={on ? 'matcha' : 'ink'} style={{ flex: 1 }}>{item.en}</AppText>
                    {on && <Ionicons name="checkmark" size={18} color={palette.matcha} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, prefix, palette, ...rest }: any) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <AppText variant="small" tone="inkSoft">{label}</AppText>
      <Row style={{ gap: 2 }}>
        {prefix && <AppText style={styles.input} tone="inkFaint">{prefix}</AppText>}
        <TextInput placeholderTextColor={palette.inkFaint} style={[styles.input, { color: palette.ink, flex: 1 }]} {...rest} />
      </Row>
      <Rule strong />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  input: { fontFamily: fonts.minchoMedium, fontSize: type.h3, paddingVertical: space.sm },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, borderWidth: hairline * 2 },
  segmentFit: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: hairline * 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 360, borderRadius: 16, padding: space.lg },
  natRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: space.sm },
});
