import React from 'react';
import { Platform, TextInput } from 'react-native';
import { fonts, type } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/**
 * Date field. On web it renders a native <input type="date"> (calendar picker),
 * borderless to match the app. Value/onChange use YYYY-MM-DD.
 */
export function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { palette } = useTheme();

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value: value || '',
      onChange: (e: any) => onChange(e.target.value),
      style: {
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: palette.ink,
        fontFamily: fonts.minchoMedium,
        fontSize: type.h3,
        padding: '2px 0',
        width: '100%',
      },
    });
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? 'YYYY-MM-DD'}
      placeholderTextColor={palette.inkFaint}
      style={{ fontFamily: fonts.minchoMedium, fontSize: type.h3, color: palette.ink, paddingVertical: 2 }}
    />
  );
}
