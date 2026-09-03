"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@hwangchongmu/ui";
import GiftEntryForm, { type FormState } from "./components/GiftEntryForm";
import EntryHistory from "./components/EntryHistory";
import GiftSummary from "./components/GiftSummary";
import PersonLookup from "./components/PersonLookup";
import ImportFromAccountBook from "./components/ImportFromAccountBook";
import BulkAddForm from "./components/BulkAddForm";
import EditEntryModal from "./components/EditEntryModal";
import {
  deleteGiftEntry,
  fetchGiftEntries,
  saveGiftEntry,
  setGiftReturned,
} from "@/services/giftLog";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/components/common/ModalProvider";
import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonList,
} from "@/components/common/Skeleton";
import { formatDateKey } from "@/utils/date";
import type { GiftEntry, GiftEntryInput, GiftRelation } from "./types";
import {
  StHeader,
  StLoginCard,
  StLoginDesc,
  StLoginEmoji,
  StLoginTitle,
  StPage,
  StSubtitle,
  StTitle,
  StUserBar,
  StUserName,
} from "./page.styles";

function emptyForm(): FormState {
  return {
    id: null,
    date: formatDateKey(new Date()),
    eventType: "wedding",
    direction: "given",
    personName: "",
    relation: "friend",
    relationDetail: "",
    amount: "",
    memo: "",
  };
}

