"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  formatDurationMin,
  gymRecordVolumeKg,
  type MonthGroup,
} from "../../helpers";
import {
  GYM_BODY_PART_LABEL,
  GYM_EQUIPMENT_LABEL,
  GYM_SET_TYPE_LABEL,
  type GymRecord,
} from "../../types";
import { MonthAccordion } from "../../components/MonthAccordion";
import {
  StCard,
  StCardTitle,
  StEmpty,
  StRecordMemo,
} from "../../components/WorkoutSharedStyles";
import {
  StDelBtn,
  StEditBtn,
  StExBarTag,
  StExEquipTag,
  StExName,
  StExNote,
  StExRow,
  StExSideTag,
  StExpanded,
  StExpandedActions,
  StPRBadge,
  StRecordCard,
  StRecordDate,
  StRecordHead,
  StRecordList,
  StRecordMeta,
  StRecordTag,
  StRecordTop,
  StSetChip,
  StSetList,
  StSetType,
} from "../page.styles";

type RecordHistoryProps = {
  loading: boolean;
  records: GymRecord[];
  monthGroups: MonthGroup<GymRecord>[];
  expandedMonths: Set<string>;
  onToggleMonth: (key: string) => void;
  expandedId: string | null;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
  prMap: Map<string, number>;
  onEdit: (record: GymRecord) => void;
  onRemove: (id: string) => void;
};

export function RecordHistory({
  loading,
  records,
  monthGroups,
  expandedMonths,
  onToggleMonth,
  expandedId,
  setExpandedId,
  prMap,
  onEdit,
  onRemove,
}: RecordHistoryProps) {
  return (
    <StCard>
      <StCardTitle>최근 기록</StCardTitle>
      {loading ? (
        <StEmpty>불러오는 중...</StEmpty>
      ) : records.length === 0 ? (
        <StEmpty>
          아직 기록이 없어요. 오늘 운동을 기록해 보세요!
        </StEmpty>
      ) : (
        <MonthAccordion
          groups={monthGroups}
          expandedMonths={expandedMonths}
          onToggle={onToggleMonth}
          renderItems={(items) => (
            <StRecordList>
              {items.map((record) => {
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
                      const bar =
                        ex.barWeight && ex.barWeight > 0
                          ? ex.barWeight
                          : 0;
                      const sideMul =
                        ex.sideCount && ex.sideCount > 0 ? ex.sideCount : 1;
                      // 빈 바가 켜지면 plate=0(빈 바 워밍업)에도 빈 바 무게 합산해서 표시.
                      // 빈 바가 없는 ×2 운동(덤벨 등)은 기존처럼 입력값 그대로 표시.
                      const displayWeight = (plate: number) => {
                        if (bar > 0) return plate * sideMul + bar;
                        return plate;
                      };
                      // PR은 원판이 실제로 들어간 세트만 비교 (빈 바 워밍업 제외).
                      const bestWeight = Math.max(
                        0,
                        ...ex.sets
                          .filter((s) => s.type !== "warmup")
                          .map((s) => {
                            const plate = s.weight || 0;
                            return plate > 0 ? plate * sideMul + bar : 0;
                          }),
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
                            {(ex.sideCount ?? 1) === 2 ? (
                              <StExSideTag>×2</StExSideTag>
                            ) : null}
                            {bar > 0 ? (
                              <StExBarTag>🏋️ +{bar}kg</StExBarTag>
                            ) : null}
                            {ex.name || "(이름 없음)"}
                            {isPR ? <StPRBadge>PR 🎉</StPRBadge> : null}
                          </StExName>
                          <StSetList>
                            {ex.sets.map((s, i) => {
                              const mainW = displayWeight(s.weight || 0);
                              const isTime = ex.measure === "time";
                              return (
                                <StSetChip
                                  key={s.id}
                                  $warm={s.type === "warmup"}
                                >
                                  {isTime ? (
                                    <>
                                      {i + 1}:{" "}
                                      {(s.weight || 0) > 0
                                        ? `${s.weight}kg · `
                                        : ""}
                                      {s.durationSec || 0}초
                                    </>
                                  ) : (
                                    <>
                                      {i + 1}: {mainW}×{s.reps}
                                      {s.type === "drop" && s.dropSets?.length
                                        ? ` → ${s.dropSets
                                            .map(
                                              (d) =>
                                                `${displayWeight(d.weight || 0)}×${d.reps}`,
                                            )
                                            .join(" → ")}`
                                        : ""}
                                    </>
                                  )}
                                  {s.type !== "normal" && s.type !== "drop" ? (
                                    <StSetType>
                                      {" "}
                                      ({GYM_SET_TYPE_LABEL[s.type]})
                                    </StSetType>
                                  ) : null}
                                </StSetChip>
                              );
                            })}
                            {ex.note ? <StExNote>{ex.note}</StExNote> : null}
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
                        onClick={() => onEdit(record)}
                      >
                        수정
                      </StEditBtn>
                      <StDelBtn
                        type="button"
                        onClick={() => onRemove(record.id)}
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
        />
      )}
    </StCard>
  );
}
