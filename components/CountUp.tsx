/**
 * 数字を0から回して見せる。プロフィールや御朱印帳の実績値に使う。
 * 値が変わったときも、前の値から新しい値へ回す（獲得の瞬間が伝わる）。
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { AppText } from '@/components/ui';

export function CountUp({
  value,
  duration = 800,
  format,
  ...rest
}: {
  value: number;
  duration?: number;
  /** 表示の整形（桁区切りや単位付けなど） */
  format?: (n: number) => string;
  [key: string]: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const from = useRef(0);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) { setShown(value); return; }
    anim.setValue(0);
    const id = anim.addListener(({ value: p }) => {
      setShown(Math.round(start + (value - start) * p));
    });
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      // 値を読み出して文字を書き換えるので、ネイティブドライバは使えない
      useNativeDriver: false,
    }).start(() => {
      from.current = value;
      setShown(value);
    });
    return () => anim.removeListener(id);
  }, [value, duration]);

  return <AppText {...rest}>{format ? format(shown) : String(shown)}</AppText>;
}
