import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './theme';

/**
 * 一部分だけ明暗を固定するための上書き。
 *
 * ボトムシートは「和紙の一枚」として見せたいので、端末が暗いテーマでも
 * 中身は明るい紙＋墨の文字にする。色を個別に差し替えて回ると、
 * 紙だけ明るくて文字が明るいまま——という取り違えが必ず起きるので、
 * **範囲ごとテーマを切り替える**。
 */
const Forced = createContext<'light' | 'dark' | null>(null);

export function ThemeScope({ scheme, children }: { scheme: 'light' | 'dark'; children: React.ReactNode }) {
  return <Forced.Provider value={scheme}>{children}</Forced.Provider>;
}

/** 現在のカラースキームに応じた配色を返す。 */
export function useTheme(): { palette: Palette; scheme: 'light' | 'dark' } {
  const forced = useContext(Forced);
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme = forced ?? system;
  // 明暗で色の文字列リテラルが違うだけなので、Palette として扱う
  return { palette: palettes[scheme] as Palette, scheme };
}
