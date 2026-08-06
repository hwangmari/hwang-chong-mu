"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWorkoutId,
  deleteGymRecord,
  deleteWorkoutRoutine,
  upsertGymRecord,
  upsertWorkoutRoutine,
} from "../repository";
import { parseGymFromText, runWorkoutOcr, type ParsedGym } from "../ocr";
import {
  DEFAULT_BARBELL_WEIGHT_KG,
  parseMinutesInput,
  setVolumeKg,
  todayISO,
} from "../helpers";
import {
  GYM_BODY_PART_LABEL,
  type GymBodyPart,
  type GymExercise,
  type GymRecord,
  type GymSet,
  type GymSetType,
  type WorkoutRoutine,
} from "../types";
import { useWorkoutSession } from "../useWorkoutSession";
import { useExpandedMonths } from "../components/MonthAccordion";
import { useModal } from "@/components/common/ModalProvider";
import {
  StActions,
  StCard,
  StCardTitle,
  StError,
  StGhostButton,
  StHeader,
  StPage,
  StSubtitle,
  StTitle,
} from "../components/WorkoutSharedStyles";
import {
  StCardHead,
  StFullbodyHint,
  StInput,
  StLabel,
  StOcrButton,
  StOcrSuccess,
  StPrimary,
  StRow,
  StSelect,
  StTextarea,
  StVolumeBox,
  StVolumeHelp,
  StVolumeHint,
} from "./page.styles";
import { useWeightData } from "./useWeightData";
import { RoutineSection } from "./components/RoutineSection";
import { ExerciseEditor } from "./components/ExerciseEditor";
import { RecordHistory } from "./components/RecordHistory";

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

