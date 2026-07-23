import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './theme';

/** 現在のカラースキームに応じた配色を返す。 */
export function useTheme(): { palette: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { palette: palettes[scheme], scheme };
}
