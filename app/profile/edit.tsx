import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useProfile } from '@/lib/useProfile';

export default function EditProfile() {
  const { palette } = useTheme();
  const { profile, update } = useProfile();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await update({ name: name.trim() || profile.name, username: username.trim() || profile.username, bio: bio.trim() });
    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Edit profile" />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <Row style={{ justifyContent: 'center' }}>
          <View style={[styles.avatar, { backgroundColor: palette.matcha }]}>
            <AppText variant="h1" style={{ color: '#fff' }}>{(name || 'T').slice(0, 1)}</AppText>
          </View>
        </Row>

        <Gap h={space.xl} />
        <Field label="Display name" value={name} onChangeText={setName} placeholder="Your name" palette={palette} />
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="username" prefix="@" palette={palette} autoCapitalize="none" />
        <Field label="Bio" value={bio} onChangeText={setBio} placeholder="A line about you" palette={palette} multiline />

        <Gap h={space.xl} />
        <Button label={saving ? 'Saving…' : 'Save'} tone="matcha" onPress={save} disabled={saving} />
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
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  input: { fontFamily: fonts.minchoMedium, fontSize: type.h3, paddingVertical: space.sm },
});
