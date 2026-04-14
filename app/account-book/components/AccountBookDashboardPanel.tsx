"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

type DashboardRow = {
  monthNumber: number;
  monthLabel: string;
  income: number;
  totalExpense: number;
  fixedExpense: number;
  consumptionExpense: number;
  regularSavings: number;
  netAmount: number;
  actualSavings: number;
  savingsRate: number | null;
  cumulativeSavings: number;
  goalAmount: number;
  achievementRate: number | null;
};

type Props = {
  currentYear: number;
  currentMonthIndex: number;
  annualGoal: number;
  monthlyGoal: number;
  onChangeAnnualGoal: (value: number) => boolean | Promise<boolean>;
  onChangeMonthlyGoal: (value: number) => boolean | Promise<boolean>;
  dashboardRows: DashboardRow[];
  onSelectMonth: (monthNumber: number) => void;
  onOpenIncomeYearly: () => void;
  onOpenExpenseYearly: () => void;
  onOpenAssetYearly: () => void;
};

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatGoalInputValue(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("ko-KR");
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

function getValueTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export default function AccountBookDashboardPanel({
  currentYear,
  currentMonthIndex,
  annualGoal,
  monthlyGoal,
  onChangeAnnualGoal,
  onChangeMonthlyGoal,
  dashboardRows,
  onSelectMonth,
  onOpenIncomeYearly,
  onOpenExpenseYearly,
  onOpenAssetYearly,
}: Props) {
  const [editingTarget, setEditingTarget] = useState<
    "annual" | "monthly" | null
  >(null);
  const [annualGoalInput, setAnnualGoalInput] = useState(
    formatNumber(annualGoal),
  );
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(
    formatNumber(monthlyGoal),
  );

  useEffect(() => {
    setAnnualGoalInput(formatNumber(annualGoal));
  }, [annualGoal]);

  useEffect(() => {
    setMonthlyGoalInput(formatNumber(monthlyGoal));
  }, [monthlyGoal]);

  const currentMonthRow =
    dashboardRows.find((row) => row.monthNumber === currentMonthIndex + 1) ||
    dashboardRows[0];
  const annualSavings =
    dashboardRows[dashboardRows.length - 1]?.cumulativeSavings || 0;
  const annualAchievementRate =
    annualGoal > 0 ? (annualSavings / annualGoal) * 100 : null;

  const submitAnnualGoal = async () => {
    const normalizedValue = Number(annualGoalInput.replace(/,/g, "").trim());
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      alert("연간 목표는 0보다 큰 숫자로 입력해주세요.");
      return;
    }
    const saved = await Promise.resolve(onChangeAnnualGoal(normalizedValue));
    if (!saved) {
      return;
    }
    setEditingTarget(null);
  };

  const submitMonthlyGoal = async () => {
    const normalizedValue = Number(monthlyGoalInput.replace(/,/g, "").trim());
    if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
      alert("월간 목표는 0보다 큰 숫자로 입력해주세요.");
      return;
    }
    const saved = await Promise.resolve(onChangeMonthlyGoal(normalizedValue));
    if (!saved) {
      return;
    }
    setEditingTarget(null);
  };

  return (
    <StWrap>
      <StHeader>
        <div>
          <StTitle>가계부 대시보드</StTitle>
          <StSubTitle>
            {currentYear}년 흐름을 한 화면에서 보고 월을 눌러 바로 이동합니다.
          </StSubTitle>
        </div>
      </StHeader>

      <StSummaryGrid>
        <StSummaryCard type="button" onClick={onOpenIncomeYearly}>
          <span>수입</span>
          <strong>{formatNumber(currentMonthRow?.income || 0)}</strong>
          <em>이번 달 들어온 금액</em>
        </StSummaryCard>
        <StSummaryRightGrid>
          <StSummaryCard type="button" onClick={onOpenExpenseYearly}>
            <span>지출</span>
            <strong>{formatNumber(currentMonthRow?.totalExpense || 0)}</strong>
            <em>총 지출 기준</em>
          </StSummaryCard>
          <StSummaryCard type="button" onClick={onOpenAssetYearly}>
            <span>저축</span>
            <strong>{formatNumber(currentMonthRow?.actualSavings || 0)}</strong>
            <em>실제 저축 · {formatPercent(annualAchievementRate)}</em>
          </StSummaryCard>
        </StSummaryRightGrid>
      </StSummaryGrid>

      <StMainGrid>
        <StPanel>
          <StPanelTitle>월별 수입</StPanelTitle>
          <StMonthTable>
            <StMonthTableHead>
              <span>월</span>
              <span>수입 합계</span>
            </StMonthTableHead>
            {dashboardRows.map((row) => (
              <StMonthRow
                key={`income-${row.monthNumber}`}
                type="button"
                $active={currentMonthIndex + 1 === row.monthNumber}
                onClick={() => onSelectMonth(row.monthNumber)}
              >
                <span>{row.monthLabel}</span>
                <strong>{formatNumber(row.income)}</strong>
              </StMonthRow>
            ))}
          </StMonthTable>
        </StPanel>

        <StPanel>
          <StPanelTitle>지출</StPanelTitle>
          <StMetricTable>
            <StMetricHead
              $columns="0.72fr 1fr 1fr 1fr 1fr"
              $mobileColumns="0.72fr 1fr 1fr"
            >
              <StHeadCell $align="left">월</StHeadCell>
              <StHeadCell>총 지출</StHeadCell>
              <StHeadCell $hideOnMobile>고정비</StHeadCell>
              <StHeadCell>소비지출</StHeadCell>
              <StHeadCell $hideOnMobile>정기 저축</StHeadCell>
            </StMetricHead>
            {dashboardRows.map((row) => (
              <StMetricRow
                key={`expense-${row.monthNumber}`}
                type="button"
                $columns="0.72fr 1fr 1fr 1fr 1fr"
                $mobileColumns="0.72fr 1fr 1fr"
                $active={currentMonthIndex + 1 === row.monthNumber}
                onClick={() => onSelectMonth(row.monthNumber)}
              >
                <StCell $align="left">{row.monthLabel}</StCell>
                <StCell>{formatNumber(row.totalExpense)}</StCell>
                <StCell $hideOnMobile>{formatNumber(row.fixedExpense)}</StCell>
                <StCell>{formatNumber(row.consumptionExpense)}</StCell>
                <StCell $hideOnMobile>
                  {formatNumber(row.regularSavings)}
                </StCell>
              </StMetricRow>
            ))}
          </StMetricTable>
        </StPanel>

        <StSavingsPanel>
          <StPanelTitle>저축</StPanelTitle>
          <StGoalMeta>
            <span>연간 저축 {formatNumber(annualSavings)}원</span>
            {editingTarget === "annual" ? (
              <StGoalDisplay
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitAnnualGoal();
                }}
              >
                <label htmlFor="annual-goal-input">연간 목표</label>
                <StGoalValueInput
                  id="annual-goal-input"
                  inputMode="numeric"
                  value={annualGoalInput}
                  onChange={(event) =>
                    setAnnualGoalInput(formatGoalInputValue(event.target.value))
                  }
                />
                <StGoalUnitText>원</StGoalUnitText>
                <button type="submit">완료</button>
              </StGoalDisplay>
            ) : (
              <StGoalDisplay>
                <label>연간 목표</label>
                <StGoalValueText>{formatNumber(annualGoal)}원</StGoalValueText>
                <button
                  type="button"
                  onClick={() => setEditingTarget("annual")}
                >
                  설정
                </button>
              </StGoalDisplay>
            )}
            {editingTarget === "monthly" ? (
              <StGoalDisplay
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitMonthlyGoal();
                }}
              >
                <label htmlFor="monthly-goal-input">월간 목표</label>
                <StGoalValueInput
                  id="monthly-goal-input"
                  inputMode="numeric"
                  value={monthlyGoalInput}
                  onChange={(event) =>
                    setMonthlyGoalInput(
                      formatGoalInputValue(event.target.value),
                    )
                  }
                />
                <StGoalUnitText>원</StGoalUnitText>
                <button type="submit">완료</button>
              </StGoalDisplay>
            ) : (
              <StGoalDisplay>
                <label>월간 목표</label>
                <StGoalValueText>{formatNumber(monthlyGoal)}원</StGoalValueText>
                <button
                  type="button"
                  onClick={() => setEditingTarget("monthly")}
                >
                  설정
                </button>
              </StGoalDisplay>
            )}
          </StGoalMeta>

          <StMetricTable>
            <StMetricHead
              $columns="0.72fr 0.9fr 1fr 0.9fr 1fr 1fr 0.9fr"
              $mobileColumns="0.72fr 1fr 0.9fr"
            >
              <StHeadCell $align="left">월</StHeadCell>
              <StHeadCell $hideOnMobile>수입-지출</StHeadCell>
              <StHeadCell>실제 저축</StHeadCell>
              <StHeadCell $hideOnMobile>저축률</StHeadCell>
              <StHeadCell $hideOnMobile>누적 저축</StHeadCell>
              <StHeadCell $hideOnMobile>누적 목표</StHeadCell>
              <StHeadCell>달성률</StHeadCell>
            </StMetricHead>
            {dashboardRows.map((row) => (
              <StMetricRow
                key={`savings-${row.monthNumber}`}
                type="button"
                $columns="0.72fr 0.9fr 1fr 0.9fr 1fr 1fr 0.9fr"
                $mobileColumns="0.72fr 1fr 0.9fr"
                $active={currentMonthIndex + 1 === row.monthNumber}
                onClick={() => onSelectMonth(row.monthNumber)}
              >
                <StCell $align="left">{row.monthLabel}</StCell>
                <StCell $hideOnMobile $tone={getValueTone(row.netAmount)}>
                  {formatNumber(row.netAmount)}
                </StCell>
                <StCell $tone={getValueTone(row.actualSavings)}>
                  {formatNumber(row.actualSavings)}
                </StCell>
                <StCell
                  $hideOnMobile
                  $tone={
                    row.savingsRate === null
                      ? "neutral"
                      : row.savingsRate >= 0
                        ? "positive"
                        : "negative"
                  }
                >
                  {formatPercent(row.savingsRate)}
                </StCell>
                <StCell
                  $hideOnMobile
                  $tone={getValueTone(row.cumulativeSavings)}
                >
                  {formatNumber(row.cumulativeSavings)}
                </StCell>
                <StCell $hideOnMobile>{formatNumber(row.goalAmount)}</StCell>
                <StCell
                  $tone={
                    row.achievementRate === null
                      ? "neutral"
                      : row.achievementRate >= 0
                        ? "positive"
                        : "negative"
                  }
                >
                  {formatPercent(row.achievementRate)}
                </StCell>
              </StMetricRow>
            ))}
          </StMetricTable>
        </StSavingsPanel>
      </StMainGrid>
    </StWrap>
  );
}

const StWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StSubTitle = styled.p`
  margin-top: 0.18rem;
  font-size: 0.8rem;
  color: #78859a;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(190px, 0.62fr) minmax(0, 1.38fr);
  gap: 0.75rem;

  @media (max-width: 1260px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StSummaryRightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StSummaryCard = styled.button`
  width: 100%;
  display: block;
  text-align: left;
  border-radius: 16px;
  border: 1px solid #e3eaf3;
  background: linear-gradient(180deg, #fbfdff, ${({ theme }) => theme.colors.blue50});
  padding: 0.75rem 0.85rem;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #cfd9ea;
    box-shadow: 0 10px 24px rgba(148, 163, 184, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(88, 110, 229, 0.34);
    outline-offset: 2px;
  }

  small {
    display: block;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    color: #8a96aa;
  }

  span {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.8rem;
    font-weight: 800;
    color: #5f6e86;
  }

  strong {
    display: block;
    margin-top: 0.22rem;
    font-size: 1.02rem;
    color: #253247;
  }

  em {
    display: block;
    margin-top: 0.2rem;
    font-style: normal;
    font-size: 0.72rem;
    color: #8390a2;
  }

  @media (max-width: 720px) {
    em {
      display: none;
    }
  }
`;

const StMainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(190px, 0.62fr) minmax(0, 1.38fr);
  gap: 0.75rem;
  align-items: start;

  @media (max-width: 1260px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-radius: 18px;
  border: 1px solid #dfe6f0;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.8rem;
`;

const StSavingsPanel = styled(StPanel)`
  grid-column: 1 / -1;
`;

const StPanelTitle = styled.h4`
  font-size: 0.92rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StMonthTable = styled.div`
  border: 1px solid #e2e9f2;
  border-radius: 14px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
`;

const StMonthTableHead = styled.div`
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  background: ${({ theme }) => theme.colors.blue50};

  span {
    padding: 0.48rem 0.7rem;
    font-size: 0.74rem;
    font-weight: 900;
    color: #60708c;
    border-left: 1px solid #dde5f0;
  }

  span:first-child {
    border-left: none;
  }
`;

const StMonthRow = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  text-align: left;
  background: ${({ $active, theme }) => ($active ? "#f1f5ff" : theme.colors.white)};
  border: none;
  border-top: 1px solid #e6edf5;

  span,
  strong {
    padding: 0.58rem 0.7rem;
    font-size: 0.8rem;
    border-left: 1px solid #edf2f8;
  }

  span {
    color: ${({ theme }) => theme.colors.gray700};
    font-weight: 800;
    border-left: none;
  }

  strong {
    text-align: right;
    color: #2a467f;
  }
`;

const StMetricTable = styled.div`
  border: 1px solid #e2e9f2;
  border-radius: 14px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
  max-width: 100%;
`;

const StMetricHead = styled.div<{
  $columns: string;
  $mobileColumns?: string;
}>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
  background: ${({ theme }) => theme.colors.blue50};

  span {
    padding: 0.48rem 0.7rem;
    font-size: 0.73rem;
    font-weight: 900;
    color: #60708c;
    text-align: right;
    border-left: 1px solid #dde5f0;
  }

  span:first-child {
    text-align: left;
    border-left: none;
  }

  @media (max-width: 720px) {
    grid-template-columns: ${({ $mobileColumns, $columns }) =>
      $mobileColumns || $columns};

    span {
      padding: 0.45rem 0.5rem;
      font-size: 0.7rem;
    }
  }
`;

const StMetricRow = styled.button<{
  $columns: string;
  $mobileColumns?: string;
  $active: boolean;
}>`
  width: 100%;
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
  background: ${({ $active, theme }) => ($active ? "#f1f5ff" : theme.colors.white)};
  border: none;
  border-top: 1px solid #e6edf5;

  @media (max-width: 720px) {
    grid-template-columns: ${({ $mobileColumns, $columns }) =>
      $mobileColumns || $columns};
  }
`;

const StHeadCell = styled.span<{
  $align?: "left" | "right";
  $hideOnMobile?: boolean;
}>`
  text-align: ${({ $align = "right" }) => $align};

  @media (max-width: 720px) {
    display: ${({ $hideOnMobile }) => ($hideOnMobile ? "none" : "block")};
  }
`;

const StCell = styled.div<{
  $tone?: "positive" | "negative" | "neutral";
  $align?: "left" | "right";
  $hideOnMobile?: boolean;
}>`
  padding: 0.58rem 0.7rem;
  text-align: ${({ $align = "right" }) => $align};
  font-size: 0.79rem;
  font-weight: 800;
  border-left: 1px solid #edf2f8;
  color: ${({ $tone, theme }) => {
    if ($tone === "positive") return theme.colors.teal600;
    if ($tone === "negative") return "#6b63e8";
    return theme.colors.gray700;
  }};

  &:first-child {
    border-left: none;
  }

  @media (max-width: 720px) {
    display: ${({ $hideOnMobile }) => ($hideOnMobile ? "none" : "block")};
    padding: 0.55rem 0.5rem;
    font-size: 0.74rem;
  }
`;

const StGoalMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  flex-wrap: wrap;
  padding-bottom: 0.1rem;

  span {
    border-radius: 999px;
    border: 1px solid #e1e8f2;
    background: ${({ theme }) => theme.colors.blue50};
    padding: 0.28rem 0.6rem;
    font-size: 0.72rem;
    font-weight: 800;
    color: #5f708b;
  }
`;

const StGoalDisplay = styled.form`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  border: 1px solid #d7e1ef;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.26rem 0.32rem 0.26rem 0.6rem;

  label {
    font-size: 0.72rem;
    font-weight: 800;
    color: #5f708b;
  }

  button {
    border-radius: 999px;
    border: 1px solid #d9e2ee;
    background: ${({ theme }) => theme.colors.blue50};
    color: #42639f;
    padding: 0.3rem 0.62rem;
    font-size: 0.72rem;
    font-weight: 900;
  }

  @media (max-width: 720px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
`;

const StGoalValueText = styled.strong`
  font-size: 0.82rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StGoalValueInput = styled.input`
  width: min(7rem, 40%);
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
  outline: none;
  text-align: right;
`;

const StGoalUnitText = styled.span`
  font-size: 0.74rem;
  font-weight: 800;
  color: #6b7d98;
`;
