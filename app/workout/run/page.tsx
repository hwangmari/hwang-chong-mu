"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  createWorkoutId,
  deleteRunningRecord,
  fetchRunningRecords,
  upsertRunningRecord,
} from "../repository";
import { parseRunFromText, runWorkoutOcr, type ParsedRun } from "../ocr";
import {
  computePaceSec,
  formatDuration,
  formatPace,
  parseDurationInput,
  todayISO,
} from "../helpers";
import {
  WorkoutIntervalDetailChart,
  WorkoutPaceTrendByTypeChart,
} from "../components/WorkoutCharts";
import {
  RUNNING_ENVIRONMENT_LABEL,
  RUNNING_TYPE_LABEL,
  type RunningEnvironment,
  type RunningInterval,
  type RunningRecord,
  type RunningType,
} from "../types";
import { useWorkoutSession } from "../useWorkoutSession";

type FormState = {
  id: string | null;
  date: string;
  runType: RunningType;
  environment: RunningEnvironment;
  distanceKm: string;
  durationInput: string;
  avgHeartRate: string;
  avgCadence: string;
  calories: string;
  intervals: RunningInterval[];
  memo: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  date: todayISO(),
  runType: "zone2",
  environment: "outdoor",
  distanceKm: "",
  durationInput: "",
  avgHeartRate: "",
  avgCadence: "",
  calories: "",
  intervals: [],
  memo: "",
};

