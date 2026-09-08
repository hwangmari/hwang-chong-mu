"use client";

import { useMemo, useState } from "react";
import { buildYearSummary, listYears } from "../aggregate";
import {
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
  StMoney,
  StTotalCell,
  StTotalLabel,
  StTotalValue,
  StTotalsBand,
  StYearBtn,
  StYearLabel,
  StYearSwitch,
} from "../page.styles";
import {
  DIRECTION_TONE,
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
          <StMoney $tone={DIRECTION_TONE.given}>
            -{formatAmount(total.given)}
          </StMoney>
          {" · "}
          <StMoney $tone={DIRECTION_TONE.received}>
            +{formatAmount(total.received)}
          </StMoney>
        </StBarMeta>
      </StBarHead>
      <StBarTrack>
        <StBarFill $pct={givenPct} $tone={DIRECTION_TONE.given} />
        <StBarFill $pct={receivedPct} $tone={DIRECTION_TONE.received} />
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
  // 차액은 부호에 따라 색만 바뀐다 (더 받았으면 초록, 더 냈으면 빨강)
  const balanceTone =
    balance > 0
      ? DIRECTION_TONE.received
      : balance < 0
        ? DIRECTION_TONE.given
        : undefined;

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

      {/* 나간 돈 · 받은 돈 · 차액을 상자 세 개가 아니라 띠 한 줄로 */}
      <StTotalsBand>
        <StTotalCell>
          <StTotalLabel>💸 나간 돈</StTotalLabel>
          <StTotalValue $tone={DIRECTION_TONE.given}>
            {formatAmount(summary.givenTotal)}
          </StTotalValue>
        </StTotalCell>
        <StTotalCell>
          <StTotalLabel>💰 받은 돈</StTotalLabel>
          <StTotalValue $tone={DIRECTION_TONE.received}>
            {formatAmount(summary.receivedTotal)}
          </StTotalValue>
        </StTotalCell>
        <StTotalCell>
          <StTotalLabel>차액</StTotalLabel>
          <StTotalValue $tone={balanceTone}>
            {balance === 0 ? "0원" : formatBalance(balance)}
          </StTotalValue>
        </StTotalCell>
      </StTotalsBand>

      <StCardHead>
        <StCardHint>
          {year}년에 {summary.byEventType.reduce((n, r) => n + r.total.count, 0)}건
          주고받았어요.
        </StCardHint>
        <StGhostBtn type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기" : "종류별·관계별 자세히"}
        </StGhostBtn>
      </StCardHead>

      {!expanded ? null : (
        <>
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