function scrollToForm() {
  if (typeof window === "undefined") return;
  document
    .getElementById("gift-log-form")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function GiftLogPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openConfirm } = useModal();

  const [entries, setEntries] = useState<GiftEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  // 목록에서 "수정"을 누른 기록 — 있으면 수정 모달이 뜬다
  const [editing, setEditing] = useState<GiftEntry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await fetchGiftEntries());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void reload();
  }, [user, reload]);

  // 지금 고른 관계에서 전에 썼던 세부 항목 (최근 것부터, 중복 제거, 최대 8개)
  const suggestDetails = useCallback(
    (relation: GiftRelation) => {
      const seen = new Set<string>();
      for (const entry of entries) {
        const detail = entry.relationDetail.trim();
        if (entry.relation === relation && detail) seen.add(detail);
      }
      return [...seen].slice(0, 8);
    },
    [entries],
  );
  const detailSuggestions = useMemo(
    () => suggestDetails(form.relation),
    [suggestDetails, form.relation],
  );

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function resetForm() {
    setForm(emptyForm());
    setError("");
  }

  async function submit() {
    const personName = form.personName.trim();
    const amount = Number(form.amount);
    if (!form.date) {
      setError("날짜를 입력해 주세요.");
      return;
    }
    if (!personName) {
      setError("상대방 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("금액을 0보다 크게 입력해 주세요.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const next = await saveGiftEntry({
        date: form.date,
        eventType: form.eventType,
        direction: form.direction,
        personName,
        relation: form.relation,
        relationDetail: form.relationDetail.trim(),
        amount: Math.round(amount),
        memo: form.memo.trim(),
      });
      setEntries(next);
      // 축의금 명단처럼 같은 행사를 이어서 입력할 때 날짜·종류·방향·관계는 남겨둔다
      setForm((prev) => ({
        ...prev,
        personName: "",
        relationDetail: "",
        amount: "",
        memo: "",
      }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function editEntry(entry: GiftEntry) {
    setEditing(entry);
  }

  // 표에서 체크한 여러 명의 관계를 한 번에 바꾼다. 나머지 값(날짜·금액·메모·냈음)은 그대로.
  async function changeRelationMany(
    ids: string[],
    relation: GiftRelation,
    relationDetail: string,
  ) {
    const wanted = new Set(ids);
    let latest: GiftEntry[] | null = null;
    for (const entry of entries) {
      if (!wanted.has(entry.id)) continue;
      latest = await saveGiftEntry({
        id: entry.id,
        date: entry.date,
        eventType: entry.eventType,
        direction: entry.direction,
        personName: entry.personName,
        relation,
        relationDetail,
        amount: entry.amount,
        memo: entry.memo,
      });
    }
    if (latest) setEntries(latest);
  }

  async function saveEdit(input: GiftEntryInput) {
    setEntries(await saveGiftEntry(input));
  }

  // 사람 찾기에서 "이 사람으로 새 기록" → 이름·관계만 채운 새 폼
  function startForPerson(
    personName: string,
    relation: GiftRelation,
    relationDetail: string,
  ) {
    setForm({ ...emptyForm(), personName, relation, relationDetail });
    setError("");
    scrollToForm();
  }

  // 가계부에서 가져오기: 한 건씩 저장하고 목록 갱신 (실패는 컴포넌트가 표시)
  async function importEntry(input: GiftEntryInput) {
    setEntries(await saveGiftEntry(input));
  }

  // 명단 한번에 담기: 한 건씩 순서대로 저장 (중간에 실패하면 거기까지만 들어가고 에러를 알린다)
  async function addMany(inputs: GiftEntryInput[]) {
    let latest: GiftEntry[] | null = null;
    for (const input of inputs) {
      latest = await saveGiftEntry(input);
    }
    if (latest) setEntries(latest);
  }

  // 대조표에서 "냈음" 표시/취소 (받은 기록들에 한 번에)
  async function toggleReturned(ids: string[], returned: boolean) {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      setEntries(await setGiftReturned(ids, returned));
    } catch (e) {
      setError(e instanceof Error ? e.message : "표시를 바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    const ok = await openConfirm("이 기록을 삭제할까요?");
    if (!ok) return;
    setBusy(true);
    try {
      const next = await deleteGiftEntry(id);
      setEntries(next);
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  // 로그인 확인 중엔 빈 화면 대신 같은 자리를 차지하는 뼈대를 보여 준다.
  if (authLoading) {
    return (
      <StPage>
        <StHeader>
          <SkeletonBlock width="8rem" height="0.9rem" radius="0.6rem" />
          <SkeletonBlock width="12rem" height="1.6rem" radius="0.7rem" />
          <SkeletonBlock width="min(100%, 22rem)" height="0.9rem" />
        </StHeader>
        <SkeletonCard height="9rem" lines={2} titleWidth="30%" />
        <SkeletonCard height="7rem" lines={1} titleWidth="35%" />
        <SkeletonList count={4} height="4.6rem" lines={1} />
      </StPage>
    );
  }

  if (!user) {
    return (
      <StPage>
        <StHeader>
          <StTitle>🎁 경조사비 장부</StTitle>
          <StSubtitle>주고받은 축의금·부조금을 사람별로 기록해요.</StSubtitle>
        </StHeader>
        <StLoginCard>
          <StLoginEmoji>🔐</StLoginEmoji>
          <StLoginTitle>로그인하면 경조사비 장부를 쓸 수 있어요</StLoginTitle>
          <StLoginDesc>
            금액과 사람 이름이 담기는 기록이라 내 계정에만 저장돼요.
            <br />
            황총무 통합 계정 하나로 다른 서비스도 함께 관리할 수 있어요.
          </StLoginDesc>
          <Button
            color="primary"
            variant="fill"
            size="medium"
            onClick={() => router.push("/login?next=/gift-log")}
          >
            로그인 / 회원가입
          </Button>
        </StLoginCard>
      </StPage>
    );
  }

  return (
    <StPage>
      <StHeader>
        <StUserBar>
          <StUserName>👤 {user.nickname}</StUserName>
        </StUserBar>
        <StTitle>🎁 경조사비 장부</StTitle>
        <StSubtitle>
          주고받은 축의금·부조금을 사람별로 기록하고, 얼마 해야 할지 바로 찾아봐요.
        </StSubtitle>
      </StHeader>

      <PersonLookup entries={entries} onNewForPerson={startForPerson} />

      <GiftEntryForm
        form={form}
        detailSuggestions={detailSuggestions}
        error={error}
        busy={busy}
        onChange={patchForm}
        onSubmit={submit}
        onCancel={resetForm}
      />

      <GiftSummary entries={entries} />

      <EntryHistory
        loading={loading}
        entries={entries}
        suggestDetails={suggestDetails}
        onEdit={editEntry}
        onRemove={removeEntry}
        onToggleReturned={toggleReturned}
        onChangeRelationMany={changeRelationMany}
      />

      {/* 한 번 쓰고 끝나는 도구들은 아래로 */}
      <BulkAddForm defaultDate={formatDateKey(new Date())} onAddMany={addMany} />

      <ImportFromAccountBook entries={entries} onImport={importEntry} />

      {editing ? (
        <EditEntryModal
          key={editing.id}
          entry={editing}
          suggestDetails={suggestDetails}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </StPage>
  );
}
