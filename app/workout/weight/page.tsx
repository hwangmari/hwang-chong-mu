"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  createWorkoutId,
  deleteGymRecord,
  deleteWorkoutRoutine,
  fetchGymRecords,
  fetchWorkoutRoutines,
  upsertGymRecord,
  upsertWorkoutRoutine,
} from "../repository";
import { parseGymFromText, runWorkoutOcr, type ParsedGym } from "../ocr";
import {
  computeExercisePRs,
  formatDurationMin,
  formatMinInput,
  gymRecordVolumeKg,
  parseMinutesInput,
  setVolumeKg,
  todayISO,
} from "../helpers";
import {
  GYM_BODY_PART_LABEL,
  GYM_EQUIPMENT_LABEL,
  GYM_SET_TYPE_LABEL,
  type GymBodyPart,
  type GymEquipment,
  type GymExercise,
  type GymRecord,
  type GymSet,
  type GymSetType,
  type WorkoutRoutine,
} from "../types";
import { useWorkoutSession } from "../useWorkoutSession";

type FormState = {
  id: string | null;
  date: string;
  bodyPart: GymBodyPart;
  durationMin: string;
  calories: string;
  avgHeartRate: string;
  exercises: GymExercise[];
  memo: string;
};

function emptyForm(): FormState {
  return {
    id: null,
    date: todayISO(),
    bodyPart: "chest",
    durationMin: "",
    calories: "",
    avgHeartRate: "",
    exercises: [createExercise()],
    memo: "",
  };
}

function createExercise(): GymExercise {
  return {
    id: createWorkoutId("ex"),
    name: "",
    equipment: undefined,
    sets: [createSet("normal")],
  };
}

function createSet(type: GymSetType = "normal"): GymSet {
  return {
    id: createWorkoutId("set"),
    weight: 0,
    reps: 0,
    type,
    dropSets: type === "drop" ? [{ weight: 0, reps: 0 }] : undefined,
    note: "",
  };
}

