/**
 * 国籍の選択肢（ISO 3166-1 alpha-2）。
 * 訪日客の多い国・地域を上に、それ以外は英名のアルファベット順。
 * 自由入力をやめたのは、分析（国籍別集計）でコードの揺れを無くすため。
 */
export interface Nationality { code: string; en: string; flag: string }

export const NATIONALITIES: Nationality[] = [
  { code: 'JP', en: 'Japan', flag: '🇯🇵' },
  { code: 'KR', en: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', en: 'China', flag: '🇨🇳' },
  { code: 'TW', en: 'Taiwan', flag: '🇹🇼' },
  { code: 'HK', en: 'Hong Kong', flag: '🇭🇰' },
  { code: 'US', en: 'United States', flag: '🇺🇸' },
  { code: 'TH', en: 'Thailand', flag: '🇹🇭' },
  { code: 'SG', en: 'Singapore', flag: '🇸🇬' },
  { code: 'AU', en: 'Australia', flag: '🇦🇺' },
  { code: 'PH', en: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', en: 'Vietnam', flag: '🇻🇳' },
  { code: 'ID', en: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', en: 'Malaysia', flag: '🇲🇾' },
  { code: 'GB', en: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', en: 'Canada', flag: '🇨🇦' },
  { code: 'FR', en: 'France', flag: '🇫🇷' },
  { code: 'DE', en: 'Germany', flag: '🇩🇪' },
  { code: 'IN', en: 'India', flag: '🇮🇳' },
  // ---- ここからアルファベット順
  { code: 'AR', en: 'Argentina', flag: '🇦🇷' },
  { code: 'AT', en: 'Austria', flag: '🇦🇹' },
  { code: 'BE', en: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', en: 'Brazil', flag: '🇧🇷' },
  { code: 'CH', en: 'Switzerland', flag: '🇨🇭' },
  { code: 'ES', en: 'Spain', flag: '🇪🇸' },
  { code: 'FI', en: 'Finland', flag: '🇫🇮' },
  { code: 'IE', en: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', en: 'Israel', flag: '🇮🇱' },
  { code: 'IT', en: 'Italy', flag: '🇮🇹' },
  { code: 'MX', en: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', en: 'Netherlands', flag: '🇳🇱' },
  { code: 'NO', en: 'Norway', flag: '🇳🇴' },
  { code: 'NZ', en: 'New Zealand', flag: '🇳🇿' },
  { code: 'PL', en: 'Poland', flag: '🇵🇱' },
  { code: 'PT', en: 'Portugal', flag: '🇵🇹' },
  { code: 'RU', en: 'Russia', flag: '🇷🇺' },
  { code: 'SA', en: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SE', en: 'Sweden', flag: '🇸🇪' },
  { code: 'TR', en: 'Türkiye', flag: '🇹🇷' },
  { code: 'AE', en: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'OTHER', en: 'Other', flag: '🌐' },
];
