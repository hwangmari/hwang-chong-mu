"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MeasurementForm, {
  type FormState,
} from "./components/MeasurementForm";
import MetricTrends from "./components/MetricTrends";
import RecordHistory from "./components/RecordHistory";
import {
  createInBodyId,
  loadVisible,
  saveVisible,
  todayISO,
} from "./storage";
import {
  deleteInBodyRecord,
  fetchInBodyRecords,
  upsertInBodyRecord,
} from "./repository";
import { clearWorkoutSession } from "../workout/storage";
import { useWorkoutSession } from "../workout/useWorkoutSession";
import { useModal } from "@/components/common/ModalProvider";
import {
  DEFAULT_VISIBLE,
  METRIC_KEYS,
  type InBodyMetricKey,
  type InBodyRecord,
  type VisibleMap,
} from "./types";
import {
  StHeader,
  StLogout,
  StPage,
  StRoomBar,
  StRoomName,
  StSubtitle,
  StTitle,
} from "./page.styles";

function emptyForm(): FormState {
  return {
    id: null,
    date: todayISO(),
    weight: "",
    skeletalMuscle: "",
    bodyFatMass: "",
    bmr: "",
    bmi: "",
    bodyFatPct: "",
    abdominalFatRatio: "",
    visceralFatLevel: "",
    memo: "",
  };
}

function toNumberOrUndefined(v: string): number | undefined {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) ? n : undefined;
}

function toFormString(v: number | undefined): string {
  return v !== undefined && Number.isFinite(v) ? String(v) : "";
}

export default function InBodyPage() {
  const { openConfirm } = useModal();
  const session = useWorkoutSession();
  const [records, setRecords] = useState<InBodyRecord[]>([]);
  const [visible, setVisible] = useState<VisibleMap>(DEFAULT_VISIBLE);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const rows = await fetchInBodyRecords(session.roomId);
      setRecords(rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setVisible(loadVisible());
  }, []);

  useEffect(() => {
    if (!session) return;
    reload();
  }, [session, reload]);

  function toggleVisible(key: InBodyMetricKey) {
    const next = { ...visible, [key]: !visible[key] };
    setVisible(next);
    saveVisible(next);
  }

  function resetForm() {
    setForm(emptyForm());
    setError("");
  }

  async function submit() {
    if (!session) return;
    const date = form.date;
    if (!date) {
      setError("측정 날짜를 입력해 주세요.");
      return;
    }

    const numbers: Pick<InBodyRecord, InBodyMetricKey> = {
      weight: toNumberOrUndefined(form.weight),
      skeletalMuscle: toNumberOrUndefined(form.skeletalMuscle),
      bodyFatMass: toNumberOrUndefined(form.bodyFatMass),
      bmr: toNumberOrUndefined(form.bmr),
      bmi: toNumberOrUndefined(form.bmi),
      bodyFatPct: toNumberOrUndefined(form.bodyFatPct),
      abdominalFatRatio: toNumberOrUndefined(form.abdominalFatRatio),
      visceralFatLevel: toNumberOrUndefined(form.visceralFatLevel),
    };

    const hasAny = METRIC_KEYS.some((k) => numbers[k] !== undefined);
    if (!hasAny) {
      setError("최소 한 개 이상의 지표를 입력해 주세요.");
      return;
    }

    const editing = form.id ? records.find((r) => r.id === form.id) : null;
    const record: InBodyRecord = {
      id: form.id ?? createInBodyId(),
      roomId: session.roomId,
      date,
      ...numbers,
      memo: form.memo.trim() || undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    setBusy(true);
    setError("");
    try {
      await upsertInBodyRecord(record);
      resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function editRecord(record: InBodyRecord) {
    setForm({
      id: record.id,
      date: record.date,
      weight: toFormString(record.weight),
      skeletalMuscle: toFormString(record.skeletalMuscle),
      bodyFatMass: toFormString(record.bodyFatMass),
      bmr: toFormString(record.bmr),
      bmi: toFormString(record.bmi),
      bodyFatPct: toFormString(record.bodyFatPct),
      abdominalFatRatio: toFormString(record.abdominalFatRatio),
      visceralFatLevel: toFormString(record.visceralFatLevel),
      memo: record.memo ?? "",
    });
    setError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function removeRecord(id: string) {
    const ok = await openConfirm("이 측정 기록을 삭제할까요?");
    if (!ok) return;
    setBusy(true);
    try {
      await deleteInBodyRecord(id);
      if (form.id === id) resetForm();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  // 차트용: 오래된 → 최신 순
  const ordered = useMemo(() => [...records].reverse(), [records]);

  const visibleKeys = METRIC_KEYS.filter((k) => visible[k]);

  const latest = records[0];
  const previous = records[1];

  if (!session) return null;

  return (
    <StPage>
      <StHeader>
        <StRoomBar>
          <StRoomName>🏠 {session.roomName}</StRoomName>
          <StLogout type="button" onClick={() => clearWorkoutSession()}>
            나가기
          </StLogout>
        </StRoomBar>
        <StTitle>🧬 인바디 기록</StTitle>
        <StSubtitle>
          측정값을 저장하고 원하는 지표만 골라서 추이를 봐요.
        </StSubtitle>
      </StHeader>

      <MeasurementForm
        form={form}
        visible={visible}
        showSelector={showSelector}
        error={error}
        busy={busy}
        onToggleSelector={() => setShowSelector((v) => !v)}
        onToggleVisible={toggleVisible}
        onDateChange={(value) => setForm({ ...form, date: value })}
        onFieldChange={(key, value) => setForm({ ...form, [key]: value })}
        onMemoChange={(value) => setForm({ ...form, memo: value })}
        onSubmit={submit}
        onCancel={resetForm}
      />

      <MetricTrends
        loading={loading}
        hasRecords={records.length > 0}
        visibleKeys={visibleKeys}
        ordered={ordered}
        latest={latest}
        previous={previous}
      />

      <RecordHistory
        loading={loading}
        records={records}
        visibleKeys={visibleKeys}
        onEdit={editRecord}
        onRemove={removeRecord}
      />
    </StPage>
  );
}
