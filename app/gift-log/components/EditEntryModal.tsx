"use client";

import { useEffect, useState } from "react";
import GiftEntryForm, { type FormState } from "./GiftEntryForm";
import { StModalBox, StModalOverlay } from "../page.styles";
import type { GiftEntry, GiftEntryInput } from "../types";

type Props = {
  entry: GiftEntry;
  // 지금 고른 관계에서 전에 썼던 세부 항목 (부모가 계산해서 넘김)
  suggestDetails: (relation: FormState["relation"]) => string[];
  onSave: (input: GiftEntryInput) => Promise<void>;
  onClose: () => void;
};

function toForm(entry: GiftEntry): FormState {
  return {
    id: entry.id,
    date: entry.date,
    eventType: entry.eventType,
    direction: entry.direction,
    personName: entry.personName,
    relation: entry.relation,
    relationDetail: entry.relationDetail,
    amount: String(entry.amount),
    memo: entry.memo,
  };
}

// 목록에서 "수정"을 누르면 그 자리에서 뜨는 수정 창. 폼은 새 기록과 같은 GiftEntryForm을 재사용한다.
export default function EditEntryModal({ entry, suggestDetails, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(entry));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function submit() {
    const personName = form.personName.trim();
    const amount = Number(form.amount);
    if (!form.date) return setError("날짜를 입력해 주세요.");
    if (!personName) return setError("상대방 이름을 입력해 주세요.");
    if (!Number.isFinite(amount) || amount <= 0) {
      return setError("금액을 0보다 크게 입력해 주세요.");
    }
    setBusy(true);
    setError("");
    try {
      await onSave({
        id: entry.id,
        date: form.date,
        eventType: form.eventType,
        direction: form.direction,
        personName,
        relation: form.relation,
        relationDetail: form.relationDetail.trim(),
        amount: Math.round(amount),
        memo: form.memo.trim(),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StModalOverlay onClick={() => !busy && onClose()} />
      <StModalBox role="dialog" aria-modal="true" aria-label="기록 수정">
        <GiftEntryForm
          form={form}
          detailSuggestions={suggestDetails(form.relation)}
          error={error}
          busy={busy}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSubmit={submit}
          onCancel={onClose}
        />
      </StModalBox>
    </>
  );
}
