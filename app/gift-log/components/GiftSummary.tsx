"use client";

import { useMemo, useState } from "react";
import { buildYearSummary, listYears } from "../aggregate";
import {
  StBadge,
  StBarFill,
  StBarHead,
  StBarList,
  StBarMeta,
  StBarRow,
  StBarTrack,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StEmpty,
  StGhostBtn,
  StTotalBox,
  StTotalLabel,
  StTotalValue,
  StTotalsGrid,
  StYearBtn,
  StYearLabel,
  StYearSwitch,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_LABEL,
  RELATION_LABEL,
  type DirectionTotal,
  type GiftEntry,
} from "../types";
import { formatAmount, formatBalance } from "./giftFormat";

type GiftSummaryProps = {
  entries: GiftEntry[];
};

// 한 행: 라벨 + 건수 + 나간/받은 금액 + 두 색 막대
function BarRow({
  label,
  total,
  max,
}: {
  label: string;
  total: DirectionTotal;
  max: number;
}) {
  const givenPct = max > 0 ? (total.given / max) * 100 : 0;
  const receivedPct = max > 0 ? (total.received / max) * 100 : 0;
  return (
    <StBarRow>
      <StBarHead>
        <span>
          <b>{label}</b>
          <small>{total.count}건</small>
        </span>
        <StBarMeta>
          <span style={{ color: DIRECTION_COLOR.given }}>
            -{formatAmount(total.given)}
          </span>
          {" · "}
          <span style={{ color: DIRECTION_COLOR.received }}>
            +{formatAmount(total.received)}
          </span>
        </StBarMeta>
      </StBarHead>
      <StBarTrack>
        <StBarFill $pct={givenPct} $color={DIRECTION_COLOR.given} />
        <StBarFill $pct={receivedPct} $color={DIRECTION_COLOR.received} />
      </StBarTrack>
    </StBarRow>
  );
}

export default function GiftSummary({ entries }: GiftSummaryProps) {
  const years = useMemo(() => listYears(entries), [entries]);
  const [picked, setPicked] = useState<number | null>(null);
  // 요약은 보조 정보라 기본은 접어둔다 (핵심은 사람 찾기·명단)
  const [expanded, setExpanded] = useState(false);

  // 고른 연도가 삭제 등으로 사라졌으면 가장 최근 연도로
  const year = picked !== null && years.includes(picked) ? picked : years[0];
  const summary = useMemo(
    () => (year ? buildYearSummary(entries, year) : null),
    [entries, year],
  );

  if (!year || !summary) {
    return (
      <StCard>
        <StCardHead>
          <StCardTitle>📊 요약</StCardTitle>
        </StCardHead>
        <StEmpty>
          기록이 쌓이면 연도별로 나간 돈과 받은 돈을 정리해 드려요.
        </StEmpty>
      </StCard>
    );
  }

  const index = years.indexOf(year);
  const balance = summary.receivedTotal - summary.givenTotal;
  const tone = balance > 0 ? "good" : balance < 0 ? "bad" : "neutral";

  // 막대 기준값: 한 행에서 (나간+받은)이 가장 큰 값
  const eventMax = Math.max(
    0,
    ...summary.byEventType.map((row) => row.total.given + row.total.received),
  );
  const relationMax = Math.max(
    0,
    ...summary.byRelation.map((row) => row.total.given + row.total.received),
  );

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📊 요약</StCardTitle>
        <StYearSwitch>
          {/* years는 내림차순이라 ◀가 과거(다음 인덱스) */}
          <StYearBtn
            type="button"
            disabled={index >= years.length - 1}
            onClick={() => setPicked(years[index + 1])}
            aria-label="이전 연도"
          >
            ◀
          </StYearBtn>
          <StYearLabel>{year}년</StYearLabel>
          <StYearBtn
            type="button"
            disabled={index <= 0}
            onClick={() => setPicked(years[index - 1])}
            aria-label="다음 연도"
          >
            ▶
          </StYearBtn>
        </StYearSwitch>
      </StCardHead>

      <StCardHint>
        {year}년 나간 돈{" "}
        <b style={{ color: DIRECTION_COLOR.given }}>
          {formatAmount(summary.givenTotal)}
        </b>
        {" · "}받은 돈{" "}
        <b style={{ color: DIRECTION_COLOR.received }}>
          {formatAmount(summary.receivedTotal)}
        </b>
        {" · "}차액 <StBadge $tone={tone}>{formatBalance(balance)}</StBadge>{" "}
        <StGhostBtn type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기" : "종류별·관계별 자세히"}
        </StGhostBtn>
      </StCardHint>

      {!expanded ? null : (
        <>
          <StTotalsGrid>
            <StTotalBox $color={DIRECTION_COLOR.given}>
              <StTotalLabel>💸 나간 돈</StTotalLabel>
              <StTotalValue>{formatAmount(summary.givenTotal)}</StTotalValue>
            </StTotalBox>
            <StTotalBox $color={DIRECTION_COLOR.received}>
              <StTotalLabel>💰 받은 돈</StTotalLabel>
              <StTotalValue>{formatAmount(summary.receivedTotal)}</StTotalValue>
            </StTotalBox>
          </StTotalsGrid>
          <StCardHint>
            올해 차액 <StBadge $tone={tone}>{formatBalance(balance)}</StBadge>
          </StCardHint>

          <StCardTitle as="h3">종류별</StCardTitle>
          <StBarList>
            {summary.byEventType.map((row) => (
              <BarRow
                key={row.key}
                label={`${EVENT_TYPE_ICON[row.key]} ${EVENT_TYPE_LABEL[row.key]}`}
                total={row.total}
                max={eventMax}
              />
            ))}
          </StBarList>

          <StCardTitle as="h3">관계별</StCardTitle>
          <StBarList>
            {summary.byRelation.map((row) => (
              <BarRow
                key={`${row.key}|${row.detail}`}
                label={
                  row.detail
                    ? `${RELATION_LABEL[row.key]} · ${row.detail}`
                    : RELATION_LABEL[row.key]
                }
                total={row.total}
                max={relationMax}
              />
            ))}
          </StBarList>
        </>
      )}
    </StCard>
  );
}
