"use client";

import styled from "styled-components";
import { CategoryStat, EntryType, StatsScope } from "../types";

type Props = {
  statsType: EntryType;
  statsScope: StatsScope;
  statsPeriodLabel: string;
  categoryStats: CategoryStat[];
  effectiveStatsCategory: string;
  donutStyle: { background: string };
  onChangeStatsType: (type: EntryType) => void;
  onChangeStatsScope: (scope: StatsScope) => void;
  onSelectCategory: (category: string) => void;
  formatAmount: (value: number) => string;
};

export default function StatsPanel({
  statsType,
  statsScope,
  statsPeriodLabel,
  categoryStats,
  effectiveStatsCategory,
  donutStyle,
  onChangeStatsType,
  onChangeStatsScope,
  onSelectCategory,
  formatAmount,
}: Props) {
  const totalAmount = categoryStats.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <>
      <StStatsSwitch>
        <StSwitchButton type="button" $active={statsType === "expense"} onClick={() => onChangeStatsType("expense")}>
          지출
        </StSwitchButton>
        <StSwitchButton type="button" $active={statsType === "income"} onClick={() => onChangeStatsType("income")}>
          수입
        </StSwitchButton>
      </StStatsSwitch>

      <StScopeSwitch>
        <StScopeButton
          type="button"
          $active={statsScope === "monthly"}
          onClick={() => onChangeStatsScope("monthly")}
        >
          월간
        </StScopeButton>
        <StScopeButton
          type="button"
          $active={statsScope === "yearly"}
          onClick={() => onChangeStatsScope("yearly")}
        >
          연간
        </StScopeButton>
      </StScopeSwitch>

      <StTotalBoard>
        <span>{statsPeriodLabel} 전체 항목 합계</span>
        <strong>{formatAmount(totalAmount)}</strong>
      </StTotalBoard>

      <StDonutWrap>
        <StDonut style={donutStyle}>
          <StDonutHole>
            <StDonutTotal>{formatAmount(totalAmount)}</StDonutTotal>
            <StDonutLabel>{statsType === "expense" ? "총 지출" : "총 수입"}</StDonutLabel>
          </StDonutHole>
        </StDonut>
      </StDonutWrap>

      <StCategoryList>
        {categoryStats.length === 0 ? (
          <StEmpty>이번 달 {statsType === "expense" ? "지출" : "수입"} 내역이 없습니다.</StEmpty>
        ) : (
          categoryStats.map((entry) => (
            <StCategoryItem
              key={entry.category}
              type="button"
              $active={effectiveStatsCategory === entry.category}
              onClick={() => onSelectCategory(entry.category)}
            >
              <StCategoryInfo>
                <StColorDot style={{ background: entry.color }} />
                <StCategoryName>{entry.category}</StCategoryName>
              </StCategoryInfo>
              <StRatioBar>
                <StRatioFill style={{ width: `${Math.max(entry.ratio, 2)}%`, background: entry.color }} />
              </StRatioBar>
              <StCategoryAmount>
                <span>{Math.round(entry.ratio)}%</span>
                <strong>{formatAmount(entry.amount)}</strong>
              </StCategoryAmount>
            </StCategoryItem>
          ))
        )}
      </StCategoryList>
    </>
  );
}

const StStatsSwitch = styled.div`
  width: fit-content;
  border-radius: 999px;
  background: #f3f5f8;
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.9rem;
`;
const StSwitchButton = styled.button<{ $active: boolean }>`
  border: none;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 700;
  color: ${({ $active }) => ($active ? "#fff" : "#667085")};
  background: ${({ $active }) => ($active ? "#6fa6c9" : "transparent")};
`;
const StScopeSwitch = styled.div`
  width: fit-content;
  border-radius: 999px;
  background: #f3f5f8;
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.7rem;
`;
const StScopeButton = styled.button<{ $active: boolean }>`
  border: none;
  padding: 0.4rem 0.82rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $active }) => ($active ? "#fff" : "#667085")};
  background: ${({ $active }) => ($active ? "#4c83d8" : "transparent")};
`;
const StTotalBoard = styled.div`
  border: 1px solid #dce6f4;
  background: linear-gradient(135deg, #f2f8ff, #edf4ff);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  span {
    font-size: 0.78rem;
    color: #667085;
    font-weight: 700;
  }
  strong {
    font-size: 0.95rem;
    color: #1f2937;
  }
`;
const StDonutWrap = styled.div`
  display: flex;
  justify-content: center;
  margin: 0.35rem 0 1rem;
`;
const StDonut = styled.div`
  width: min(62vw, 290px);
  aspect-ratio: 1;
  border-radius: 999px;
  display: grid;
  place-items: center;
`;
const StDonutHole = styled.div`
  width: 42%;
  height: 42%;
  border-radius: 999px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0.4rem;
`;
const StDonutTotal = styled.strong`
  font-size: 0.75rem;
  color: #111827;
`;
const StDonutLabel = styled.span`
  font-size: 0.7rem;
  color: #8a94a6;
`;
const StCategoryList = styled.div`
  display: grid;
  gap: 0.55rem;
`;
const StCategoryItem = styled.button<{ $active: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr) minmax(0, 1fr);
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  border: 1px solid ${({ $active }) => ($active ? "#c9dced" : "transparent")};
  background: ${({ $active }) => ($active ? "#f3f8fd" : "transparent")};
  border-radius: 10px;
  padding: 0.45rem 0.5rem;
  text-align: left;
`;
const StCategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;
const StColorDot = styled.span`
  width: 0.78rem;
  height: 0.78rem;
  border-radius: 999px;
  flex-shrink: 0;
`;
const StCategoryName = styled.span`
  font-size: 0.88rem;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const StRatioBar = styled.div`
  height: 0.55rem;
  border-radius: 999px;
  background: #edf1f5;
  overflow: hidden;
`;
const StRatioFill = styled.div`
  height: 100%;
  border-radius: inherit;
`;
const StCategoryAmount = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  span {
    font-size: 0.75rem;
    color: #8a94a6;
  }
  strong {
    font-size: 0.88rem;
    color: #111827;
  }
`;
const StEmpty = styled.p`
  font-size: 0.9rem;
  color: #8a94a6;
  padding: 0.25rem 0;
`;
