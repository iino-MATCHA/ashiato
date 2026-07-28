/**
 * UI言語。en / ja / ko / zh-Hans（簡体字）/ zh-Hant（繁体字・台湾）。
 *
 * 仕組みは useProfile と同じ小さなストア。言語は
 *  - profiles.language（ログイン時にDBへ）
 *  - localStorage（未ログイン・次回起動用）
 * の両方に持ち、起動時は localStorage → DB の順で復元する。
 *
 * まだ全画面は訳していない。辞書に無い文字列は英語のまま出る（キー未定義は
 * en へフォールバック）。画面を訳すときは t('key') に置き換えて辞書へ追加する。
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export type Locale = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'zh-Hant';

export const LOCALES: { key: Locale; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'ko', label: '한국어' },
  { key: 'zh-Hans', label: '简体中文' },
  { key: 'zh-Hant', label: '繁體中文' },
];

type Dict = Record<string, string>;

const en: Dict = {
  // tabs
  'tab.trips': 'Trips',
  'tab.goshuin': 'Goshuin',
  'tab.explore': 'Explore',
  // common
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.later': 'Later',
  'common.signin': 'Sign in',
  'common.logout': 'Log out',
  'common.gotit': 'Got it',
  'common.close': 'Close',
  // profile / settings
  'settings.title': 'Settings',
  'settings.notifications': 'Notifications',
  'settings.editPrefectures': 'Edit visited prefectures',
  'settings.shareCard': 'Share my Japan card',
  'settings.orders': 'Order history',
  'settings.privacy': 'Privacy policy',
  'settings.help': 'Help & contact',
  'settings.admin': 'Admin console',
  'profile.edit': 'Edit profile',
  'profile.displayName': 'Display name',
  'profile.username': 'Username',
  'profile.bio': 'Bio',
  'profile.birthDate': 'Date of birth',
  'profile.nationality': 'Nationality',
  'profile.residence': 'Living in Japan?',
  'profile.resident': 'Resident',
  'profile.visiting': 'Visiting',
  'profile.language': 'Language',
  'profile.selectNationality': 'Select your nationality',
  // trip
  'trip.wholeRoute': 'The whole route',
  'trip.swipe': 'Swipe → to follow the journey',
  'trip.addStop': 'Add a new stop',
  'trip.addStopSub': 'Photos, notes, check-in',
  'trip.transportQ': 'How did you travel?',
  'trip.transportNote': 'Flights and ferries are drawn as an arc.',
  'trip.sampleTitle': 'This is a sample',
  'trip.sampleBody': 'You can look around and share it, but it cannot be edited. Create your own trip to start recording.',
  'trip.guestTitle': 'Start your own footprint',
  'trip.guestBody': 'You are viewing a shared journey. Sign in to record trips like this one — it takes a minute.',
  // goshuin
  'goshuin.rank': 'Current rank',
  'goshuin.share': 'Create a shareable card',
  'goshuin.visited': 'Visited',
  'goshuin.notYet': 'Not yet',
};

const ja: Dict = {
  'tab.trips': '旅',
  'tab.goshuin': '御朱印',
  'tab.explore': '発見',
  'common.save': '保存',
  'common.saving': '保存中…',
  'common.later': 'あとで',
  'common.signin': 'ログイン',
  'common.logout': 'ログアウト',
  'common.gotit': 'わかった',
  'common.close': '閉じる',
  'settings.title': '設定',
  'settings.notifications': '通知',
  'settings.editPrefectures': '行った都道府県を編集',
  'settings.shareCard': 'My Japanカードを共有',
  'settings.orders': '注文履歴',
  'settings.privacy': 'プライバシーポリシー',
  'settings.help': 'ヘルプ・お問い合わせ',
  'settings.admin': '管理コンソール',
  'profile.edit': 'プロフィールを編集',
  'profile.displayName': '表示名',
  'profile.username': 'ユーザー名',
  'profile.bio': '自己紹介',
  'profile.birthDate': '生年月日',
  'profile.nationality': '国籍',
  'profile.residence': '日本にお住まいですか？',
  'profile.resident': '在住',
  'profile.visiting': '旅行中',
  'profile.language': '言語',
  'profile.selectNationality': '国籍を選択',
  'trip.wholeRoute': '旅の全体',
  'trip.swipe': '→ にスワイプして旅をたどる',
  'trip.addStop': '新しい地点を追加',
  'trip.addStopSub': '写真・メモ・チェックイン',
  'trip.transportQ': '移動手段は？',
  'trip.transportNote': '飛行機と船は弧で描かれます。',
  'trip.sampleTitle': 'これはサンプルです',
  'trip.sampleBody': '閲覧と共有はできますが、編集はできません。自分の旅を作って記録を始めましょう。',
  'trip.guestTitle': '自分の足跡を始めよう',
  'trip.guestBody': '共有された旅を閲覧中です。ログインすると、こんな旅を自分でも記録できます。',
  'goshuin.rank': '現在のランク',
  'goshuin.share': 'シェア用カードを作る',
  'goshuin.visited': '訪問済み',
  'goshuin.notYet': 'まだ',
};

const ko: Dict = {
  'tab.trips': '여행',
  'tab.goshuin': '고슈인',
  'tab.explore': '탐색',
  'common.save': '저장',
  'common.saving': '저장 중…',
  'common.later': '나중에',
  'common.signin': '로그인',
  'common.logout': '로그아웃',
  'common.gotit': '확인',
  'common.close': '닫기',
  'settings.title': '설정',
  'settings.notifications': '알림',
  'settings.editPrefectures': '방문한 도도부현 편집',
  'settings.shareCard': 'My Japan 카드 공유',
  'settings.orders': '주문 내역',
  'settings.privacy': '개인정보 처리방침',
  'settings.help': '도움말·문의',
  'settings.admin': '관리 콘솔',
  'profile.edit': '프로필 편집',
  'profile.displayName': '표시 이름',
  'profile.username': '사용자 이름',
  'profile.bio': '소개',
  'profile.birthDate': '생년월일',
  'profile.nationality': '국적',
  'profile.residence': '일본에 거주하시나요?',
  'profile.resident': '거주',
  'profile.visiting': '여행 중',
  'profile.language': '언어',
  'profile.selectNationality': '국적 선택',
  'trip.wholeRoute': '전체 경로',
  'trip.swipe': '→ 스와이프하여 여행 따라가기',
  'trip.addStop': '새 장소 추가',
  'trip.addStopSub': '사진·메모·체크인',
  'trip.transportQ': '어떻게 이동했나요?',
  'trip.transportNote': '비행기와 배는 호로 표시됩니다.',
  'trip.sampleTitle': '샘플입니다',
  'trip.sampleBody': '둘러보고 공유할 수 있지만 편집은 할 수 없습니다. 나만의 여행을 만들어 기록을 시작하세요.',
  'trip.guestTitle': '나의 발자국을 시작하세요',
  'trip.guestBody': '공유된 여행을 보고 있습니다. 로그인하면 이런 여행을 직접 기록할 수 있습니다.',
  'goshuin.rank': '현재 랭크',
  'goshuin.share': '공유 카드 만들기',
  'goshuin.visited': '방문함',
  'goshuin.notYet': '아직',
};

const zhHans: Dict = {
  'tab.trips': '旅程',
  'tab.goshuin': '御朱印',
  'tab.explore': '发现',
  'common.save': '保存',
  'common.saving': '保存中…',
  'common.later': '稍后',
  'common.signin': '登录',
  'common.logout': '退出登录',
  'common.gotit': '知道了',
  'common.close': '关闭',
  'settings.title': '设置',
  'settings.notifications': '通知',
  'settings.editPrefectures': '编辑去过的都道府县',
  'settings.shareCard': '分享 My Japan 卡片',
  'settings.orders': '订单记录',
  'settings.privacy': '隐私政策',
  'settings.help': '帮助与联系',
  'settings.admin': '管理控制台',
  'profile.edit': '编辑个人资料',
  'profile.displayName': '显示名称',
  'profile.username': '用户名',
  'profile.bio': '简介',
  'profile.birthDate': '出生日期',
  'profile.nationality': '国籍',
  'profile.residence': '居住在日本吗？',
  'profile.resident': '居住',
  'profile.visiting': '旅行中',
  'profile.language': '语言',
  'profile.selectNationality': '选择国籍',
  'trip.wholeRoute': '完整路线',
  'trip.swipe': '→ 滑动跟随旅程',
  'trip.addStop': '添加新地点',
  'trip.addStopSub': '照片·笔记·签到',
  'trip.transportQ': '你是怎么移动的？',
  'trip.transportNote': '飞机和船以弧线表示。',
  'trip.sampleTitle': '这是示例',
  'trip.sampleBody': '可以浏览和分享，但无法编辑。创建自己的旅程开始记录吧。',
  'trip.guestTitle': '开始你的足迹',
  'trip.guestBody': '你正在浏览他人分享的旅程。登录后即可记录属于自己的旅程。',
  'goshuin.rank': '当前等级',
  'goshuin.share': '生成分享卡片',
  'goshuin.visited': '已到访',
  'goshuin.notYet': '尚未',
};

const zhHant: Dict = {
  'tab.trips': '旅程',
  'tab.goshuin': '御朱印',
  'tab.explore': '探索',
  'common.save': '儲存',
  'common.saving': '儲存中…',
  'common.later': '稍後',
  'common.signin': '登入',
  'common.logout': '登出',
  'common.gotit': '知道了',
  'common.close': '關閉',
  'settings.title': '設定',
  'settings.notifications': '通知',
  'settings.editPrefectures': '編輯去過的都道府縣',
  'settings.shareCard': '分享 My Japan 卡片',
  'settings.orders': '訂單紀錄',
  'settings.privacy': '隱私權政策',
  'settings.help': '說明與聯絡',
  'settings.admin': '管理主控台',
  'profile.edit': '編輯個人檔案',
  'profile.displayName': '顯示名稱',
  'profile.username': '使用者名稱',
  'profile.bio': '簡介',
  'profile.birthDate': '出生日期',
  'profile.nationality': '國籍',
  'profile.residence': '居住在日本嗎？',
  'profile.resident': '居住',
  'profile.visiting': '旅行中',
  'profile.language': '語言',
  'profile.selectNationality': '選擇國籍',
  'trip.wholeRoute': '完整路線',
  'trip.swipe': '→ 滑動跟隨旅程',
  'trip.addStop': '新增地點',
  'trip.addStopSub': '照片·筆記·打卡',
  'trip.transportQ': '你是怎麼移動的？',
  'trip.transportNote': '飛機與船以弧線表示。',
  'trip.sampleTitle': '這是範例',
  'trip.sampleBody': '可以瀏覽和分享，但無法編輯。建立自己的旅程開始記錄吧。',
  'trip.guestTitle': '開始你的足跡',
  'trip.guestBody': '你正在瀏覽他人分享的旅程。登入後即可記錄屬於自己的旅程。',
  'goshuin.rank': '目前等級',
  'goshuin.share': '建立分享卡片',
  'goshuin.visited': '已造訪',
  'goshuin.notYet': '尚未',
};

const DICTS: Record<Locale, Dict> = { en, ja, ko, 'zh-Hans': zhHans, 'zh-Hant': zhHant };

// ---------------------------------------------------------------- store

const STORAGE_KEY = 'ashiato.locale';
let current: Locale = 'en';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function isLocale(v: any): v is Locale {
  return v === 'en' || v === 'ja' || v === 'ko' || v === 'zh-Hans' || v === 'zh-Hant';
}

/** 起動時の復元。localStorage → DB の順（DBが勝つ）。 */
async function restore() {
  try {
    if (typeof window !== 'undefined') {
      const v = window.localStorage?.getItem(STORAGE_KEY);
      if (isLocale(v)) { current = v; emit(); }
    }
  } catch {}
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (!uid) return;
    const { data: row } = await supabase.from('profiles').select('language').eq('id', uid).maybeSingle();
    if (row && isLocale(row.language)) { current = row.language; emit(); }
  } catch {}
}
let restored = false;

export async function setLocale(next: Locale) {
  current = next;
  emit();
  try {
    if (typeof window !== 'undefined') window.localStorage?.setItem(STORAGE_KEY, next);
  } catch {}
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (uid) await supabase.from('profiles').update({ language: next }).eq('id', uid);
  } catch {}
}

export function getLocale(): Locale {
  return current;
}

/** 現在の言語での翻訳。辞書に無いキーは英語へフォールバック。 */
export function t(key: string): string {
  return DICTS[current][key] ?? en[key] ?? key;
}

export function useI18n() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    if (!restored) { restored = true; restore(); }
    return () => { listeners.delete(l); };
  }, []);
  return { t, locale: current, setLocale };
}
