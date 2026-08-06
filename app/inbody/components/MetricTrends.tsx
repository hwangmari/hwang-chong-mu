"use client";

import InBodySparkline from "./InBodySparkline";
import { formatDelta, formatValue } from "./metricFormat";
import {
  StCard,
  StCardTitle,
  StEmpty,
  StMetricCard,
  StMetricCount,
  StMetricDelta,
  StMetricGrid,
  StMetricName,
  StMetricTop,
  StMetricValue,
  StMetricValueRow,
  StSparkEmpty,
} from "../page.styles";
import {
  METRIC_COLOR,
  METRIC_DECIMALS,
  METRIC_GOOD_DIRECTION,
  METRIC_LABEL,
  METRIC_UNIT,
  type InBodyMetricKey,
  type InBodyRecord,
} from "../types";

type MetricTrendsProps = {
  loading: boolean;
  hasRecords: boolean;
  visibleKeys: InBodyMetricKey[];
  ordered: InBodyRecord[];
  latest: InBodyRecord | undefined;
  previous: InBodyRecord | undefined;
};

export default function MetricTrends({
  loading,
  hasRecords,
  visibleKeys,
  ordered,
  latest,
  previous,
}: MetricTrendsProps) {
  return (
    <StCard>
      <StCardTitle>지표별 추이</StCardTitle>
      {loading ? (
        <StEmpty>불러오는 중...</StEmpty>
      ) : !hasRecords ? (
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
                  <StMetricCount>{points.length}회</StMetricCount>
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
  );
}