export default function RunPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams?.get("edit") ?? null;
  const appliedEditRef = useRef<string | null>(null);

  const session = useWorkoutSession();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrSummary, setOcrSummary] = useState<string>("");
  const [expandedIntervalId, setExpandedIntervalId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const rows = await fetchRunningRecords(session.roomId);
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
    router.replace("/workout/run");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, records]);

  const computedPace = useMemo(() => {
    const km = Number(form.distanceKm);
    const sec = parseDurationInput(form.durationInput);
    if (!km || !sec) return undefined;
    return computePaceSec(km, sec);
  }, [form.distanceKm, form.durationInput]);

  function resetForm() {
    setForm({ ...EMPTY_FORM, date: todayISO() });
  }

  async function submit() {
    if (!session) return;
    const km = Number(form.distanceKm);
    const durationSec = parseDurationInput(form.durationInput);
    if (!km || km <= 0) {
      setError("거리를 입력해 주세요.");
      return;
    }
    if (!durationSec) {
      setError("소요 시간을 입력해 주세요. 예: 45:30");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await upsertRunningRecord({
        id: form.id ?? createWorkoutId("run"),
        roomId: session.roomId,
        date: form.date,
        runType: form.runType,
        environment: form.environment,
        distanceKm: km,
        durationSec,
        avgPaceSec: computePaceSec(km, durationSec),
        avgHeartRate: toNumberOrUndefined(form.avgHeartRate),
        avgCadence: toNumberOrUndefined(form.avgCadence),
        calories: toNumberOrUndefined(form.calories),
        intervals: form.intervals.length ? form.intervals : undefined,
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

  function editRecord(record: RunningRecord) {
    setForm({
      id: record.id,
      date: record.date,
      runType: record.runType,
      environment: record.environment ?? "outdoor",
      distanceKm: String(record.distanceKm),
      durationInput: formatDuration(record.durationSec),
      avgHeartRate: record.avgHeartRate ? String(record.avgHeartRate) : "",
      avgCadence: record.avgCadence ? String(record.avgCadence) : "",
      calories: record.calories ? String(record.calories) : "",
      intervals: record.intervals ? [...record.intervals] : [],
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
      await deleteRunningRecord(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function addInterval() {
    setForm((prev) => ({
      ...prev,
      intervals: [
        ...prev.intervals,
        {
          id: createWorkoutId("int"),
          durationSec: 0,
        },
      ],
    }));
  }

  function updateInterval(id: string, patch: Partial<RunningInterval>) {
    setForm((prev) => ({
      ...prev,
      intervals: prev.intervals.map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    }));
  }

  function removeInterval(id: string) {
    setForm((prev) => ({
      ...prev,
      intervals: prev.intervals.filter((it) => it.id !== id),
    }));
  }

  function applyParsedRun(parsed: ParsedRun) {
    setForm((prev) => ({
      ...prev,
      environment: parsed.environment ?? prev.environment,
      runType: parsed.runType ?? prev.runType,
      distanceKm:
        parsed.distanceKm !== undefined ? String(parsed.distanceKm) : prev.distanceKm,
      durationInput:
        parsed.durationSec !== undefined
          ? formatDuration(parsed.durationSec)
          : prev.durationInput,
      avgHeartRate:
        parsed.avgHeartRate !== undefined
          ? String(parsed.avgHeartRate)
          : prev.avgHeartRate,
      avgCadence:
        parsed.avgCadence !== undefined
          ? String(parsed.avgCadence)
          : prev.avgCadence,
      calories:
        parsed.calories !== undefined ? String(parsed.calories) : prev.calories,
    }));
  }

  async function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    setError("");
    setOcrSummary("");
    setOcrProgress(0);
    try {
      const text = await runWorkoutOcr(file, (ratio) => setOcrProgress(ratio));
      const parsed = parseRunFromText(text);
      applyParsedRun(parsed);

      const filled = [
        parsed.distanceKm !== undefined && "거리",
        parsed.durationSec !== undefined && "시간",
        parsed.avgPaceSec !== undefined && "페이스",
        parsed.avgHeartRate !== undefined && "심박",
        parsed.avgCadence !== undefined && "케이던스",
        parsed.calories !== undefined && "칼로리",
      ].filter(Boolean) as string[];

      const sourceLabel =
        parsed.source === "apple-fitness"
          ? "Apple 피트니스"
          : parsed.source === "treadmill"
          ? "러닝머신"
          : "일반 텍스트";

      if (filled.length === 0) {
        setError(
          `${sourceLabel} 포맷으로 감지됐지만 값을 못 뽑았어요. 원문: ${text
            .slice(0, 120)
            .replace(/\s+/g, " ")}...`,
        );
      } else {
        setOcrSummary(
          `${sourceLabel}에서 ${filled.join("·")} 자동 채움 완료. 확인 후 저장하세요.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 인식에 실패했어요.");
    } finally {
      setOcrProgress(null);
    }
  }

  if (!session) return null;

  return (
    <StPage>
      <StHeader>
        <StTitle>🏃‍♀️ 러닝 기록</StTitle>
        <StSubtitle>오늘의 런을 남기고 지난 페이스와 비교해 보세요.</StSubtitle>
      </StHeader>

      <StCard>
        <StCardHead>
          <StCardTitle>{form.id ? "기록 수정" : "새 기록"}</StCardTitle>
          <StOcrButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrProgress !== null}
          >
            📷{" "}
            {ocrProgress !== null
              ? `인식 중 ${Math.round((ocrProgress || 0) * 100)}%`
              : "사진으로 채우기"}
          </StOcrButton>
        </StCardHead>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFilePick}
        />
        {ocrSummary ? <StOcrSuccess>{ocrSummary}</StOcrSuccess> : null}

        <StEnvToggle>
          {(
            Object.entries(RUNNING_ENVIRONMENT_LABEL) as [
              RunningEnvironment,
              string,
            ][]
          ).map(([value, label]) => (
            <StEnvButton
              key={value}
              type="button"
              $active={form.environment === value}
              onClick={() => setForm({ ...form, environment: value })}
            >
              {value === "outdoor" ? "🌳 " : "🏃‍♂️ "}
              {label}
            </StEnvButton>
          ))}
        </StEnvToggle>

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
            운동 종류
            <StSelect
              value={form.runType}
              onChange={(e) =>
                setForm({ ...form, runType: e.target.value as RunningType })
              }
            >
              {Object.entries(RUNNING_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </StSelect>
          </StLabel>
        </StRow>

        <StRow>
          <StLabel>
            거리 (km)
            <StInput
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="예) 5.2"
              value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
            />
          </StLabel>
          <StLabel>
            시간 (mm:ss 또는 h:mm:ss)
            <StInput
              type="text"
              placeholder="예) 32:40"
              value={form.durationInput}
              onChange={(e) =>
                setForm({ ...form, durationInput: e.target.value })
              }
            />
          </StLabel>
        </StRow>

        <StPaceHint>
          평균 페이스: <b>{formatPace(computedPace)}</b>
        </StPaceHint>

        <StRow>
          <StLabel>
            평균 심박 (bpm)
            <StInput
              type="number"
              placeholder="예) 152"
              value={form.avgHeartRate}
              onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })}
            />
          </StLabel>
          <StLabel>
            케이던스 (spm)
            <StInput
              type="number"
              placeholder="예) 172"
              value={form.avgCadence}
              onChange={(e) => setForm({ ...form, avgCadence: e.target.value })}
            />
          </StLabel>
          <StLabel>
            칼로리 (kcal)
            <StInput
              type="number"
              placeholder="예) 340"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
          </StLabel>
        </StRow>

        <StIntervals>
          <StIntervalsHead>
            <span>
              구간(인터벌){" "}
              <StIntervalsHeadHint>
                {form.environment === "indoor"
                  ? "속도 · 경사 · 시간"
                  : "거리 · 시간"}
              </StIntervalsHeadHint>
            </span>
            <StAddButton type="button" onClick={addInterval}>
              + 구간 추가
            </StAddButton>
          </StIntervalsHead>
          {form.intervals.map((it, idx) => (
            <StIntervalRow key={it.id} $indoor={form.environment === "indoor"}>
              <StIntervalIndex>{idx + 1}</StIntervalIndex>
              {form.environment === "indoor" ? (
                <>
                  <StMiniInput
                    type="number"
                    step="0.1"
                    placeholder="속도 km/h"
                    value={it.speedKmh ?? ""}
                    onChange={(e) =>
                      updateInterval(it.id, {
                        speedKmh: toNumberOrUndefined(e.target.value),
                      })
                    }
                  />
                  <StMiniInput
                    type="number"
                    step="0.5"
                    placeholder="경사 %"
                    value={it.inclineLevel ?? ""}
                    onChange={(e) =>
                      updateInterval(it.id, {
                        inclineLevel: toNumberOrUndefined(e.target.value),
                      })
                    }
                  />
                </>
              ) : (
                <StMiniInput
                  type="number"
                  step="0.01"
                  placeholder="거리 km"
                  value={it.distanceKm ?? ""}
                  onChange={(e) =>
                    updateInterval(it.id, {
                      distanceKm: toNumberOrUndefined(e.target.value),
                    })
                  }
                />
              )}
              <StMiniInput
                type="text"
                placeholder="시간 mm:ss"
                defaultValue={it.durationSec ? formatDuration(it.durationSec) : ""}
                onBlur={(e) =>
                  updateInterval(it.id, {
                    durationSec: parseDurationInput(e.target.value),
                  })
                }
              />
              <StRemoveInterval
                type="button"
                onClick={() => removeInterval(it.id)}
              >
                ✕
              </StRemoveInterval>
            </StIntervalRow>
          ))}
          {form.intervals.length === 0 ? (
            <StIntervalEmpty>
              {form.environment === "indoor"
                ? "예) 10분 10km/h 평지 → 5분 6km/h 경사 8% → 3분 12km/h 평지"
                : "인터벌 세션이면 구간별로 거리+시간을 기록해 보세요."}
            </StIntervalEmpty>
          ) : null}
        </StIntervals>

        <StLabel>
          메모
          <StTextarea
            rows={2}
            placeholder="컨디션, 날씨, 코스 등"
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

      <WorkoutPaceTrendByTypeChart records={records} />

      <StCard>
        <StCardTitle>최근 기록</StCardTitle>
        {loading ? (
          <StEmpty>불러오는 중...</StEmpty>
        ) : records.length === 0 ? (
          <StEmpty>아직 기록이 없어요. 오늘의 첫 런을 남겨보세요!</StEmpty>
        ) : (
          <StRecordList>
            {records.map((record, idx) => {
              const prev = records[idx + 1];
              const pace =
                record.avgPaceSec ??
                computePaceSec(record.distanceKm, record.durationSec);
              const prevPace = prev
                ? prev.avgPaceSec ??
                  computePaceSec(prev.distanceKm, prev.durationSec)
                : undefined;
              const paceDelta =
                pace && prevPace ? pace - prevPace : undefined;
              return (
                <StRecordRow key={record.id}>
                  <StRecordMain>
                    <StRecordTop>
                      <StRecordTag>
                        {RUNNING_TYPE_LABEL[record.runType]}
                      </StRecordTag>
                      <StEnvTag $indoor={record.environment === "indoor"}>
                        {record.environment === "indoor" ? "🏃‍♂️ 실내" : "🌳 실외"}
                      </StEnvTag>
                      <StRecordDate>{record.date}</StRecordDate>
                    </StRecordTop>
                    <StRecordStats>
                      <StStat>
                        <b>{record.distanceKm.toFixed(1)}</b> km
                      </StStat>
                      <StStat>{formatDuration(record.durationSec)}</StStat>
                      <StStat>{formatPace(pace)}</StStat>
                      {paceDelta ? (
                        <StDelta $up={paceDelta > 0}>
                          {paceDelta > 0 ? "▲" : "▼"}{" "}
                          {Math.abs(paceDelta)}초 vs 직전
                        </StDelta>
                      ) : null}
                    </StRecordStats>
                    {record.memo ? (
                      <StRecordMemo>{record.memo}</StRecordMemo>
                    ) : null}
                    {record.intervals && record.intervals.length > 0 ? (
                      <>
                        <StIntervalToggle
                          type="button"
                          onClick={() =>
                            setExpandedIntervalId((id) =>
                              id === record.id ? null : record.id,
                            )
                          }
                          aria-expanded={expandedIntervalId === record.id}
                        >
                          {expandedIntervalId === record.id
                            ? "▾ 구간 차트 닫기"
                            : `▸ 구간 차트 보기 (${record.intervals.length}구간)`}
                        </StIntervalToggle>
                        {expandedIntervalId === record.id ? (
                          <WorkoutIntervalDetailChart
                            intervals={record.intervals}
                            environment={record.environment ?? "outdoor"}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </StRecordMain>
                  <StRecordActions>
                    <StEditBtn
                      type="button"
                      onClick={() => editRecord(record)}
                    >
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

function toNumberOrUndefined(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// =========================
// styles
// =========================
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
  width: 100%;
  min-width: 0;
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

const StSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 2.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.88rem;
  font-family: inherit;
  resize: vertical;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

const StPaceHint = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray500};

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StOcrButton = styled.button`
  align-self: flex-start;
  border: 1px dashed ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.84rem;
  font-weight: 800;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue100};
    border-color: ${({ theme }) => theme.colors.blue500};
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
`;

const StOcrSuccess = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.green600};
  background: ${({ theme }) => theme.colors.green50};
  padding: 0.5rem 0.75rem;
  border-radius: 0.55rem;
  line-height: 1.4;
`;

const StEnvToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  padding: 0.3rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.8rem;
`;

const StEnvButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 0.6rem;
  padding: 0.65rem 0.5rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.white : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  box-shadow: ${({ $active }) =>
    $active ? "0 2px 8px rgba(41, 58, 92, 0.08)" : "none"};
  transition: all 0.15s;
`;

const StIntervalsHeadHint = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  margin-left: 0.35rem;
`;

const StIntervals = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.8rem;
`;

const StIntervalsHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StAddButton = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;

const StIntervalRow = styled.div<{ $indoor: boolean }>`
  display: grid;
  grid-template-columns: ${({ $indoor }) =>
    $indoor ? "1.2rem 1fr 1fr 1fr 1.4rem" : "1.2rem 1fr 1fr 1.4rem"};
  gap: 0.4rem;
  align-items: center;
`;

const StIntervalIndex = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StMiniInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.4rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  padding: 0 0.55rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.white};
`;

const StRemoveInterval = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.9rem;
  cursor: pointer;
`;

const StIntervalEmpty = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
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
  background: linear-gradient(135deg, #607de0, #4b69c8);
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
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
`;

const StEnvTag = styled.span<{ $indoor: boolean }>`
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $indoor, theme }) =>
    $indoor ? theme.colors.amber50 : theme.colors.green50};
  color: ${({ $indoor, theme }) =>
    $indoor ? theme.colors.amber600 : theme.colors.green600};
`;

const StRecordDate = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

const StRecordStats = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StStat = styled.span`
  font-weight: 700;

  b {
    font-size: 1rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StDelta = styled.span<{ $up: boolean }>`
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.45rem;
  border-radius: 0.45rem;
  background: ${({ $up }) => ($up ? "#fee" : "#e6f7ee")};
  color: ${({ $up }) => ($up ? "#c0304f" : "#1f8a54")};
`;

const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

const StIntervalToggle = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.2rem 0;
  cursor: pointer;
  letter-spacing: -0.01em;

  &:hover {
    text-decoration: underline;
  }
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
