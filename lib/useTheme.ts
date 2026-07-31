import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './theme';

/** 現在のカラースキームに応じた配色を返す。 */
export function useTheme(): { palette: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  // 明暗で色の文字列リテラルが違うだけなので、Palette として扱う
  return { palette: palettes[scheme] as Palette, scheme };
}
