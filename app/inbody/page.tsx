"use client";

import { Button } from "@hwangchongmu/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import InBodySparkline from "./components/InBodySparkline";
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
import {
  DEFAULT_VISIBLE,
  METRIC_COLOR,
  METRIC_DECIMALS,
  METRIC_GOOD_DIRECTION,
  METRIC_KEYS,
  METRIC_LABEL,
  METRIC_STEP,
  METRIC_UNIT,
  type InBodyMetricKey,
  type InBodyRecord,
  type VisibleMap,
} from "./types";

type FormState = {
  id: string | null;
  date: string;
  weight: string;
  skeletalMuscle: string;
  bodyFatMass: string;
  bmr: string;
  bmi: string;
  bodyFatPct: string;
  abdominalFatRatio: string;
  visceralFatLevel: string;
  memo: string;
};

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

function formatValue(v: number | undefined, key: InBodyMetricKey): string {
  if (v === undefined) return "-";
  return v.toFixed(METRIC_DECIMALS[key]);
}

function formatDelta(v: number, key: InBodyMetricKey): string {
  const sign = v > 0 ? "+" : v < 0 ? "" : "±";
  return `${sign}${v.toFixed(METRIC_DECIMALS[key])}`;
}

export default function InBodyPage() {
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
    if (typeof window !== "undefined") {
      const ok = window.confirm("이 측정 기록을 삭제할까요?");
      if (!ok) return;
    }
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

      <StCard>
        <StCardHead>
          <StCardTitle>{form.id ? "기록 수정" : "새 측정 기록"}</StCardTitle>
          <StSelectorBtn
            type="button"
            onClick={() => setShowSelector((v) => !v)}
          >
            {showSelector ? "▾ 표시 지표 닫기" : "▸ 표시 지표 선택"}
          </StSelectorBtn>
        </StCardHead>

        {showSelector ? (
          <StSelectorBox>
            <StSelectorHelp>
              화면에 보고 싶은 지표만 켜두세요. 저장은 모든 지표가 됩니다.
            </StSelectorHelp>
            <StChipRow>
              {METRIC_KEYS.map((k) => {
                const on = visible[k];
                return (
                  <StChip
                    key={k}
                    type="button"
                    $active={on}
                    $color={METRIC_COLOR[k]}
                    onClick={() => toggleVisible(k)}
                  >
                    {METRIC_LABEL[k]}
                  </StChip>
                );
              })}
            </StChipRow>
          </StSelectorBox>
        ) : null}

        <StRow>
          <StLabel>
            측정 날짜
            <StInput
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </StLabel>
        </StRow>

        <StFormGrid>
          {METRIC_KEYS.map((k) => (
            <StLabel key={k}>
              <StFieldHead>
                <StFieldName>{METRIC_LABEL[k]}</StFieldName>
                <StFieldUnit>{METRIC_UNIT[k]}</StFieldUnit>
              </StFieldHead>
              <StInput
                type="number"
                inputMode="decimal"
                step={METRIC_STEP[k]}
                placeholder="예) 0"
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </StLabel>
          ))}
        </StFormGrid>

        <StLabel>
          메모
          <StTextarea
            rows={2}
            placeholder="측정 시간대, 식사 전후, 컨디션 등"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </StLabel>

        {error ? <StError>{error}</StError> : null}

        <StActions>
          {form.id ? (
            <Button
              color="light"
              variant="fill"
              size="medium"
              onClick={resetForm}
            >
              취소
            </Button>
          ) : null}
          <Button
            color="primary"
            variant="fill"
            size="medium"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "저장 중..." : form.id ? "수정 저장" : "기록 저장"}
          </Button>
        </StActions>
      </StCard>

      <StCard>
        <StCardTitle>지표별 추이</StCardTitle>
        {loading ? (
          <StEmpty>불러오는 중...</StEmpty>
        ) : records.length === 0 ? (
          <StEmpty>
            아직 기록이 없어요. 첫 측정값을 저장하면 추이가 그려져요.
          </StEmpty>
        ) : visibleKeys.length === 0 ? (
          <StEmpty>
            보이는 지표가 없어요. 위 <b>표시 지표 선택</b>에서 켜주세요.
          </StEmpty>
        ) : (
          <StMetricGrid>
            {visibleKeys.map((k) => {
              const points = ordered
                .map((r) => ({ date: r.date, value: r[k] }))
                .filter(
                  (p): p is { date: string; value: number } =>
                    p.value !== undefined && Number.isFinite(p.value),
                );
              const latestVal = latest?.[k];
              const prevVal = previous?.[k];
              const delta =
                latestVal !== undefined && prevVal !== undefined
                  ? Number((latestVal - prevVal).toFixed(METRIC_DECIMALS[k] + 1))
                  : undefined;
              const direction = METRIC_GOOD_DIRECTION[k];
              const deltaTone =
                delta === undefined || delta === 0 || direction === "neutral"
                  ? "neutral"
                  : (delta > 0 && direction === "up") ||
                      (delta < 0 && direction === "down")
                    ? "good"
                    : "bad";

              return (
                <StMetricCard key={k} $color={METRIC_COLOR[k]}>
                  <StMetricTop>
                    <StMetricName>{METRIC_LABEL[k]}</StMetricName>
                    <StMetricCount>
                      {points.length}회
                    </StMetricCount>
                  </StMetricTop>
                  <StMetricValueRow>
                    <StMetricValue>
                      {formatValue(latestVal, k)}
                      <span>{METRIC_UNIT[k]}</span>
                    </StMetricValue>
                    {delta !== undefined ? (
                      <StMetricDelta $tone={deltaTone}>
                        {formatDelta(delta, k)}
                      </StMetricDelta>
                    ) : null}
                  </StMetricValueRow>
                  {points.length > 0 ? (
                    <InBodySparkline points={points} color={METRIC_COLOR[k]} />
                  ) : (
                    <StSparkEmpty>이 지표는 입력된 측정값이 없어요.</StSparkEmpty>
                  )}
                </StMetricCard>
              );
            })}
          </StMetricGrid>
        )}
      </StCard>

      <StCard>
        <StCardTitle>측정 기록</StCardTitle>
        {loading ? (
          <StEmpty>불러오는 중...</StEmpty>
        ) : records.length === 0 ? (
          <StEmpty>아직 기록이 없어요.</StEmpty>
        ) : (
          <StRecordList>
            {records.map((record, idx) => {
              const prev = records[idx + 1];
              return (
                <StRecordRow key={record.id}>
                  <StRecordMain>
                    <StRecordDate>{record.date}</StRecordDate>
                    <StRecordStats>
                      {visibleKeys
                        .filter((k) => record[k] !== undefined)
                        .map((k) => {
                          const cur = record[k] as number;
                          const before = prev?.[k];
                          const delta =
                            before !== undefined
                              ? Number(
                                  (cur - before).toFixed(
                                    METRIC_DECIMALS[k] + 1,
                                  ),
                                )
                              : undefined;
                          const direction = METRIC_GOOD_DIRECTION[k];
                          const deltaTone =
                            delta === undefined || delta === 0 || direction === "neutral"
                              ? "neutral"
                              : (delta > 0 && direction === "up") ||
                                  (delta < 0 && direction === "down")
                                ? "good"
                                : "bad";
                          return (
                            <StStatChip key={k}>
                              <StStatLabel>{METRIC_LABEL[k]}</StStatLabel>
                              <StStatValue>
                                {formatValue(cur, k)}
                                {METRIC_UNIT[k]}
                              </StStatValue>
                              {delta !== undefined ? (
                                <StStatDelta $tone={deltaTone}>
                                  {formatDelta(delta, k)}
                                </StStatDelta>
                              ) : null}
                            </StStatChip>
                          );
                        })}
                    </StRecordStats>
                    {record.memo ? (
                      <StRecordMemo>{record.memo}</StRecordMemo>
                    ) : null}
                  </StRecordMain>
                  <StRecordActions>
                    <StEditBtn type="button" onClick={() => editRecord(record)}>
                      수정
                    </StEditBtn>
                    <StDelBtn
                      type="button"
                      onClick={() => removeRecord(record.id)}
                    >
                      삭제
                    </StDelBtn>
                  </StRecordActions>
                </StRecordRow>
              );
            })}
          </StRecordList>
        )}
      </StCard>
    </StPage>
  );
}

