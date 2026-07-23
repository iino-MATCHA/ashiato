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
  const [photoNotify, setPhotoNotify] = useState(true);

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Gap h={space.xl} />
      <Eyebrow>STEP 02 — はじめの設定</Eyebrow>
      <Gap h={space.md} />
      <AppText variant="h1" tone="ink">
        あなたのことを{'\n'}少しだけ教えてください
      </AppText>

      <Gap h={space.xl} />

      {/* プロフィール */}
      <AppText variant="eyebrow" tone="inkFaint">プロフィール</AppText>
      <Gap h={space.md} />

      <Row style={{ gap: space.md, alignItems: 'center' }}>
        <Pressable style={[styles.avatar, { borderColor: palette.ruleStrong }]}>
          <Ionicons name="camera-outline" size={22} color={palette.inkFaint} />
        </Pressable>
        <AppText variant="small" tone="inkSoft" style={{ flex: 1 }}>
          写真を追加{'\n'}（あとで変更できます）
        </AppText>
      </Row>

      <Gap h={space.lg} />
      <Field
        label="表示名"
        placeholder="山田 太郎"
        value={name}
        onChangeText={setName}
        palette={palette}
      />
      <Field
        label="ユーザー名"
        placeholder="taro"
        prefix="@"
        value={username}
        onChangeText={setUsername}
        palette={palette}
      />

      <Gap h={space.xl} />

      {/* 通知（位置情報は常時取得しないため、ここでは求めない） */}
      <AppText variant="eyebrow" tone="inkFaint">通知</AppText>
      <Gap h={space.sm} />
      <Rule />
      <ToggleRow
        title="旅の更新をお知らせ"
        desc="同行者がStepや写真を追加したとき"
        value={notify}
        onValueChange={setNotify}
        palette={palette}
      />
      <Rule />
      <ToggleRow
        title="御朱印の獲得・製本の完了"
        desc="コレクションや注文に動きがあったとき"
        value={photoNotify}
        onValueChange={setPhotoNotify}
        palette={palette}
      />
      <Rule />

      <Gap h={space.md} />
      <Row style={{ gap: space.sm, alignItems: 'flex-start' }}>
        <Ionicons name="location-outline" size={16} color={palette.aiSoft} style={{ marginTop: 2 }} />
        <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
          足跡は位置情報を常時取得しません。訪れた場所は、Stepを作るときにあなたが選んで記録します。
        </AppText>
      </Row>

      <Gap h={space.xl} />
      <Button label="はじめる" tone="shu" onPress={() => router.replace('/(tabs)/map')} />
    </Screen>
  );
}

function Field({
  label,
  prefix,
  palette,
  ...rest
}: any) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <AppText variant="small" tone="inkSoft">{label}</AppText>
      <Row style={{ gap: 2 }}>
        {prefix && (
          <AppText style={styles.input} tone="inkFaint">{prefix}</AppText>
        )}
        <TextInput
          placeholderTextColor={palette.inkFaint}
          style={[styles.input, { color: palette.ink, flex: 1 }]}
          {...rest}
        />
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: palette.ai, false: palette.rule }}
        thumbColor={palette.paper}
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: hairline * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.minchoMedium,
    fontSize: type.h3,
    paddingVertical: space.sm,
  },
});