// 전신/유산소처럼 무게·세트 없이 이름과 간단 메모만 적는 항목
function createFullbodyItem(): GymExercise {
  return {
    id: createWorkoutId("ex"),
    name: "",
    note: "",
    sets: [],
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
  const dateParam = searchParams?.get("date") ?? null;
  const appliedEditRef = useRef<string | null>(null);
  const appliedDateRef = useRef(false);
  const { openConfirm } = useModal();

  const session = useWorkoutSession();
  const {
    records,
    routines,
    loading,
    busy,
    setBusy,
    error,
    setError,
    load,
    prMap,
    monthGroups,
  } = useWeightData(session);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { expandedMonths, toggleMonth } = useExpandedMonths();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrSummary, setOcrSummary] = useState<string>("");

  const [cloneCounts, setCloneCounts] = useState<Record<string, string>>({});

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

  // 캘린더에서 우클릭으로 넘어온 날짜 prefill
  useEffect(() => {
    if (!dateParam || appliedDateRef.current) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    appliedDateRef.current = true;
    setForm((f) => ({ ...f, date: dateParam }));
    router.replace("/workout/weight");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam]);

  const formVolume = useMemo(
    () =>
      form.exercises.reduce(
        (s, ex) =>
          // 시간 기록 운동은 볼륨 계산에서 제외 (helpers와 동일 기준).
          ex.measure === "time"
            ? s
            : s +
              ex.sets.reduce(
                (t, set) => t + setVolumeKg(set, ex.sideCount, ex.barWeight),
                0,
              ),
        0,
      ),
    [form.exercises],
  );

  // 전신: 무게·세트 없이 이름·메모만 적는 간단 입력 모드
  const isFullbody = form.bodyPart === "fullbody";

  function resetForm() {
    setForm(emptyForm());
  }

  async function submit() {
    if (!session) return;
    // 전신은 무게·세트 없이 이름만 있어도 저장 (스텝·폼롤러 등).
    // 시간 기록 운동(매달리기·플랭크 등)은 시간(초)이 입력된 세트가 있으면 유효.
    // 그 외엔 맨몸운동도 무게 0 허용, 횟수는 reps로 기록.
    const filled = form.exercises.filter((ex) => {
      if (isFullbody) return ex.name.trim();
      if (ex.measure === "time") {
        return ex.name.trim() && ex.sets.some((s) => (s.durationSec ?? 0) > 0);
      }
      return ex.name.trim() && ex.sets.some((s) => s.reps > 0);
    });
    if (filled.length === 0) {
      setError(
        isFullbody
          ? "운동/활동 이름을 최소 1개 이상 입력해 주세요."
          : "운동 이름과 횟수 또는 시간이 입력된 세트를 최소 1개 이상 넣어주세요.",
      );
      return;
    }
    // 전신 항목은 0×0 빈 세트를 제거하고 메모를 정리해서 저장
    const cleaned = isFullbody
      ? filled.map((ex) => ({
          ...ex,
          note: ex.note?.trim() ? ex.note.trim() : undefined,
          sets: ex.sets.filter((s) => s.weight > 0 || s.reps > 0),
        }))
      : filled;
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
        exercises: cleaned,
        memo: form.memo || undefined,
      });
      // 등록 후에도 방금 입력한 날짜(달)를 유지해 연속 입력이 편하게
      setForm({ ...emptyForm(), date: form.date });
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
      durationMin: record.durationMin ? String(record.durationMin) : "",
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
    if (!(await openConfirm(`루틴 "${routine.name}"을 삭제할까요?`))) return;
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
    if (!(await openConfirm("이 기록을 삭제할까요?"))) return;
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

  // 부위 변경: 전신↔일반 전환 시 항목 구조를 모드에 맞게 정리
  function handleBodyPartChange(bodyPart: GymBodyPart) {
    setForm((prev) => {
      // 일반 부위로 전환: 세트가 없는(전신용) 항목은 기본 세트 1개를 채워줌
      if (bodyPart !== "fullbody") {
        return {
          ...prev,
          bodyPart,
          exercises: prev.exercises.map((ex) =>
            ex.sets.length === 0
              ? { ...ex, sets: [createSet("normal")] }
              : ex,
          ),
        };
      }
      return { ...prev, bodyPart };
    });
  }

  // 운동/세트 조작
  function addExercise() {
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        prev.bodyPart === "fullbody" ? createFullbodyItem() : createExercise(),
      ],
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

        <RoutineSection
          routines={routines}
          busy={busy}
          onSave={saveCurrentAsRoutine}
          onLoad={loadRoutine}
          onRemove={removeRoutine}
        />

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
                handleBodyPartChange(e.target.value as GymBodyPart)
              }
            >
              {Object.entries(GYM_BODY_PART_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </StSelect>
          </StLabel>
        </StRow>

        <StRow $cols={3}>
          <StLabel>
            운동 시간 (분)
            <StInput
              type="text"
              placeholder="예) 60 또는 1:30"
              value={form.durationMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationMin: e.target.value.replace(/[^\d:]/g, ""),
                })
              }
            />
          </StLabel>
          <StLabel>
            칼로리 (kcal)
            <StInput
              type="number"
              placeholder="선택"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
          </StLabel>
          <StLabel>
            심박 (bpm)
            <StInput
              type="number"
              placeholder="선택"
              value={form.avgHeartRate}
              onChange={(e) =>
                setForm({ ...form, avgHeartRate: e.target.value })
              }
            />
          </StLabel>
        </StRow>

        {isFullbody ? (
          <StFullbodyHint>
            전신은 무게·세트 없이 한 운동을 적어요. 스텝·폼롤러처럼 분할이
            아닌 활동을 자유롭게 추가하세요.
          </StFullbodyHint>
        ) : null}

        <ExerciseEditor
          exercises={form.exercises}
          isFullbody={isFullbody}
          cloneCounts={cloneCounts}
          setCloneCounts={setCloneCounts}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onUpdateExercise={updateExercise}
          onMoveExercise={moveExercise}
          onAddSet={addSet}
          onCloneLastSet={cloneLastSet}
          onUpdateSet={updateSet}
          onRemoveSet={removeSet}
          onAddDropSet={addDropSet}
          onUpdateDropSet={updateDropSet}
          onRemoveDropSet={removeDropSet}
        />

        <StLabel>
          메모
          <StTextarea
            rows={2}
            placeholder="컨디션, 집중 부위, 다음에 시도할 것"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </StLabel>

        {isFullbody ? null : (
        <StVolumeBox>
          <StVolumeHint>
            총 볼륨 <b>{Math.round(formVolume).toLocaleString()} kg</b>
          </StVolumeHint>
          <StVolumeHelp>
            💡 <b>총 볼륨 = 무게 × 횟수</b>를 모든 세트에 대해 합한 값이에요.
            무게를 못 올리더라도 세트·횟수를 늘리면 총 볼륨이 올라가서 성장
            지표로 쓸 수 있어요. 워밍업·드랍셋도 전부 포함돼요.
            <br />
            🏋️ 덤벨/레그프레스처럼 양쪽에 같은 무게가 걸리면 운동마다{" "}
            <b>양쪽 ×2</b> 토글을 켜세요. 한쪽 무게 그대로 입력해도 볼륨이
            자동으로 두 배 계산돼요.
            <br />
            🏋️ 바벨 운동은 <b>빈 바 +{DEFAULT_BARBELL_WEIGHT_KG}kg</b> 토글을
            켜면 원판 무게만 입력해도 빈 바벨{" "}
            {DEFAULT_BARBELL_WEIGHT_KG}kg가 자동 합산돼요. <b>양쪽 ×2</b>와
            같이 쓰면 한쪽 원판 무게만 입력해도 <b>원판 × 2 + 빈 바</b>로
            계산돼요. (예: 원판 10kg × 2 + 빈 바 20kg ={" "}
            <b>40kg</b>)
          </StVolumeHelp>
        </StVolumeBox>
        )}

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

      <RecordHistory
        loading={loading}
        records={records}
        monthGroups={monthGroups}
        expandedMonths={expandedMonths}
        onToggleMonth={toggleMonth}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        prMap={prMap}
        onEdit={editRecord}
        onRemove={removeRecord}
      />
    </StPage>
  );
}
