"use client";

import { useMemo } from "react";
import styled from "styled-components";

export type AssetFlowRow = {
  monthNumber: number;
  monthLabel: string;
  monthly: number;
  cumulative: number;
};

type Props = {
  rows: AssetFlowRow[];
  totalSavings: number;
  isLoading: boolean;
  year: number;
  isAmountHidden: boolean;
};

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function signed(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(
    value,
  ).toLocaleString()}원`;
}

export default function AssetAnnualFlow({
  rows,
  totalSavings,
  isLoading,
  year,
  isAmountHidden,
}: Props) {
  const yearNet = useMemo(
    () => rows.reduce((sum, row) => sum + row.monthly, 0),
    [rows],
  );
  const yearEndCumulative = rows[rows.length - 1]?.cumulative || 0;
  const maxMonthly = useMemo(
    () => Math.max(...rows.map((row) => Math.abs(row.monthly)), 1),
    [rows],
  );
  const maxCumulative = useMemo(
    () => Math.max(...rows.map((row) => Math.abs(row.cumulative)), 1),
    [rows],
  );

  const mask = (value: number) =>
    isAmountHidden ? "•••••" : formatAmount(value);
  const maskSigned = (value: number) =>
    isAmountHidden ? "•••••" : signed(value);

  const hasData =
    rows.some((row) => row.monthly !== 0) || (rows[0]?.cumulative ?? 0) !== 0;

  return (
    <StCard>
      <StHeader>
        <div>
          <StTitle>{year}년 자산 축적 흐름</StTitle>
          <StSubTitle>
            실제 저축(입금·가계부)만 · 이체·초기잔액은 제외해요.
          </StSubTitle>
        </div>
        <StStatWrap>
          <StStat>
            <span>올해 저축</span>
            <strong>{maskSigned(yearNet)}</strong>
          </StStat>
          <StStat>
            <span>연말 누적</span>
            <strong>{mask(yearEndCumulative)}</strong>
          </StStat>
          <StStat>
            <span>전체 저축</span>
            <strong>{mask(totalSavings)}</strong>
          </StStat>
        </StStatWrap>
      </StHeader>

      {isLoading ? (
        <StEmpty>불러오는 중…</StEmpty>
      ) : !hasData ? (
        <StEmpty>
          아직 저축 내역이 없어요. 통장에 입금하거나 가계부에서 저축을 기록하면
          여기에 월별 저축 흐름이 쌓여요.
        </StEmpty>
      ) : (
        <StTable>
          <StTableHead>
            <span>월</span>
            <span className="chart">월 저축</span>
            <span className="num">월 저축</span>
            <span className="num">누적</span>
          </StTableHead>
          {rows.map((row) => {
            const monthlyWidth =
              row.monthly === 0
                ? 0
                : Math.max((Math.abs(row.monthly) / maxMonthly) * 100, 6);
            const cumulativeWidth = Math.max(
              (Math.abs(row.cumulative) / maxCumulative) * 100,
              row.cumulative === 0 ? 0 : 4,
            );
            return (
              <StRow key={row.monthNumber}>
                <span>{row.monthLabel}</span>
                <StBars className="chart">
                  <StCumulativeBar style={{ width: `${cumulativeWidth}%` }} />
                  <StMonthlyBar
                    style={{ width: `${monthlyWidth}%` }}
                    $negative={row.monthly < 0}
                  />
                </StBars>
                <StNum className="num" $muted={row.monthly === 0}>
                  {row.monthly === 0 ? "-" : maskSigned(row.monthly)}
                </StNum>
                <StNum className="num" $strong>
                  {mask(row.cumulative)}
                </StNum>
              </StRow>
            );
          })}
        </StTable>
      )}
    </StCard>
  );
}

const StCard = styled.section`
  border: 1px solid #e9eaec;
  border-radius: 18px;
  background: #fdfdfe;
  padding: 1.1rem 1.2rem;
`;

const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const StTitle = styled.h3`
  font-size: 1rem;
  font-weight: 900;
  color: #2b3441;
`;

const StSubTitle = styled.p`
  margin-top: 0.15rem;
  font-size: 0.76rem;
  color: #868a92;
`;

const StStatWrap = styled.div`
  display: flex;
  gap: 1.1rem;
  flex-wrap: wrap;
`;

const StStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  span {
    font-size: 0.7rem;
    color: #9aa0a8;
    font-weight: 700;
  }

  strong {
    font-size: 0.92rem;
    font-weight: 900;
    color: #222b36;
  }
`;

const StEmpty = styled.p`
  font-size: 0.84rem;
  color: #8a8e95;
  line-height: 1.6;
`;

const columns = "2.2rem minmax(0, 1fr) 6.5rem 7rem";

const StTable = styled.div`
  display: flex;
  flex-direction: column;
`;

const StTableHead = styled.div`
  display: grid;
  grid-template-columns: ${columns};
  gap: 0.5rem;
  padding: 0 0.15rem 0.5rem;
  align-items: center;

  span {
    font-size: 0.7rem;
    font-weight: 800;
    color: #9aa0a8;
    text-align: right;
  }

  span:first-child {
    text-align: left;
  }

  .chart {
    text-align: left;
  }

  @media (max-width: 640px) {
    grid-template-columns: 2rem minmax(0, 1fr) 5.2rem;
    .chart {
      display: none;
    }
  }
`;

const StRow = styled.div`
  display: grid;
  grid-template-columns: ${columns};
  gap: 0.5rem;
  align-items: center;
  padding: 0.42rem 0.15rem;
  border-top: 1px solid #eef0f2;

  > span:first-child {
    font-size: 0.8rem;
    font-weight: 700;
    color: #5a606a;
  }

  @media (max-width: 640px) {
    grid-template-columns: 2rem minmax(0, 1fr) 5.2rem;
    .chart {
      display: none;
    }
  }
`;

const StBars = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;

const StCumulativeBar = styled.div`
  height: 6px;
  border-radius: 999px;
  background: #d7e3f9;
`;

const StMonthlyBar = styled.div<{ $negative: boolean }>`
  height: 6px;
  border-radius: 999px;
  background: ${({ $negative }) => ($negative ? "#f0a9af" : "#3182f6")};
`;

const StNum = styled.span<{ $muted?: boolean; $strong?: boolean }>`
  text-align: right;
  font-size: 0.8rem;
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
  color: ${({ $muted, $strong }) =>
    $muted ? "#b6bac1" : $strong ? "#222b36" : "#4e5560"};
  white-space: nowrap;
`;
