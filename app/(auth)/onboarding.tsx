import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Screen, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export default function Onboarding() {
  const { palette } = useTheme();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [notify, setNotify] = useState(true);
  const [collectNotify, setCollectNotify] = useState(true);

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Gap h={space.xl} />
      <Eyebrow>STEP 02 — SET UP</Eyebrow>
      <Gap h={space.md} />
      <AppText variant="h1" tone="ink">Tell us a little{'\n'}about yourself</AppText>

      <Gap h={space.xl} />
      <AppText variant="eyebrow" tone="inkFaint">Profile</AppText>
      <Gap h={space.md} />
      <Row style={{ gap: space.md, alignItems: 'center' }}>
        <Pressable style={[styles.avatar, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="camera-outline" size={22} color={palette.inkFaint} />
        </Pressable>
        <AppText variant="small" tone="inkSoft" style={{ flex: 1 }}>Add a photo{'\n'}(you can change this later)</AppText>
      </Row>

      <Gap h={space.lg} />
      <Field label="Display name" placeholder="Taro Yamada" value={name} onChangeText={setName} palette={palette} />
      <Field label="Username" placeholder="taro" prefix="@" value={username} onChangeText={setUsername} palette={palette} />

      <Gap h={space.xl} />
      <AppText variant="eyebrow" tone="inkFaint">Notifications</AppText>
      <Gap h={space.sm} />
      <Rule />
      <ToggleRow title="Trip updates" desc="When a travel companion adds a stop or photo" value={notify} onValueChange={setNotify} palette={palette} />
      <Rule />
      <ToggleRow title="Goshuin & photo book" desc="When your collection or order changes" value={collectNotify} onValueChange={setCollectNotify} palette={palette} />
      <Rule />

      <Gap h={space.md} />
      <Row style={{ gap: space.sm, alignItems: 'flex-start' }}>
        <Ionicons name="location-outline" size={16} color={palette.aiSoft} style={{ marginTop: 2 }} />
        <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
          Ashiato never tracks your location in the background. You record places yourself when you add a stop.
        </AppText>
      </Row>

      <Gap h={space.xl} />
      <Button label="Get started" tone="shu" onPress={() => router.replace('/(tabs)/map')} />
    </Screen>
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

function ToggleRow({ title, desc, value, onValueChange, palette }: any) {
  return (
    <Row style={{ paddingVertical: space.md, gap: space.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" tone="ink">{title}</AppText>
        <AppText variant="small" tone="inkFaint">{desc}</AppText>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: palette.ai, false: palette.rule }} thumbColor={palette.paper} />
    </Row>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: hairline * 2, alignItems: 'center', justifyContent: 'center' },
  input: { fontFamily: fonts.minchoMedium, fontSize: type.h3, paddingVertical: space.sm },
});
