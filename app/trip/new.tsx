import { useState } from 'react';
import { View, TextInput, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Button, Eyebrow } from '@/components/ui';
import { DateInput } from '@/components/DateInput';
import { space, fonts, type } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTrip } from '@/lib/api';

import { useI18n } from '@/lib/i18n';
export default function NewTrip() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(''); // YYYY-MM-DD
  const [end, setEnd] = useState('');
  const [isPublic, setIsPublic] = useState(true); // default: public ON
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && start.length > 0;

  const create = async () => {
    if (!canSave) return;
    if (isSupabaseConfigured) {
      setSaving(true);
      const id = await createTrip({
        title: title.trim(),
        visibility: isPublic ? 'public' : 'private',
        startDate: start,
        endDate: end || undefined,
      });
      setSaving(false);
      if (id) return router.replace(`/trip/${id}`);
    }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header closeIcon title={t('tripNew.header')} />
      <Rule />
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>
        <Gap h={space.lg} />
        <TextInput placeholder={t('tripNew.titlePh')} placeholderTextColor={palette.inkFaint} value={title} onChangeText={setTitle} style={[styles.titleInput, { color: palette.ink }]} multiline />
        <Rule strong />

        <Gap h={space.xl} />
        <Row style={{ gap: 6 }}>
          <Eyebrow>{t('trip.dates')}</Eyebrow>
          <AppText variant="small" tone="shu">*</AppText>
        </Row>
        <Gap h={space.md} />
        <Row style={{ gap: space.lg, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">{t('trip.start')}</AppText>
            <Gap h={4} />
            <DateInput value={start} onChange={setStart} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>
          <Ionicons name="arrow-forward" size={16} color={palette.inkFaint} style={{ marginBottom: 12 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="inkFaint">{t('trip.end')}</AppText>
            <Gap h={4} />
            <DateInput value={end} onChange={setEnd} />
            <Gap h={space.xs} />
            <Rule strong />
          </View>
        </Row>

        <Gap h={space.xl} />
        <Eyebrow>{t('trip.visibility')}</Eyebrow>
        <Gap h={space.md} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Ionicons name={isPublic ? 'earth-outline' : 'lock-closed-outline'} size={18} color={isPublic ? palette.matcha : palette.inkSoft} />
            <AppText variant="bodyStrong" tone="ink">{t('trip.public')}</AppText>
          </Row>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ true: palette.matcha, false: palette.rule }}
            thumbColor="#fff"
          />
        </Row>
        <Gap h={space.sm} />
        <AppText variant="small" tone="inkFaint">
          {isPublic ? 'Shown in Explore for everyone.' : 'Only you — friends can still see it on their feed.'}
        </AppText>
      </View>

      <View style={{ padding: space.lg }}>
        {!canSave && <><AppText variant="small" tone="inkFaint" center>Add a title and a start date to continue.</AppText><Gap h={space.sm} /></>}
        <Button label={saving ? 'Creating…' : 'Start the trip'} tone="matcha" onPress={create} disabled={!canSave || saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleInput: { fontFamily: fonts.minchoBold, fontSize: type.h1, lineHeight: type.h1 * 1.3, paddingBottom: space.sm, minHeight: 44 },
});
