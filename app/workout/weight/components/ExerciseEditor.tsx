"use client";

import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_BARBELL_WEIGHT_KG } from "../../helpers";
import {
  GYM_EQUIPMENT_LABEL,
  GYM_SET_TYPE_LABEL,
  type GymEquipment,
  type GymExercise,
  type GymMeasure,
  type GymSet,
  type GymSetType,
} from "../../types";
import {
  StAddDrop,
  StAddExercise,
  StAddSet,
  StBarChip,
  StCloneBtn,
  StCloneInput,
  StCloneRow,
  StDropRow,
  StDropWrap,
  StEquipmentChip,
  StEquipmentRow,
  StExerciseCard,
  StExerciseHead,
  StExerciseIndex,
  StExerciseName,
  StExercisesWrap,
  StFullbodyNote,
  StMiniInput,
  StMoveBtn,
  StMoveGroup,
  StRemoveButton,
  StSetActions,
  StSetHead,
  StSetIndex,
  StSetRow,
  StSideChip,
  StTimeChip,
  StTypeSelect,
} from "../page.styles";

type ExerciseEditorProps = {
  exercises: GymExercise[];
  isFullbody: boolean;
  cloneCounts: Record<string, string>;
  setCloneCounts: Dispatch<SetStateAction<Record<string, string>>>;
  onAddExercise: () => void;
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (id: string, patch: Partial<GymExercise>) => void;
  onMoveExercise: (id: string, direction: -1 | 1) => void;
  onAddSet: (exerciseId: string) => void;
  onCloneLastSet: (exerciseId: string, times: number) => void;
  onUpdateSet: (exerciseId: string, setId: string, patch: Partial<GymSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onAddDropSet: (exerciseId: string, setId: string) => void;
  onUpdateDropSet: (
    exerciseId: string,
    setId: string,
    idx: number,
    patch: Partial<{ weight: number; reps: number }>,
  ) => void;
  onRemoveDropSet: (exerciseId: string, setId: string, idx: number) => void;
};

export function ExerciseEditor({
  exercises,
  isFullbody,
  cloneCounts,
  setCloneCounts,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onMoveExercise,
  onAddSet,
  onCloneLastSet,
  onUpdateSet,
  onRemoveSet,
  onAddDropSet,
  onUpdateDropSet,
  onRemoveDropSet,
}: ExerciseEditorProps) {
  return (
    <StExercisesWrap>
      {exercises.map((ex, exIdx) =>
        isFullbody ? (
          <StExerciseCard key={ex.id}>
            <StExerciseHead>
              <StExerciseIndex>#{exIdx + 1}</StExerciseIndex>
              <StExerciseName
                placeholder="운동/활동 (예: 스텝, 폼롤러)"
                value={ex.name}
                onChange={(e) =>
                  onUpdateExercise(ex.id, { name: e.target.value })
                }
              />
              <StRemoveButton
                type="button"
                onClick={() => onRemoveExercise(ex.id)}
                aria-label="항목 삭제"
              >
                ✕
              </StRemoveButton>
              <StMoveGroup>
                <StMoveBtn
                  type="button"
                  onClick={() => onMoveExercise(ex.id, -1)}
                  disabled={exIdx === 0}
                  aria-label="위로 이동"
                >
                  ▲
                </StMoveBtn>
                <StMoveBtn
                  type="button"
                  onClick={() => onMoveExercise(ex.id, 1)}
                  disabled={exIdx === exercises.length - 1}
                  aria-label="아래로 이동"
                >
                  ▼
                </StMoveBtn>
              </StMoveGroup>
            </StExerciseHead>
            <StFullbodyNote
              type="text"
              placeholder="간단 메모 (예: 20분, 가볍게, 3바퀴)"
              value={ex.note ?? ""}
              onChange={(e) =>
                onUpdateExercise(ex.id, { note: e.target.value })
              }
            />
          </StExerciseCard>
        ) : (
        <StExerciseCard key={ex.id}>
          <StExerciseHead>
            <StExerciseIndex>#{exIdx + 1}</StExerciseIndex>
            <StExerciseName
              placeholder="운동 이름 (예: 벤치프레스)"
              value={ex.name}
              onChange={(e) =>
                onUpdateExercise(ex.id, { name: e.target.value })
              }
            />
            <StRemoveButton
              type="button"
              onClick={() => onRemoveExercise(ex.id)}
              aria-label="운동 삭제"
            >
              ✕
            </StRemoveButton>
            <StMoveGroup>
              <StMoveBtn
                type="button"
                onClick={() => onMoveExercise(ex.id, -1)}
                disabled={exIdx === 0}
                aria-label="운동 위로 이동"
              >
                ▲
              </StMoveBtn>
              <StMoveBtn
                type="button"
                onClick={() => onMoveExercise(ex.id, 1)}
                disabled={exIdx === exercises.length - 1}
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
                  onUpdateExercise(ex.id, {
                    equipment: ex.equipment === value ? undefined : value,
                  })
                }
              >
                {label}
              </StEquipmentChip>
            ))}
            <StBarChip
              type="button"
              $active={(ex.barWeight ?? 0) > 0}
              onClick={() =>
                onUpdateExercise(ex.id, {
                  barWeight:
                    (ex.barWeight ?? 0) > 0
                      ? undefined
                      : DEFAULT_BARBELL_WEIGHT_KG,
                })
              }
              title={`빈 바벨 ${DEFAULT_BARBELL_WEIGHT_KG}kg를 자동으로 합산해요. 입력은 원판 무게만!`}
            >
              🏋️ 빈 바 +{DEFAULT_BARBELL_WEIGHT_KG}kg
            </StBarChip>
            <StSideChip
              type="button"
              $active={(ex.sideCount ?? 1) === 2}
              onClick={() =>
                onUpdateExercise(ex.id, {
                  sideCount: (ex.sideCount ?? 1) === 2 ? 1 : 2,
                })
              }
              title="레그프레스·덤벨처럼 양쪽에 같은 무게가 걸리는 운동이면 켜세요 (볼륨 ×2)"
            >
              양쪽 ×2
            </StSideChip>
            <StTimeChip
              type="button"
              $active={ex.measure === "time"}
              onClick={() =>
                onUpdateExercise(ex.id, {
                  measure:
                    ex.measure === "time"
                      ? ("weightReps" as GymMeasure)
                      : ("time" as GymMeasure),
                })
              }
              title="매달리기·플랭크·월싯처럼 버틴 시간(초)을 기록하는 운동이면 켜세요"
            >
              ⏱ 시간 기록
            </StTimeChip>
          </StEquipmentRow>

          <StSetHead>
            <span>세트</span>
            <span>{ex.measure === "time" ? "무게 (kg·선택)" : "무게 (kg)"}</span>
            <span>{ex.measure === "time" ? "시간 (초)" : "횟수"}</span>
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
                  placeholder={ex.measure === "time" ? "kg(선택)" : "무게"}
                  value={set.weight || ""}
                  onChange={(e) =>
                    onUpdateSet(ex.id, set.id, {
                      weight: Number(e.target.value) || 0,
                    })
                  }
                />
                {ex.measure === "time" ? (
                  <StMiniInput
                    type="number"
                    inputMode="numeric"
                    placeholder="초"
                    value={set.durationSec || ""}
                    onChange={(e) =>
                      onUpdateSet(ex.id, set.id, {
                        durationSec: Number(e.target.value) || 0,
                      })
                    }
                  />
                ) : (
                  <StMiniInput
                    type="number"
                    placeholder="횟수"
                    value={set.reps || ""}
                    onChange={(e) =>
                      onUpdateSet(ex.id, set.id, {
                        reps: Number(e.target.value) || 0,
                      })
                    }
                  />
                )}
                <StTypeSelect
                  value={set.type}
                  onChange={(e) =>
                    onUpdateSet(ex.id, set.id, {
                      type: e.target.value as GymSetType,
                    })
                  }
                >
                  {Object.entries(GYM_SET_TYPE_LABEL)
                    // 시간 기록 운동에는 드랍셋 개념이 없어 선택지에서 숨김.
                    .filter(([v]) => !(ex.measure === "time" && v === "drop"))
                    .map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                </StTypeSelect>
                <StRemoveButton
                  type="button"
                  onClick={() => onRemoveSet(ex.id, set.id)}
                >
                  ✕
                </StRemoveButton>
              </StSetRow>

              {set.type === "drop" && ex.measure !== "time" ? (
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
                          onUpdateDropSet(ex.id, set.id, dIdx, {
                            weight: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <StMiniInput
                        type="number"
                        placeholder="회"
                        value={d.reps || ""}
                        onChange={(e) =>
                          onUpdateDropSet(ex.id, set.id, dIdx, {
                            reps: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <StRemoveButton
                        type="button"
                        onClick={() =>
                          onRemoveDropSet(ex.id, set.id, dIdx)
                        }
                      >
                        ✕
                      </StRemoveButton>
                    </StDropRow>
                  ))}
                  <StAddDrop
                    type="button"
                    onClick={() => onAddDropSet(ex.id, set.id)}
                  >
                    + 드랍 추가
                  </StAddDrop>
                </StDropWrap>
              ) : null}
            </div>
          ))}

          <StSetActions>
            <StAddSet type="button" onClick={() => onAddSet(ex.id)}>
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
                  onCloneLastSet(ex.id, n);
                  setCloneCounts((prev) => ({ ...prev, [ex.id]: "" }));
                }}
              >
                복제
              </StCloneBtn>
            </StCloneRow>
          </StSetActions>
        </StExerciseCard>
      ))}
      <StAddExercise type="button" onClick={onAddExercise}>
        {isFullbody ? "+ 운동/활동 추가" : "+ 운동 추가"}
      </StAddExercise>
    </StExercisesWrap>
  );
}
