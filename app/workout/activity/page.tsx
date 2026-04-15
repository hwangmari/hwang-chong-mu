"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  createWorkoutId,
  deleteActivityRecord,
  fetchActivityRecords,
  upsertActivityRecord,
} from "../repository";
import {
  formatDurationMin,
  formatMinInput,
  parseMinutesInput,
  todayISO,
} from "../helpers";
import { ACTIVITY_PRESETS, type ActivityRecord } from "../types";
import { useWorkoutSession } from "../useWorkoutSession";

type FormState = {
  id: string | null;
  date: string;
  activityName: string;
  durationMin: string;
  calories: string;
  avgHeartRate: string;
  memo: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  date: todayISO(),
  activityName: "",
  durationMin: "",
  calories: "",
  avgHeartRate: "",
  memo: "",
};

export default function ActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams?.get("edit") ?? null;
  const appliedEditRef = useRef<string | null>(null);

  const session = useWorkoutSession();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const rows = await fetchActivityRecords(session.roomId);
      setRecords(rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session, load]);

  useEffect(() => {
    if (!editParam) return;
    if (appliedEditRef.current === editParam) return;
    const target = records.find((r) => r.id === editParam);
    if (!target) return;
    appliedEditRef.current = editParam;
    editRecord(target);
    router.replace("/workout/activity");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, records]);

  function resetForm() {
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setShowCustomInput(false);
  }

  async function submit() {
    if (!session) return;
    if (!form.activityName.trim()) {
      setError("운동 종목을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await upsertActivityRecord({
        id: form.id ?? createWorkoutId("activity"),
        roomId: session.roomId,
        date: form.date,
        activityName: form.activityName.trim(),
        durationMin: parseMinutesInput(form.durationMin) || undefined,
        calories: Number(form.calories) || undefined,
        avgHeartRate: Number(form.avgHeartRate) || undefined,
        memo: form.memo || undefined,
      });
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function editRecord(record: ActivityRecord) {
    setForm({
      id: record.id,
      date: record.date,
      activityName: record.activityName,
      durationMin: formatMinInput(record.durationMin),
      calories: record.calories ? String(record.calories) : "",
      avgHeartRate: record.avgHeartRate ? String(record.avgHeartRate) : "",
      memo: record.memo || "",
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function removeRecord(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setBusy(true);
    try {
      await deleteActivityRecord(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <StPage>
      <StHeader>
        <StTitle>🎾 활동 기록</StTitle>
        <StSubtitle>
          자전거·등산·테니스 등 다양한 운동을 가볍게 기록해요.
        </StSubtitle>
      </StHeader>

      <StCard>
        <StCardTitle>{form.id ? "기록 수정" : "새 기록"}</StCardTitle>

        <StLabel>
          종목
          <StInput
            type="text"
            placeholder="예) 자전거, 등산, 테니스"
            value={form.activityName}
            onChange={(e) => setForm({ ...form, activityName: e.target.value })}
          />
        </StLabel>

        <StPresetRow>
          {ACTIVITY_PRESETS.map((name) => (
            <StPresetChip
              key={name}
              type="button"
              $active={form.activityName === name}
              onClick={() => setForm({ ...form, activityName: name })}
            >
              {name}
            </StPresetChip>
          ))}
          <StPresetChip
            type="button"
            $active={false}
            onClick={() => {
              setShowCustomInput(true);
              setForm({ ...form, activityName: "" });
            }}
          >
            + 직접 입력
          </StPresetChip>
        </StPresetRow>
        {showCustomInput ? (
          <StCustomHint>
            위 입력 칸에 원하는 종목을 자유롭게 적어주세요 :)
          </StCustomHint>
        ) : null}

        <StRow>
          <StLabel>
            날짜
            <StInput
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </StLabel>
          <StLabel>
            운동 시간
            <StInput
              type="text"
              placeholder="예) 60 또는 1:30"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
            />
          </StLabel>
        </StRow>

        <StRow>
          <StLabel>
            총 칼로리 (kcal)
            <StInput
              type="number"
              placeholder="알면 입력, 몰라도 OK"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
          </StLabel>
          <StLabel>
            평균 심박 (bpm)
            <StInput
              type="number"
              placeholder="알면 입력, 몰라도 OK"
              value={form.avgHeartRate}
              onChange={(e) =>
                setForm({ ...form, avgHeartRate: e.target.value })
              }
            />
          </StLabel>
        </StRow>

        <StLabel>
          메모
          <StTextarea
            rows={2}
            placeholder="코스·컨디션·같이 한 사람 등"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </StLabel>

        {error ? <StError>{error}</StError> : null}

        <StActions>
          {form.id ? (
            <StGhostButton type="button" onClick={resetForm}>
              취소
            </StGhostButton>
          ) : null}
          <StPrimary type="button" onClick={submit} disabled={busy}>
            {busy ? "저장 중..." : form.id ? "수정 저장" : "기록 저장"}
          </StPrimary>
        </StActions>
      </StCard>

      <StCard>
        <StCardTitle>최근 기록</StCardTitle>
        {loading ? (
          <StEmpty>불러오는 중...</StEmpty>
        ) : records.length === 0 ? (
          <StEmpty>
            아직 활동 기록이 없어요. 오늘 뭐 했는지 남겨보세요!
          </StEmpty>
        ) : (
          <StRecordList>
            {records.map((record) => (
              <StRecordRow key={record.id}>
                <StRecordMain>
                  <StRecordTop>
                    <StRecordTag>{record.activityName}</StRecordTag>
                    <StRecordDate>{record.date}</StRecordDate>
                  </StRecordTop>
                  <StRecordMeta>
                    {record.durationMin ? (
                      <span>{formatDurationMin(record.durationMin)}</span>
                    ) : null}
                    {record.calories ? (
                      <span>{record.calories.toLocaleString()} kcal</span>
                    ) : null}
                    {record.avgHeartRate ? (
                      <span>{record.avgHeartRate} bpm</span>
                    ) : null}
                  </StRecordMeta>
                  {record.memo ? <StRecordMemo>{record.memo}</StRecordMemo> : null}
                </StRecordMain>
                <StRecordActions>
                  <StEditBtn type="button" onClick={() => editRecord(record)}>
                    수정
                  </StEditBtn>
                  <StDelBtn type="button" onClick={() => removeRecord(record.id)}>
                    삭제
                  </StDelBtn>
                </StRecordActions>
              </StRecordRow>
            ))}
          </StRecordList>
        )}
      </StCard>
    </StPage>
  );
}

const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;

const StHeader = styled.header`
  padding: 0.5rem 0.25rem;
`;

const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StSubtitle = styled.p`
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StCard = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.7rem;
`;

const StLabel = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StInput = styled.input`
  min-height: 2.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.12);
  }
`;

const StTextarea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.88rem;
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StPresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StPresetChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.indigo500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.indigo50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.indigo600 : theme.colors.gray600};
  font-size: 0.76rem;
  font-weight: 800;
  padding: 0.4rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    color: ${({ theme }) => theme.colors.indigo600};
    border-color: ${({ theme }) => theme.colors.indigo500};
  }
`;

const StCustomHint = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.indigo600};
  margin-top: -0.4rem;
`;

const StError = styled.p`
  color: ${({ theme }) => theme.colors.rose600};
  background: ${({ theme }) => theme.colors.rose50};
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const StPrimary = styled.button`
  min-height: 2.9rem;
  padding: 0 1.4rem;
  border: none;
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #7c6ae0, #604ec8);
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StGhostButton = styled.button`
  min-height: 2.9rem;
  padding: 0 1.1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 0.8rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
`;

const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const StRecordRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
`;

const StRecordMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const StRecordTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StRecordTag = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.indigo600};
  background: ${({ theme }) => theme.colors.indigo50};
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
`;

const StRecordDate = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

const StRecordMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.84rem;
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 700;
`;

const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

const StRecordActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const StEditBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;

const StDelBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
`;
