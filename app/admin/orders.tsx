/**
 * 注文をさばく画面（管理者のみ）。
 *
 * 決済が通ったあと「誰の何を、何冊刷って、どこへ送るか」を追う場所。
 * 印刷所へは、この画面から住所を写して、ページ画像のURLを渡す。
 *
 * 入金の確定はここからは行わない。それは Stripe の webhook だけが通す道で、
 * 画面から paid にできてしまうと、入金していない注文が発送に流れる。
 */
import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { space, fonts, type, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchAdminOrders, setOrderStatus } from '@/lib/api';
import { yen } from '@/lib/money';
import { printPdfFromPages } from '@/lib/photobook/render';

/** さばく順。まだ手を付けていないものを上に出す */
const FLOW = ['paid', 'printing', 'shipped', 'delivered'] as const;

const LABEL: Record<string, string> = {
  pending: '未入金',
  paid: '入金済み',
  printing: '印刷中',
  shipped: '発送済み',
  delivered: 'お届け済み',
  cancelled: 'キャンセル',
  refunded: '返金済み',
};

export default function AdminOrders() {
  const { palette } = useTheme();
  const [orders, setOrders] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [making, setMaking] = useState<string | null>(null);

  /**
   * 印刷所へ渡すPDFを書き出す。
   * 注文に焼き付けてあるページ画像から組むので、旅をあとから編集されても
   * 注文どおりのものが出る。塗り足し3mmとトンボ付き。
   */
  const makePrintPdf = async (order: any, item: any, idx: number) => {
    const urls: string[] = Array.isArray(item.page_urls) ? item.page_urls : [];
    if (!urls.length || making) return;
    setMaking(`${order.id}-${idx}`);
    const blob = await printPdfFromPages(urls);
    setMaking(null);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-${order.id.slice(0, 8)}-${idx + 1}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const load = useCallback(() => {
    if (!isSupabaseConfigured) return setOrders([]);
    fetchAdminOrders().then((o) => setOrders(o ?? [])).catch(() => setOrders([]));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const advance = async (id: string, to: any) => {
    setBusy(id);
    const ok = await setOrderStatus(id, to, tracking[id]);
    setBusy(null);
    if (ok) load();
  };

  /** 未処理（入金済み・印刷中）を上に。片付いたものは下へ流す */
  const list = useMemo(() => {
    const all = orders ?? [];
    const rank = (s: string) => (s === 'paid' ? 0 : s === 'printing' ? 1 : s === 'shipped' ? 2 : 3);
    const shown = onlyOpen ? all.filter((o) => o.status === 'paid' || o.status === 'printing') : all;
    return [...shown].sort((a, b) => rank(a.status) - rank(b.status));
  }, [orders, onlyOpen]);

  const waiting = (orders ?? []).filter((o) => o.status === 'paid').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title="注文" />
      <Rule />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
        {/* いま何冊刷ればいいのか。ここだけ見れば分かるようにする */}
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="h2" tone="ink">
            {waiting > 0 ? `${waiting}件 未着手` : 'すべて対応済み'}
          </AppText>
          <Pressable onPress={() => setOnlyOpen((v) => !v)} hitSlop={8}>
            <AppText variant="small" tone="matcha">{onlyOpen ? 'すべて表示' : '未対応のみ'}</AppText>
          </Pressable>
        </Row>

        <Gap h={space.lg} />
        {orders === null ? (
          <ActivityIndicator color={palette.matcha} />
        ) : list.length === 0 ? (
          <AppText variant="small" tone="inkFaint">注文はまだありません。</AppText>
        ) : (
          list.map((o) => {
            const expanded = open === o.id;
            const addr = o.shipping_address ?? {};
            return (
              <View key={o.id} style={[styles.card, { borderColor: palette.rule }]}>
                <Pressable onPress={() => setOpen(expanded ? null : o.id)}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Row style={{ gap: space.sm, alignItems: 'center' }}>
                        <View style={[styles.chip, { backgroundColor: chipColor(o.status, palette) }]}>
                          <AppText variant="small" style={{ color: '#fff', fontSize: 11 }}>
                            {LABEL[o.status] ?? o.status}
                          </AppText>
                        </View>
                        <AppText variant="small" tone="inkFaint">{o.ordered}</AppText>
                      </Row>
                      <Gap h={6} />
                      <AppText variant="bodyStrong" tone="ink">
                        {o.recipient_name || o.email} · {o.books}冊
                      </AppText>
                      <AppText variant="small" tone="inkFaint">
                        {o.region_ja} · {yen(o.amount_jpy)}
                      </AppText>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={palette.inkFaint}
                    />
                  </Row>
                </Pressable>

                {expanded && (
                  <>
                    <Gap h={space.md} />
                    <Rule />
                    <Gap h={space.md} />

                    {/* 刷るもの */}
                    <Eyebrow>刷るもの</Eyebrow>
                    <Gap h={space.sm} />
                    {(o.items ?? []).map((it: any, i: number) => (
                      <View key={i} style={{ marginBottom: space.sm }}>
                        <AppText variant="small" tone="ink">
                          {it.title} × {it.qty ?? 1}
                        </AppText>
                        <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                          {it.plan === 'premium' ? '蛇腹・上製' : '並製'} · {it.page_count}ページ
                        </AppText>
                        {/* 印刷所へ渡すページ画像。焼き付け済みなので旅を編集されても動かない */}
                        {Array.isArray(it.page_urls) && it.page_urls.length > 0 && (
                          <Row style={{ gap: space.md }}>
                            <Pressable onPress={() => makePrintPdf(o, it, i)} hitSlop={6}>
                              <AppText variant="small" tone="matcha" style={{ fontSize: 11 }}>
                                {making ? '書き出し中…' : '入稿用PDFを書き出す'}
                              </AppText>
                            </Pressable>
                            <Pressable onPress={() => copy(it.page_urls.join('\n'))} hitSlop={6}>
                              <AppText variant="small" tone="inkFaint" style={{ fontSize: 11 }}>
                                URLをコピー
                              </AppText>
                            </Pressable>
                          </Row>
                        )}
                      </View>
                    ))}

                    <Gap h={space.md} />
                    <Eyebrow>送り先</Eyebrow>
                    <Gap h={space.sm} />
                    <Pressable onPress={() => copy(addressText(o))} hitSlop={6}>
                      <AppText variant="small" tone="ink" style={{ lineHeight: 20 }}>
                        {addressText(o)}
                      </AppText>
                      <Gap h={4} />
                      <AppText variant="small" tone="matcha" style={{ fontSize: 11 }}>
                        住所をコピー
                      </AppText>
                    </Pressable>

                    {/* 追跡番号。発送のときに入れる */}
                    <Gap h={space.md} />
                    <Eyebrow>追跡番号</Eyebrow>
                    <TextInput
                      value={tracking[o.id] ?? o.tracking_no ?? ''}
                      onChangeText={(v) => setTracking((s) => ({ ...s, [o.id]: v }))}
                      placeholder="発送時に入力"
                      placeholderTextColor={palette.inkFaint}
                      style={[styles.input, { color: palette.ink, borderColor: palette.ruleStrong }]}
                      autoCapitalize="characters"
                    />

                    <Gap h={space.lg} />
                    <Row style={{ gap: space.sm }}>
                      {nextSteps(o.status).map((next) => (
                        <Pressable
                          key={next}
                          disabled={busy === o.id}
                          onPress={() => advance(o.id, next)}
                          style={({ pressed }) => [
                            styles.btn,
                            { backgroundColor: next === 'cancelled' ? palette.fill : palette.matcha },
                            (pressed || busy === o.id) && { opacity: 0.7 },
                          ]}
                        >
                          <AppText
                            variant="bodyStrong"
                            style={{ color: next === 'cancelled' ? palette.shu : '#fff', fontSize: 14 }}
                          >
                            {busy === o.id ? '…' : `${LABEL[next]}にする`}
                          </AppText>
                        </Pressable>
                      ))}
                    </Row>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** いまの状態から進める先。戻す道は用意しない（誤操作で発送済みが戻ると事故る） */
function nextSteps(status: string): string[] {
  if (status === 'paid') return ['printing', 'cancelled'];
  if (status === 'printing') return ['shipped'];
  if (status === 'shipped') return ['delivered'];
  return [];
}

function chipColor(status: string, palette: any): string {
  if (status === 'paid') return palette.shu;        // 未着手。目に入るように朱
  if (status === 'printing') return palette.ai;
  if (status === 'shipped') return palette.matcha;
  return palette.inkFaint;
}

function addressText(o: any): string {
  const a = o.shipping_address ?? {};
  return [
    o.recipient_name,
    a.postalCode,
    a.address1,
    a.address2,
    o.region_ja,
    a.phone,
    o.email,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 印刷所へ渡すものは、そのまま貼れる形でコピーできるようにする */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 使えない環境では諦める（画面には出ているので読み取れる）
  }
}

const styles = StyleSheet.create({
  card: { borderWidth: hairline, borderRadius: 12, padding: space.md, marginBottom: space.md },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  input: {
    borderBottomWidth: hairline * 2,
    paddingVertical: 8,
    fontFamily: fonts.gothicRegular,
    fontSize: type.body,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