export default function WeightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams?.get("edit") ?? null;
  const appliedEditRef = useRef<string | null>(null);

  const session = useWorkoutSession();
  const [records, setRecords] = useState<GymRecord[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrSummary, setOcrSummary] = useState<string>("");

  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [cloneCounts, setCloneCounts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [rows, routineRows] = await Promise.all([
        fetchGymRecords(session.roomId),
        fetchWorkoutRoutines(session.roomId),
      ]);
      setRecords(rows);
      setRoutines(routineRows);
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
    router.replace("/workout/weight");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, records]);

  const prs = useMemo(() => computeExercisePRs(records), [records]);
  const prMap = useMemo(() => {
    const m = new Map<string, number>();
    prs.forEach((pr) => m.set(pr.exerciseName, pr.weight));
    return m;
  }, [prs]);

  const formVolume = useMemo(
    () =>
      form.exercises.reduce(
        (s, ex) => s + ex.sets.reduce((t, set) => t + setVolumeKg(set), 0),
        0,
      ),
    [form.exercises],
  );

  function resetForm() {
    setForm(emptyForm());
  }

  async function submit() {
    if (!session) return;
    // 맨몸운동은 무게 0 허용, 횟수(시간 플랭크 등)는 reps로 기록
    const filled = form.exercises.filter(
      (ex) => ex.name.trim() && ex.sets.some((s) => s.reps > 0),
    );
    if (filled.length === 0) {
      setError("운동 이름과 횟수가 입력된 세트를 최소 1개 이상 넣어주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await upsertGymRecord({
        id: form.id ?? createWorkoutId("gym"),
        roomId: session.roomId,
        date: form.date,
        bodyPart: form.bodyPart,
        durationMin: parseMinutesInput(form.durationMin) || undefined,
        calories: Number(form.calories) || undefined,
        avgHeartRate: Number(form.avgHeartRate) || undefined,
        exercises: filled,
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

  function editRecord(record: GymRecord) {
    setForm({
      id: record.id,
      date: record.date,
      bodyPart: (record.bodyPart ?? "chest") as GymBodyPart,
      durationMin: formatMinInput(record.durationMin),
      calories: record.calories ? String(record.calories) : "",
      avgHeartRate: record.avgHeartRate ? String(record.avgHeartRate) : "",
      exercises: record.exercises.length
        ? record.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) => ({ ...s })),
          }))
        : [createExercise()],
      memo: record.memo || "",
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function applyParsedGym(parsed: ParsedGym) {
    setForm((prev) => ({
      ...prev,
      durationMin:
        parsed.durationMin !== undefined
          ? String(parsed.durationMin)
          : prev.durationMin,
      calories:
        parsed.calories !== undefined ? String(parsed.calories) : prev.calories,
      avgHeartRate:
        parsed.avgHeartRate !== undefined
          ? String(parsed.avgHeartRate)
          : prev.avgHeartRate,
    }));
  }

  async function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setOcrSummary("");
    setOcrProgress(0);
    try {
      const text = await runWorkoutOcr(file, (ratio) => setOcrProgress(ratio));
      const parsed = parseGymFromText(text);
      applyParsedGym(parsed);

      const filled = [
        parsed.durationMin !== undefined && "운동 시간",
        parsed.calories !== undefined && "칼로리",
        parsed.avgHeartRate !== undefined && "평균 심박",
      ].filter(Boolean) as string[];

      const sourceLabel =
        parsed.source === "apple-fitness" ? "Apple 피트니스" : "일반 텍스트";

      if (filled.length === 0) {
        setError(
          `${sourceLabel} 에서 값을 못 뽑았어요. 원문: ${text
            .slice(0, 120)
            .replace(/\s+/g, " ")}...`,
        );
      } else {
        setOcrSummary(
          `${sourceLabel}에서 ${filled.join("·")} 자동 채움 완료. 운동 종목은 직접 입력해 주세요.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 인식에 실패했어요.");
    } finally {
      setOcrProgress(null);
    }
  }

  function cloneExercisesForForm(exercises: GymExercise[]): GymExercise[] {
    return exercises.map((ex) => ({
      ...ex,
      id: createWorkoutId("ex"),
      sets: ex.sets.map((s) => ({
        ...s,
        id: createWorkoutId("set"),
        dropSets: s.dropSets ? s.dropSets.map((d) => ({ ...d })) : undefined,
      })),
    }));
  }

  async function saveCurrentAsRoutine() {
    if (!session) return;
    const filled = form.exercises.filter(
      (ex) => ex.name.trim() && ex.sets.some((s) => s.weight > 0 || s.reps > 0),
    );
    if (filled.length === 0) {
      setError("루틴으로 저장할 운동이 없어요. 최소 1개 이상 입력해 주세요.");
      return;
    }
    const name = window.prompt(
      "루틴 이름을 지어주세요. (예: 가슴 루틴, 하체 데이)",
      "",
    );
    if (!name?.trim()) return;

    setBusy(true);
    try {
      await upsertWorkoutRoutine({
        id: createWorkoutId("routine"),
        roomId: session.roomId,
        name: name.trim(),
        bodyPart: form.bodyPart,
        exercises: filled,
      });
      await load();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "루틴 저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function loadRoutine(routine: WorkoutRoutine) {
    setForm((prev) => ({
      ...prev,
      bodyPart: routine.bodyPart ?? prev.bodyPart,
      exercises: routine.exercises.length
        ? cloneExercisesForForm(routine.exercises)
        : [createExercise()],
    }));
  }

  async function removeRoutine(routine: WorkoutRoutine) {
    if (!confirm(`루틴 "${routine.name}"을 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteWorkoutRoutine(routine.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "루틴 삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecord(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setBusy(true);
    try {
      await deleteGymRecord(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  // 운동/세트 조작
  function addExercise() {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, createExercise()],
    }));
  }

  function removeExercise(id: string) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== id),
    }));
  }

  function updateExercise(id: string, patch: Partial<GymExercise>) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === id ? { ...ex, ...patch } : ex,
      ),
    }));
  }

  function addSet(exerciseId: string) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const nextSet: GymSet = last
          ? {
              ...last,
              id: createWorkoutId("set"),
              // 드랍셋은 계승하지 않음 (보통 본세트로 이어지니까)
              dropSets: undefined,
              // 워밍업 뒤에 추가하면 본세트로 승격
              type: last.type === "warmup" ? "normal" : last.type,
            }
          : createSet();
        return { ...ex, sets: [...ex.sets, nextSet] };
      }),
    }));
  }

  function cloneLastSet(exerciseId: string, times: number) {
    if (!Number.isFinite(times) || times <= 0) return;
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const source: GymSet = last ?? createSet();
        const clones: GymSet[] = Array.from({ length: times }, () => ({
          ...source,
          id: createWorkoutId("set"),
          dropSets: source.dropSets
            ? source.dropSets.map((d) => ({ ...d }))
            : undefined,
        }));
        return { ...ex, sets: [...ex.sets, ...clones] };
      }),
    }));
  }

  function moveExercise(exerciseId: string, direction: -1 | 1) {
    setForm((prev) => {
      const idx = prev.exercises.findIndex((ex) => ex.id === exerciseId);
      if (idx === -1) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.exercises.length) return prev;
      const exercises = [...prev.exercises];
      [exercises[idx], exercises[next]] = [exercises[next], exercises[idx]];
      return { ...prev, exercises };
    });
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    patch: Partial<GymSet>,
  ) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.id !== setId) return s;
                const next = { ...s, ...patch };
                if (patch.type === "drop" && !next.dropSets) {
                  next.dropSets = [{ weight: 0, reps: 0 }];
                }
                if (patch.type && patch.type !== "drop") {
                  next.dropSets = undefined;
                }
                return next;
              }),
            }
          : ex,
      ),
    }));
  }

  function removeSet(exerciseId: string, setId: string) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex,
      ),
    }));
  }

  function addDropSet(exerciseId: string, setId: string) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId
                  ? {
                      ...s,
                      dropSets: [
                        ...(s.dropSets || []),
                        { weight: 0, reps: 0 },
                      ],
                    }
                  : s,
              ),
            }
          : ex,
      ),
    }));
  }

  function updateDropSet(
    exerciseId: string,
    setId: string,
    idx: number,
    patch: Partial<{ weight: number; reps: number }>,
  ) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId
                  ? {
                      ...s,
                      dropSets: (s.dropSets || []).map((d, i) =>
                        i === idx ? { ...d, ...patch } : d,
                      ),
                    }
                  : s,
              ),
            }
          : ex,
      ),
    }));
  }

  function removeDropSet(exerciseId: string, setId: string, idx: number) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId
                  ? {
                      ...s,
                      dropSets: (s.dropSets || []).filter((_, i) => i !== idx),
                    }
                  : s,
              ),
            }
          : ex,
      ),
    }));
  }

  if (!session) return null;

  return (
    <StPage>
      <StHeader>
        <StTitle>🏋️‍♂️ 웨이트 기록</StTitle>
        <StSubtitle>
          부위별 볼륨과 1RM으로 성장 추이를 확인해요.
        </StSubtitle>
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

        <StRoutineInline>
          <StRoutineInlineHead>
            <span>📋 내 루틴</span>
            <StRoutineSaveBtn
              type="button"
              onClick={saveCurrentAsRoutine}
              disabled={busy}
            >
              + 현재 운동 저장
            </StRoutineSaveBtn>
          </StRoutineInlineHead>
          {routines.length === 0 ? (
            <StRoutineEmpty>
              저장한 루틴이 없어요. 오늘 운동을 입력하고 <b>저장</b>하면 다음에
              한 번에 불러올 수 있어요.
            </StRoutineEmpty>
          ) : (
            <StRoutineList>
              {routines.map((r) => (
                <StRoutineChip key={r.id}>
                  <StRoutineName
                    type="button"
                    onClick={() => loadRoutine(r)}
                    title={`${r.exercises.length}개 운동 · ${r.exercises
                      .map((ex) => ex.name)
                      .join(", ")}`}
                  >
                    {r.name}{" "}
                    <StRoutineCount>({r.exercises.length})</StRoutineCount>
                  </StRoutineName>
                  <StRoutineDel
                    type="button"
                    onClick={() => removeRoutine(r)}
                    aria-label="루틴 삭제"
                  >
                    ✕
                  </StRoutineDel>
                </StRoutineChip>
              ))}
            </StRoutineList>
          )}
        </StRoutineInline>

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
            부위
            <StSelect
              value={form.bodyPart}
              onChange={(e) =>
                setForm({ ...form, bodyPart: e.target.value as GymBodyPart })
              }
            >
              {Object.entries(GYM_BODY_PART_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </StSelect>
          </StLabel>
          <StLabel>
            운동 시간
            <StInput
              type="text"
              inputMode="text"
              placeholder="예) 60 또는 1:30"
              value={form.durationMin}
              onChange={(e) =>
                setForm({ ...form, durationMin: e.target.value })
              }
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

        <StExercisesWrap>
          {form.exercises.map((ex, exIdx) => (
            <StExerciseCard key={ex.id}>
              <StExerciseHead>
                <StExerciseIndex>#{exIdx + 1}</StExerciseIndex>
                <StExerciseName
                  placeholder="운동 이름 (예: 벤치프레스)"
                  value={ex.name}
                  onChange={(e) =>
                    updateExercise(ex.id, { name: e.target.value })
                  }
                />
                <StRemoveButton
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  aria-label="운동 삭제"
                >
                  ✕
                </StRemoveButton>
                <StMoveGroup>
                  <StMoveBtn
                    type="button"
                    onClick={() => moveExercise(ex.id, -1)}
                    disabled={exIdx === 0}
                    aria-label="운동 위로 이동"
                  >
                    ▲
                  </StMoveBtn>
                  <StMoveBtn
                    type="button"
                    onClick={() => moveExercise(ex.id, 1)}
                    disabled={exIdx === form.exercises.length - 1}
                    aria-label="운동 아래로 이동"
                  >
                    ▼
                  </StMoveBtn>
                </StMoveGroup>
              </StExerciseHead>

              <StEquipmentRow>
                {(
                  Object.entries(GYM_EQUIPMENT_LABEL) as [
                    GymEquipment,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <StEquipmentChip
                    key={value}
                    type="button"
                    $active={ex.equipment === value}
                    onClick={() =>
                      updateExercise(ex.id, {
                        equipment: ex.equipment === value ? undefined : value,
                      })
                    }
                  >
                    {label}
                  </StEquipmentChip>
                ))}
              </StEquipmentRow>

              <StSetHead>
                <span>세트</span>
                <span>무게 (kg)</span>
                <span>횟수</span>
                <span>타입</span>
                <span />
              </StSetHead>

              {ex.sets.map((set, setIdx) => (
                <div key={set.id}>
                  <StSetRow>
                    <StSetIndex>{setIdx + 1}</StSetIndex>
                    <StMiniInput
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="무게"
                      value={set.weight || ""}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          weight: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <StMiniInput
                      type="number"
                      placeholder="횟수"
                      value={set.reps || ""}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          reps: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <StTypeSelect
                      value={set.type}
                      onChange={(e) =>
                        updateSet(ex.id, set.id, {
                          type: e.target.value as GymSetType,
                        })
                      }
                    >
                      {Object.entries(GYM_SET_TYPE_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </StTypeSelect>
                    <StRemoveButton
                      type="button"
                      onClick={() => removeSet(ex.id, set.id)}
                    >
                      ✕
                    </StRemoveButton>
                  </StSetRow>

                  {set.type === "drop" ? (
                    <StDropWrap>
                      {(set.dropSets || []).map((d, dIdx) => (
                        <StDropRow key={dIdx}>
                          <span>↳ 드랍 {dIdx + 1}</span>
                          <StMiniInput
                            type="number"
                            step="0.5"
                            placeholder="kg"
                            value={d.weight || ""}
                            onChange={(e) =>
                              updateDropSet(ex.id, set.id, dIdx, {
                                weight: Number(e.target.value) || 0,
                              })
                            }
                          />
                          <StMiniInput
                            type="number"
                            placeholder="회"
                            value={d.reps || ""}
                            onChange={(e) =>
                              updateDropSet(ex.id, set.id, dIdx, {
                                reps: Number(e.target.value) || 0,
                              })
                            }
                          />
                          <StRemoveButton
                            type="button"
                            onClick={() =>
                              removeDropSet(ex.id, set.id, dIdx)
                            }
                          >
                            ✕
                          </StRemoveButton>
                        </StDropRow>
                      ))}
                      <StAddDrop
                        type="button"
                        onClick={() => addDropSet(ex.id, set.id)}
                      >
                        + 드랍 추가
                      </StAddDrop>
                    </StDropWrap>
                  ) : null}
                </div>
              ))}

              <StSetActions>
                <StAddSet type="button" onClick={() => addSet(ex.id)}>
                  + 세트 추가
                </StAddSet>
                <StCloneRow>
                  <span>마지막 세트 ×</span>
                  <StCloneInput
                    type="number"
                    min="1"
                    max="20"
                    placeholder="3"
                    value={cloneCounts[ex.id] ?? ""}
                    onChange={(e) =>
                      setCloneCounts((prev) => ({
                        ...prev,
                        [ex.id]: e.target.value,
                      }))
                    }
                  />
                  <StCloneBtn
                    type="button"
                    onClick={() => {
                      const raw = cloneCounts[ex.id];
                      const n = raw ? Number(raw) : 3;
                      if (!Number.isFinite(n) || n < 1) return;
                      cloneLastSet(ex.id, n);
                      setCloneCounts((prev) => ({ ...prev, [ex.id]: "" }));
                    }}
                  >
                    복제
                  </StCloneBtn>
                </StCloneRow>
              </StSetActions>
            </StExerciseCard>
          ))}
          <StAddExercise type="button" onClick={addExercise}>
            + 운동 추가
          </StAddExercise>
        </StExercisesWrap>

        <StLabel>
          메모
          <StTextarea
            rows={2}
            placeholder="컨디션, 집중 부위, 다음에 시도할 것"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </StLabel>

        <StVolumeBox>
          <StVolumeHint>
            총 볼륨 <b>{Math.round(formVolume).toLocaleString()} kg</b>
          </StVolumeHint>
          <StVolumeHelp>
            💡 <b>총 볼륨 = 무게 × 횟수</b>를 모든 세트에 대해 합한 값이에요.
            무게를 못 올리더라도 세트·횟수를 늘리면 총 볼륨이 올라가서 성장
            지표로 쓸 수 있어요. 워밍업·드랍셋도 전부 포함돼요.
          </StVolumeHelp>
        </StVolumeBox>

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
            아직 기록이 없어요. 오늘 운동을 기록해 보세요!
          </StEmpty>
        ) : (
          <StRecordList>
            {records.map((record) => {
              const volume = gymRecordVolumeKg(record);
              const expanded = expandedId === record.id;
              return (
                <StRecordCard key={record.id}>
                  <StRecordTop
                    onClick={() =>
                      setExpandedId(expanded ? null : record.id)
                    }
                  >
                    <StRecordHead>
                      <StRecordTag>
                        {record.bodyPart
                          ? GYM_BODY_PART_LABEL[record.bodyPart]
                          : "운동"}
                      </StRecordTag>
                      <StRecordDate>{record.date}</StRecordDate>
                    </StRecordHead>
                    <StRecordMeta>
                      <span>
                        <b>{record.exercises.length}</b>개 운동
                      </span>
                      {volume > 0 ? (
                        <span>
                          <b>{Math.round(volume).toLocaleString()}</b> kg
                        </span>
                      ) : null}
                      {record.durationMin ? (
                        <span>{formatDurationMin(record.durationMin)}</span>
                      ) : null}
                      {record.calories ? (
                        <span>{record.calories} kcal</span>
                      ) : null}
                      {record.avgHeartRate ? (
                        <span>{record.avgHeartRate} bpm</span>
                      ) : null}
                    </StRecordMeta>
                  </StRecordTop>

                  {expanded ? (
                    <StExpanded>
                      {record.exercises.map((ex) => {
                        const bestWeight = Math.max(
                          0,
                          ...ex.sets
                            .filter((s) => s.type !== "warmup")
                            .map((s) => s.weight || 0),
                        );
                        const isPR =
                          bestWeight > 0 &&
                          prMap.get(ex.name) === bestWeight;
                        return (
                          <StExRow key={ex.id}>
                            <StExName>
                              {ex.equipment ? (
                                <StExEquipTag>
                                  {GYM_EQUIPMENT_LABEL[ex.equipment]}
                                </StExEquipTag>
                              ) : null}
                              {ex.name || "(이름 없음)"}
                              {isPR ? <StPRBadge>PR 🎉</StPRBadge> : null}
                            </StExName>
                            <StSetList>
                              {ex.sets.map((s, i) => (
                                <StSetChip key={s.id} $warm={s.type === "warmup"}>
                                  {i + 1}: {s.weight}×{s.reps}
                                  {s.type === "drop" && s.dropSets?.length
                                    ? ` → ${s.dropSets
                                        .map((d) => `${d.weight}×${d.reps}`)
                                        .join(" → ")}`
                                    : ""}
                                  {s.type !== "normal" && s.type !== "drop" ? (
                                    <StSetType>
                                      {" "}
                                      ({GYM_SET_TYPE_LABEL[s.type]})
                                    </StSetType>
                                  ) : null}
                                </StSetChip>
                              ))}
                            </StSetList>
                          </StExRow>
                        );
                      })}
                      {record.memo ? (
                        <StRecordMemo>{record.memo}</StRecordMemo>
                      ) : null}
                      <StExpandedActions>
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
                      </StExpandedActions>
                    </StExpanded>
                  ) : null}
                </StRecordCard>
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
`;

const StSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
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
`;

const StRoutineInline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  border-radius: 0.85rem;
`;

const StRoutineInlineHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  span {
    font-size: 0.82rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StRoutineSaveBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue100};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StRoutineEmpty = styled.p`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

const StRoutineList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StRoutineChip = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  border-radius: 0.55rem;
  overflow: hidden;
`;

const StRoutineName = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.4rem 0.65rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

const StRoutineCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  margin-left: 0.15rem;
`;

const StRoutineDel = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.78rem;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  border-left: 1px solid ${({ theme }) => theme.colors.blue100};

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    background: ${({ theme }) => theme.colors.rose50};
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

const StExercisesWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const StExerciseCard = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;

  @media (max-width: 480px) {
    padding: 0.65rem;
  }
`;

const StExerciseHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;

  @media (max-width: 480px) {
    gap: 0.35rem;
  }
`;

const StExerciseIndex = styled.span`
  font-size: 0.78rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.blue600};
  min-width: 1.4rem;
`;

const StExerciseName = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  padding: 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
`;

const StRemoveButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.95rem;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  display: grid;
  place-items: center;

  &:hover {
    background: ${({ theme }) => theme.colors.rose50};
  }
`;

const StEquipmentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.1rem 0;
`;

const StEquipmentChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.blue500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blue50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StSetHead = styled.div`
  display: grid;
  grid-template-columns: 1.6rem 1fr 1fr 1.2fr 1.8rem;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 0 0.1rem;

  span {
    text-align: center;
    min-width: 0;
  }

  span:nth-child(2) {
    text-align: left;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1.3rem 1fr 1fr 1.4fr 1.8rem;
    gap: 0.25rem;
  }
`;

const StSetRow = styled.div`
  display: grid;
  grid-template-columns: 1.6rem 1fr 1fr 1.2fr 1.8rem;
  gap: 0.4rem;
  align-items: center;

  @media (max-width: 480px) {
    grid-template-columns: 1.3rem 1fr 1fr 1.4fr 1.8rem;
    gap: 0.25rem;
  }
`;

const StMoveGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
`;

const StMoveBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0;
  width: 1.6rem;
  height: 1.3rem;
  border-radius: 0.25rem;
  cursor: pointer;
  line-height: 1;
  touch-action: manipulation;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 1.8rem;
    height: 1.5rem;
  }
`;

const StSetActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.1rem;
`;

const StCloneRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
`;

const StCloneInput = styled.input`
  width: 3.4rem;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.45rem;
  padding: 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  background: ${({ theme }) => theme.colors.white};
`;

const StCloneBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  padding: 0.35rem 0.7rem;
  border-radius: 0.45rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

const StSetIndex = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
  text-align: center;
`;

const StMiniInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  padding: 0 0.55rem;
  font-size: 1rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
  text-align: center;

  @media (max-width: 480px) {
    padding: 0 0.3rem;
  }
`;

const StTypeSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  padding: 0 1.4rem 0 0.45rem;
  font-size: 1rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.white};
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;

  @media (max-width: 480px) {
    padding: 0 1.1rem 0 0.3rem;
    background-position: right 0.3rem center;
  }
`;

const StDropWrap = styled.div`
  margin: 0.3rem 0 0.3rem 1.8rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StDropRow = styled.div`
  display: grid;
  grid-template-columns: 4rem 1fr 1fr 1.6rem;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
`;

const StAddDrop = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0;
  text-align: left;
  cursor: pointer;
`;

const StAddSet = styled.button`
  align-self: flex-start;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.4rem 0.8rem;
  border-radius: 0.55rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StAddExercise = styled.button`
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  padding: 0.75rem;
  border-radius: 0.8rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue500};
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

const StVolumeBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0.9rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  border-radius: 0.75rem;
`;

const StVolumeHelp = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 800;
  }
`;

const StVolumeHint = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 700;

  b {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 900;
    font-size: 1rem;
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
  gap: 0.6rem;
`;

const StRecordCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  overflow: hidden;
`;

const StRecordTop = styled.div`
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

const StRecordHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StRecordTag = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.orange500};
  background: ${({ theme }) => theme.colors.orange50};
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
`;

const StRecordDate = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StRecordMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 900;
  }
`;

const StExpanded = styled.div`
  padding: 0.75rem 0.9rem 0.9rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray200};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.gray50};
`;

const StExRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StExName = styled.div`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const StExEquipTag = styled.span`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.12rem 0.4rem;
  border-radius: 0.35rem;
`;

const StPRBadge = styled.span`
  font-size: 0.68rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.amber600};
  background: ${({ theme }) => theme.colors.amber50};
  padding: 0.15rem 0.4rem;
  border-radius: 0.4rem;
`;

const StSetList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StSetChip = styled.span<{ $warm: boolean }>`
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 0.45rem;
  background: ${({ theme, $warm }) =>
    $warm ? theme.colors.gray100 : theme.colors.white};
  color: ${({ theme, $warm }) =>
    $warm ? theme.colors.gray500 : theme.colors.gray800};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StSetType = styled.em`
  font-style: normal;
  color: ${({ theme }) => theme.colors.blue600};
  font-weight: 700;
`;

const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;

const StExpandedActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const StEditBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  padding: 0.35rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;

const StDelBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
  padding: 0.35rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;
