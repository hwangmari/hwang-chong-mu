"use client";

import type { WorkoutRoutine } from "../../types";
import {
  StRoutineChip,
  StRoutineCount,
  StRoutineDel,
  StRoutineEmpty,
  StRoutineInline,
  StRoutineInlineHead,
  StRoutineList,
  StRoutineName,
  StRoutineSaveBtn,
} from "../page.styles";

type RoutineSectionProps = {
  routines: WorkoutRoutine[];
  busy: boolean;
  onSave: () => void;
  onLoad: (routine: WorkoutRoutine) => void;
  onRemove: (routine: WorkoutRoutine) => void;
};

export function RoutineSection({
  routines,
  busy,
  onSave,
  onLoad,
  onRemove,
}: RoutineSectionProps) {
  return (
    <StRoutineInline>
      <StRoutineInlineHead>
        <span>📋 내 루틴</span>
        <StRoutineSaveBtn type="button" onClick={onSave} disabled={busy}>
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
                onClick={() => onLoad(r)}
                title={`${r.exercises.length}개 운동 · ${r.exercises
                  .map((ex) => ex.name)
                  .join(", ")}`}
              >
                {r.name}{" "}
                <StRoutineCount>({r.exercises.length})</StRoutineCount>
              </StRoutineName>
              <StRoutineDel
                type="button"
                onClick={() => onRemove(r)}
                aria-label="루틴 삭제"
              >
                ✕
              </StRoutineDel>
            </StRoutineChip>
          ))}
        </StRoutineList>
      )}
    </StRoutineInline>
  );
}
