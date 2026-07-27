import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { AppText, Rule, Gap, Eyebrow } from '@/components/ui';
import { space } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/** 閲覧専用のプライバシーポリシー。同意チェック等は設けない。 */
export default function PrivacyPolicy() {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="Privacy Policy" />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, maxWidth: 560, alignSelf: 'center', width: '100%' }} showsVerticalScrollIndicator={false}>
        <Gap h={space.md} />
        <AppText variant="small" tone="inkFaint">Last updated: July 2026 · Operated by MATCHA, Inc.</AppText>

        <Section title="1. What we collect">
          <P>· Account details — your email address, display name, username, bio and profile photo.</P>
          <P>· Travel records you create — trips, stops (the place you select, its date, title and notes), photos you upload, and the prefectures you mark as visited.</P>
          <P>· Social activity — friendships, friend requests, likes and comments.</P>
          <P>Ashiato does NOT track your location in the background. Places are recorded only when you check in manually.</P>
        </Section>

        <Section title="2. How we use it">
          <P>· To show your journeys on the map, keep your goshuin collection, and let friends see what you choose to share.</P>
          <P>· To notify you when someone comments on your stops or sends you a friend request.</P>
          <P>· To produce anonymised, aggregated statistics (for example, popular prefectures) that help us improve the service.</P>
        </Section>

        <Section title="3. Who can see your content">
          <P>· Private trips — only you.</P>
          <P>· Trips shared with friends — you and your accepted friends.</P>
          <P>· Public trips — anyone using Ashiato, including in Explore.</P>
          <P>Your profile name, username and photo are visible to other users so friends can find you.</P>
        </Section>

        <Section title="4. Where your data lives">
          <P>Data is stored with Supabase (database and file storage) and maps are rendered with Mapbox. Photos you upload are resized and compressed before storage. We do not sell your personal data to third parties.</P>
        </Section>

        <Section title="5. Your choices">
          <P>· You can edit or delete your trips, stops, photos and comments at any time.</P>
          <P>· You can change a trip between private and public whenever you like.</P>
          <P>· You can remove friends, and unfriending takes effect immediately.</P>
          <P>· To delete your account and all associated data, contact us and we will remove it.</P>
        </Section>

        <Section title="6. Contact">
          <P>For questions about this policy or your data, reach us via Help &amp; contact in Settings.</P>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Gap h={space.xl} />
      <Eyebrow tone="matcha">{title}</Eyebrow>
      <Gap h={space.sm} />
      {children}
    </>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <AppText variant="body" tone="inkSoft" style={{ marginBottom: 6, lineHeight: 24 }}>{children}</AppText>
  );
}
