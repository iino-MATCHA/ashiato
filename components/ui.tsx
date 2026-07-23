/**
 * 足跡 — 共通UIプリミティブ
 * ------------------------------------------------------------
 * 設計方針: Card/箱で囲わず、テキスト・余白・極細罫線で構成する。
 * すべて配色は useTheme() 経由でライト/ダーク両対応。
 */
import React from 'react';
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  type TextProps,
  type ViewProps,
  type ScrollViewProps,
  type PressableProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { fonts, type, space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/* ---------------------------------------------------------------- 文字 */

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'eyebrow'
  | 'mono';

type ToneKey =
  | 'ink'
  | 'inkSoft'
  | 'inkFaint'
  | 'ai'
  | 'aiSoft'
  | 'shu'
  | 'matcha'
  | 'matchaSoft'
  | 'gold'
  | 'paper';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: ToneKey;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'ink',
  center,
  style,
  ...rest
}: AppTextProps) {
  const { palette } = useTheme();
  const base = variantStyles[variant];
  return (
    <Text
      style={[
        base,
        { color: palette[tone] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}

const variantStyles = StyleSheet.create({
  display: {
    fontFamily: fonts.minchoBold,
    fontSize: type.display,
    lineHeight: type.display * 1.2,
  },
  h1: {
    fontFamily: fonts.minchoBold,
    fontSize: type.h1,
    lineHeight: type.h1 * 1.3,
  },
  h2: {
    fontFamily: fonts.minchoMedium,
    fontSize: type.h2,
    lineHeight: type.h2 * 1.4,
  },
  h3: {
    fontFamily: fonts.gothicBold,
    fontSize: type.h3,
    lineHeight: type.h3 * 1.5,
  },
  body: {
    fontFamily: fonts.gothicRegular,
    fontSize: type.body,
    lineHeight: type.body * 1.7,
  },
  bodyStrong: {
    fontFamily: fonts.gothicMedium,
    fontSize: type.body,
    lineHeight: type.body * 1.7,
  },
  small: {
    fontFamily: fonts.gothicRegular,
    fontSize: type.small,
    lineHeight: type.small * 1.6,
  },
  eyebrow: {
    fontFamily: fonts.gothicMedium,
    fontSize: type.micro,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: fonts.minchoMedium,
    fontSize: type.body,
    fontVariant: ['tabular-nums'],
  },
});

/* ---------------------------------------------------------------- レイアウト */

interface ScreenProps extends ScrollViewProps {
  scroll?: boolean;
  edges?: readonly Edge[];
  pad?: boolean;
}

export function Screen({
  scroll = true,
  edges = ['top'],
  pad = true,
  children,
  contentContainerStyle,
  style,
  ...rest
}: ScreenProps) {
  const { palette } = useTheme();
  const inner = (
    <View style={pad ? { paddingHorizontal: space.lg } : undefined}>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: palette.washi }, style]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { paddingBottom: space.xxl },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          {...rest}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Row({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center' }, style]}
      {...rest}
    />
  );
}

export function Gap({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

/** 極細の罫線。box の代わりに区切りとして多用する。 */
export function Rule({
  strong,
  vertical,
  style,
}: {
  strong?: boolean;
  vertical?: boolean;
  style?: any;
}) {
  const { palette } = useTheme();
  const color = strong ? palette.ruleStrong : palette.rule;
  return (
    <View
      style={[
        vertical
          ? { width: hairline, alignSelf: 'stretch', backgroundColor: color }
          : { height: hairline, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** 小見出しラベル（縦の朱の短い線 + 大文字トラッキング）。 */
export function Eyebrow({
  children,
  tone = 'matcha',
}: {
  children: React.ReactNode;
  tone?: ToneKey;
}) {
  const { palette } = useTheme();
  return (
    <Row style={{ gap: space.sm }}>
      <View
        style={{
          width: 14,
          height: hairline * 2,
          backgroundColor: palette[tone],
          marginBottom: 2,
        }}
      />
      <AppText variant="eyebrow" tone={tone}>
        {children}
      </AppText>
    </Row>
  );
}

/* ---------------------------------------------------------------- 操作 */

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'solid' | 'outline' | 'text';
  tone?: 'ai' | 'shu' | 'ink' | 'matcha';
}

export function Button({
  label,
  variant = 'solid',
  tone = 'ink',
  style,
  ...rest
}: ButtonProps) {
  const { palette } = useTheme();
  const accent = palette[tone];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btnBase,
        variant === 'solid' && { backgroundColor: accent },
        variant === 'outline' && {
          borderWidth: hairline * 2,
          borderColor: accent,
        },
        pressed && { opacity: 0.7 },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.btnLabel,
          {
            color: variant === 'solid' ? palette.paper : accent,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** テキストリンク（下線なし・矢印つき）。導線に使う。 */
export function LinkRow({
  label,
  onPress,
  tone = 'ai',
}: {
  label: string;
  onPress?: () => void;
  tone?: 'ai' | 'shu' | 'ink';
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      <Row style={{ gap: 6 }}>
        <AppText variant="bodyStrong" tone={tone}>
          {label}
        </AppText>
        <AppText variant="bodyStrong" tone={tone}>
          →
        </AppText>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    height: 52,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  btnLabel: {
    fontFamily: fonts.gothicBold,
    fontSize: type.body,
    letterSpacing: 0.5,
  },
});
