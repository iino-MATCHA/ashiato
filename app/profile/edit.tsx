import { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Image } from 'react-native';
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

export default function EditProfile() {
  const { palette } = useTheme();
  const { profile, update } = useProfile();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [nationality, setNationality] = useState(profile.nationality);
  const [residence, setResidence] = useState(profile.residence || 'domestic');
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
      nationality: nationality.trim().toUpperCase(),
      residence,
    });
    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Edit profile" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg, alignItems: 'center' }}>
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
          <Field label="Display name" value={name} onChangeText={setName} placeholder="Your name" palette={palette} />
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="username" prefix="@" palette={palette} autoCapitalize="none" />
          <Field label="Bio" value={bio} onChangeText={setBio} placeholder="A line about you" palette={palette} multiline />

          <View style={{ marginBottom: space.lg }}>
            <AppText variant="small" tone="inkSoft">Date of birth</AppText>
            <Gap h={4} />
            <DateInput value={birthDate} onChange={setBirthDate} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>

          <Field label="Nationality (e.g. JP, TW, US)" value={nationality} onChangeText={setNationality} placeholder="JP" palette={palette} autoCapitalize="characters" maxLength={2} />

          <AppText variant="small" tone="inkSoft">Living in Japan?</AppText>
          <Gap h={space.sm} />
          <Row style={{ gap: space.sm, marginBottom: space.lg }}>
            {[
              { key: 'domestic', label: 'Resident' },
              { key: 'inbound', label: 'Visiting' },
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

          <Gap h={space.md} />
          <Button label={saving ? 'Saving…' : 'Save'} tone="matcha" onPress={save} disabled={saving} />
        </View>
      </View>
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
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, borderWidth: hairline * 2 },
});
