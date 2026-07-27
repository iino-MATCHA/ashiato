-- =====================================================================
-- 足跡 (Ashiato) — 0006: フレンド機能のRLSポリシー
-- =====================================================================
-- 0001 で friend_requests / friendships のRLSは有効化済みだが
-- ポリシー未定義（＝全操作拒否）だったため、ここで定義する。
--   friend_requests: 申請者がinsert / 当事者がselect / 受信者がstatus更新
--   friendships:     当事者がselect / どちらからでもdelete（友達解除）
-- 承認→friendships生成は 0002 のトリガが担当。
-- =====================================================================

-- ---- friend_requests ----
drop policy if exists friend_requests_insert on friend_requests;
create policy friend_requests_insert on friend_requests for insert
  with check (requester_id = auth.uid());

drop policy if exists friend_requests_select on friend_requests;
create policy friend_requests_select on friend_requests for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists friend_requests_respond on friend_requests;
create policy friend_requests_respond on friend_requests for update
  using (addressee_id = auth.uid());

drop policy if exists friend_requests_cancel on friend_requests;
create policy friend_requests_cancel on friend_requests for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---- friendships ----
drop policy if exists friendships_select on friendships;
create policy friendships_select on friendships for select
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists friendships_delete on friendships;
create policy friendships_delete on friendships for delete
  using (user_a = auth.uid() or user_b = auth.uid());