// =========================
// styles
// =========================
const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
`;

const StHeader = styled.header`
  padding: 0.5rem 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StRoomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StRoomName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StLogout = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.4rem 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    border-color: ${({ theme }) => theme.colors.rose200};
  }
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

const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StSelectorBtn = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.4rem 0.75rem;
  border-radius: 0.6rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

const StSelectorBox = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StSelectorHelp = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StChip = styled.button<{ $active: boolean; $color: string }>`
  border: 1px solid
    ${({ $active, $color, theme }) => ($active ? $color : theme.colors.gray200)};
  background: ${({ $active, $color, theme }) =>
    $active ? `${$color}1a` : theme.colors.white};
  color: ${({ $active, $color, theme }) =>
    $active ? $color : theme.colors.gray500};
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 0.12s;
`;

const StRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.7rem;
`;

const StFormGrid = styled.div`
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

const StFieldHead = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem;
`;

const StFieldName = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StFieldUnit = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.12);
  }
`;

const StTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
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

const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

const StMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.7rem;
`;

const StMetricCard = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.85rem;
  padding: 0.75rem 0.85rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const StMetricTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StMetricName = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StMetricCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StMetricValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const StMetricValue = styled.span`
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  line-height: 1.1;

  span {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
    margin-left: 0.2rem;
  }
`;

const StMetricDelta = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $tone }) =>
    $tone === "good" ? "#e6f7ee" : $tone === "bad" ? "#fde8ef" : "#eef0f4"};
  color: ${({ $tone }) =>
    $tone === "good" ? "#1f8a54" : $tone === "bad" ? "#c0304f" : "#7d8593"};
`;

const StSparkEmpty = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
  padding: 1.1rem 0;
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
  gap: 0.4rem;
`;

const StRecordDate = styled.span`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StRecordStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const StStatChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.55rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.55rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StStatLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StStatValue = styled.span`
  font-size: 0.85rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StStatDelta = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
  background: ${({ $tone }) =>
    $tone === "good" ? "#e6f7ee" : $tone === "bad" ? "#fde8ef" : "#eef0f4"};
  color: ${({ $tone }) =>
    $tone === "good" ? "#1f8a54" : $tone === "bad" ? "#c0304f" : "#7d8593"};
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
