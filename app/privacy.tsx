/**
 * 閲覧専用のプライバシーポリシー。同意チェック等は設けない。
 *
 * 正文は英語のまま持ち、表示言語への翻訳はボタンを押したときだけ行う。
 * 規約の類を黙って機械翻訳で置き換えたくないので、原文へ戻せるようにし、
 * 訳文であることも明示する。翻訳の仕組みは記事と同じ lib/translate。
 */
import { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n, getLocale } from '@/lib/i18n';
import { translateText } from '@/lib/translate';

/** 正文（英語）。翻訳はこの配列を通す。 */
const POLICY: { title: string; paragraphs: string[] }[] = [
  {
    title: '1. What we collect',
    paragraphs: [
      '· Account details — your email address, display name, username, bio and profile photo.',
      '· Travel records you create — trips, stops (the place you select, its date, title and notes), photos you upload, and the prefectures you mark as visited.',
      '· Social activity — friendships, friend requests, likes and comments.',
      'My Japan does NOT track your location in the background. Places are recorded only when you check in manually, or when you choose photos and we read the location stored inside them.',
    ],
  },
  {
    title: '2. How we use it',
    paragraphs: [
      '· To show your journeys on the map, keep your Goshuin Badge collection, and let friends see what you choose to share.',
      '· To notify you when someone comments on your stops or sends you a friend request.',
      '· To produce anonymised, aggregated statistics (for example, popular prefectures) that help us improve the service.',
      '· When you create a trip from your photos, everything happens on your device and our own servers. Nothing is sent to a third-party AI service.',
    ],
  },
  {
    title: '3. Who can see your content',
    paragraphs: [
      '· Private trips — only you.',
      '· Trips shared with friends — you and your accepted friends.',
      '· Public trips — anyone using My Japan, including in Explore.',
      'Your profile name, username and photo are visible to other users so friends can find you.',
    ],
  },
  {
    title: '4. Where your data lives',
    paragraphs: [
      'Data is stored with Supabase (database and file storage) and maps are rendered with Mapbox. Photos you upload are resized and compressed before storage. We do not sell your personal data to third parties.',
    ],
  },
  {
    title: '5. Orders and payment',
    paragraphs: [
      'If you order a printed book, we keep your email address, recipient name, shipping address and delivery region so we can produce and post it. Card details are handled by the payment provider and never reach our servers.',
    ],
  },
  {
    title: '6. Your choices',
    paragraphs: [
      '· You can edit or delete your trips, stops, photos and comments at any time.',
      '· You can change a trip between private and public whenever you like.',
      '· You can remove friends, and unfriending takes effect immediately.',
      '· To delete your account and all associated data, contact us and we will remove it.',
    ],
  },
  {
    title: '7. Contact',
    paragraphs: [
      'For questions about this policy or your data, reach us at iino@matcha-jp.com.',
    ],
  },
];

export default function PrivacyPolicy() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const locale = getLocale();

  const [translated, setTranslated] = useState<typeof POLICY | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const shown = translated ?? POLICY;

  /**
   * ページまるごと翻訳する。段落ごとに投げると回数が多くなるので、
   * 区切り記号でつないで1回にまとめ、返ってきたものを同じ順に割り戻す。
   */
  const translate = async () => {
    if (busy) return;
    if (translated) { setTranslated(null); return; }
    setBusy(true);
    setFailed(false);

    const parts: string[] = [];
    POLICY.forEach((s) => { parts.push(s.title); s.paragraphs.forEach((p) => parts.push(p)); });
    const SEP = '\n@@\n';
    const out = await translateText(parts.join(SEP), locale);
    const pieces = out ? out.split(/\s*@@\s*/) : [];

    setBusy(false);
    if (pieces.length !== parts.length) { setFailed(true); return; }

    let i = 0;
    setTranslated(
      POLICY.map((s) => ({
        title: pieces[i++].trim(),
        paragraphs: s.paragraphs.map(() => pieces[i++].trim()),
      }))
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('privacy.header')} />
      <Rule />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, maxWidth: 560, alignSelf: 'center', width: '100%' }}
        showsVerticalScrollIndicator={false}
      >
        <Gap h={space.md} />
        <AppText variant="small" tone="inkFaint">{t('privacy.updated')}</AppText>

        {/* 英語で読む人には要らないボタンなので、英語のときは出さない */}
        {locale !== 'en' && (
          <>
            <Gap h={space.md} />
            <Pressable onPress={translate} disabled={busy} hitSlop={8}>
              <Row style={{ gap: 6, alignItems: 'center' }}>
                {busy ? (
                  <ActivityIndicator size="small" color={palette.matcha} />
                ) : (
                  <Ionicons name={translated ? 'arrow-undo-outline' : 'language-outline'} size={16} color={palette.matcha} />
                )}
                <AppText variant="small" tone="matcha">
                  {busy ? t('privacy.translating') : translated ? t('privacy.showOriginal') : t('privacy.translate')}
                </AppText>
              </Row>
            </Pressable>
            {!!translated && (
              <>
                <Gap h={space.xs} />
                <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>{t('privacy.machine')}</AppText>
              </>
            )}
            {failed && (
              <>
                <Gap h={space.xs} />
                <AppText variant="small" tone="shu" style={{ fontSize: 11 }}>{t('privacy.translateFailed')}</AppText>
              </>
            )}
          </>
        )}

        {shown.map((s) => (
          <View key={s.title}>
            <Gap h={space.xl} />
            <Eyebrow tone="matcha">{s.title}</Eyebrow>
            <Gap h={space.sm} />
            {s.paragraphs.map((p, i) => (
              <AppText key={i} variant="body" tone="inkSoft" style={{ marginBottom: 6, lineHeight: 24 }}>
                {p}
              </AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
