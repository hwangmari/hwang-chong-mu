"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  groupRecordsByMonth,
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
import { MonthAccordion, useExpandedMonths } from "../components/MonthAccordion";
import { useModal } from "@/components/common/ModalProvider";
import {
  StActions,
  StCard,
  StCardTitle,
  StEmpty,
  StError,
  StGhostButton,
  StHeader,
  StPage,
  StRecordMemo,
  StSubtitle,
  StTitle,
} from "../components/WorkoutSharedStyles";
import {
  StAddButton,
  StCardHead,
  StDelBtn,
  StDelta,
  StEditBtn,
  StEnvButton,
  StEnvTag,
  StEnvToggle,
  StInput,
  StIntervalEmpty,
  StIntervalIndex,
  StIntervalRow,
  StIntervalToggle,
  StIntervalToggleIcon,
  StIntervals,
  StIntervalsHead,
  StIntervalsHeadHint,
  StLabel,
  StMiniInput,
  StOcrButton,
  StOcrSuccess,
  StPaceHint,
  StPrimary,
  StRecordActions,
  StRecordDate,
  StRecordList,
  StRecordMain,
  StRecordRow,
  StRecordStats,
  StRecordTag,
  StRecordTop,
  StRemoveInterval,
  StRow,
  StSelect,
  StStat,
  StTextarea,
} from "./page.styles";

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
  const dateParam = searchParams?.get("date") ?? null;
  const appliedEditRef = useRef<string | null>(null);
  const appliedDateRef = useRef(false);
  const { openConfirm } = useModal();

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
  const { expandedMonths, toggleMonth } = useExpandedMonths();

  const paceDeltaMap = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < records.length; i += 1) {
      const r = records[i];
      const prev = records[i + 1];
      if (!prev) continue;
      const pace =
        r.avgPaceSec ?? computePaceSec(r.distanceKm, r.durationSec);
      const prevPace =
        prev.avgPaceSec ?? computePaceSec(prev.distanceKm, prev.durationSec);
      if (pace && prevPace) m.set(r.id, pace - prevPace);
    }
    return m;
  }, [records]);

  const monthGroups = useMemo(
    () => groupRecordsByMonth(records),
    [records],
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

  // 캘린더에서 우클릭으로 넘어온 날짜 prefill
  useEffect(() => {
    if (!dateParam || appliedDateRef.current) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    appliedDateRef.current = true;
    setForm((f) => ({ ...f, date: dateParam }));
    router.replace("/workout/run");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam]);

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
      // 등록 후에도 방금 입력한 날짜(달)를 유지해 연속 입력이 편하게
      setForm({ ...EMPTY_FORM, date: form.date });
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
      intervals: record.intervals
        ? record.intervals.map((it) => ({
            ...it,
            paceSec:
              it.paceSec ??
              (it.distanceKm && it.distanceKm > 0 && it.durationSec > 0
                ? Math.round(it.durationSec / it.distanceKm)
                : undefined),
          }))
        : [],
      memo: record.memo || "",
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function removeRecord(id: string) {
    if (!(await openConfirm("이 기록을 삭제할까요?"))) return;
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
      intervals: prev.intervals.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, ...patch };
        // 실외(거리+페이스): durationSec 자동 계산
        if (next.distanceKm && next.distanceKm > 0 && next.paceSec) {
          next.durationSec = Math.round(next.distanceKm * next.paceSec);
        }
        return next;
      }),
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
            시간 (분:초 또는 시:분:초)
            <StInput
              type="text"
              placeholder="HH:MM:SS"
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

        <StRow $cols={3}>
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
                  : "거리 · 페이스"}
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
              {form.environment === "indoor" ? (
                <StMiniInput
                  type="text"
                  placeholder="시간 mm:ss"
                  defaultValue={
                    it.durationSec ? formatDuration(it.durationSec) : ""
                  }
                  onBlur={(e) =>
                    updateInterval(it.id, {
                      durationSec: parseDurationInput(e.target.value),
                    })
                  }
                />
              ) : (
                <StMiniInput
                  type="text"
                  placeholder="페이스 mm:ss"
                  defaultValue={it.paceSec ? formatDuration(it.paceSec) : ""}
                  onBlur={(e) =>
                    updateInterval(it.id, {
                      paceSec: parseDurationInput(e.target.value),
                    })
                  }
                />
              )}
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
                : "예) 1km 7:50 페이스 → 3km 7:00 페이스 → 1km 5:00 페이스"}
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
          <MonthAccordion
            groups={monthGroups}
            expandedMonths={expandedMonths}
            onToggle={toggleMonth}
            renderItems={(items) => (
              <StRecordList>
                {items.map((record) => {
                  const pace =
                    record.avgPaceSec ??
                    computePaceSec(record.distanceKm, record.durationSec);
                  const paceDelta = paceDeltaMap.get(record.id);
                  return (
                    <StRecordRow key={record.id}>
                      <StRecordMain>
                        <StRecordTop>
                          <StRecordTag>
                            {RUNNING_TYPE_LABEL[record.runType]}
                          </StRecordTag>
                          <StEnvTag
                            $indoor={record.environment === "indoor"}
                          >
                            {record.environment === "indoor"
                              ? "🏃‍♂️ 실내"
                              : "🌳 실외"}
                          </StEnvTag>
                          <StRecordDate>{record.date}</StRecordDate>
                        </StRecordTop>
                        <StRecordStats>
                          <StStat>
                            <b>{record.distanceKm.toFixed(1)}</b> km
                          </StStat>
                          <StStat>
                            {formatDuration(record.durationSec)}
                          </StStat>
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
                        {record.intervals &&
                        record.intervals.length > 0 ? (
                          <>
                            <StIntervalToggle
                              type="button"
                              onClick={() =>
                                setExpandedIntervalId((id) =>
                                  id === record.id ? null : record.id,
                                )
                              }
                              aria-expanded={
                                expandedIntervalId === record.id
                              }
                            >
                              <StIntervalToggleIcon
                                $open={expandedIntervalId === record.id}
                                aria-hidden
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="9 6 15 12 9 18" />
                                </svg>
                              </StIntervalToggleIcon>
                              {expandedIntervalId === record.id
                                ? "구간 차트 닫기"
                                : `구간 차트 보기 (${record.intervals.length}구간)`}
                            </StIntervalToggle>
                            {expandedIntervalId === record.id ? (
                              <WorkoutIntervalDetailChart
                                intervals={record.intervals}
                                environment={
                                  record.environment ?? "outdoor"
                                }
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
          />
        )}
      </StCard>
    </StPage>
  );
}

function toNumberOrUndefined(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

