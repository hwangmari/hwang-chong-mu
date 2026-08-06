"use client";

import { formatDelta, formatValue } from "./metricFormat";
import {
  StCard,
  StCardTitle,
  StDelBtn,
  StEditBtn,
  StEmpty,
  StRecordActions,
  StRecordDate,
  StRecordList,
  StRecordMain,
  StRecordMemo,
  StRecordRow,
  StRecordStats,
  StStatChip,
  StStatDelta,
  StStatLabel,
  StStatValue,
} from "../page.styles";
import {
  METRIC_DECIMALS,
  METRIC_GOOD_DIRECTION,
  METRIC_LABEL,
  METRIC_UNIT,
  type InBodyMetricKey,
  type InBodyRecord,
} from "../types";

type RecordHistoryProps = {
  loading: boolean;
  records: InBodyRecord[];
  visibleKeys: InBodyMetricKey[];
  onEdit: (record: InBodyRecord) => void;
  onRemove: (id: string) => void;
};

export default function RecordHistory({
  loading,
  records,
  visibleKeys,
  onEdit,
  onRemove,
}: RecordHistoryProps) {
  return (
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
                          delta === undefined ||
                          delta === 0 ||
                          direction === "neutral"
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
                  <StEditBtn type="button" onClick={() => onEdit(record)}>
                    수정
                  </StEditBtn>
                  <StDelBtn type="button" onClick={() => onRemove(record.id)}>
                    삭제
                  </StDelBtn>
                </StRecordActions>
              </StRecordRow>
            );
          })}
        </StRecordList>
      )}
    </StCard>
  );
}
