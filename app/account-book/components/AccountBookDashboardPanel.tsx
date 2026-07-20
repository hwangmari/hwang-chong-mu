"use client";

import { useState } from "react";
import styled from "styled-components";
import MonthlyIssueMemo from "./MonthlyIssueMemo";

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
  monthlyBudget: number;
  onChangeAnnualGoal?: (value: number) => boolean | Promise<boolean>;
  onChangeMonthlyBudget?: (value: number) => boolean | Promise<boolean>;
  dashboardRows: DashboardRow[];
  onSelectMonth: (monthNumber: number) => void;
  onOpenIncomeYearly: () => void;
  onOpenExpenseYearly: () => void;
  onOpenAssetYearly: () => void;
  monthlyMemo: string;
  onChangeMonthlyMemo: (value: string) => void;
  onSaveMonthlyMemo: () => void;
};

type AmountEditorProps = {
  initialValue: number;
  onSave: (value: number) => void;
  onCancel: () => void;
  label?: string;
  placeholder?: string;
  // 급여 기준 안내선: 수식 텍스트 + 권장값. 적용 버튼으로 입력칸에 채울 수 있다.
  hint?: { text: string; value: number } | null;
};

function AmountEditor({
  initialValue,
  onSave,
  onCancel,
  label,
  placeholder,
  hint,
}: AmountEditorProps) {
  const [text, setText] = useState(
    initialValue > 0 ? initialValue.toLocaleString("ko-KR") : "",
  );

  const submit = () => {
    const digits = text.replace(/[^0-9]/g, "");
    onSave(digits ? Math.trunc(Number(digits)) : 0);
  };

  return (
    <StEditWrap>
      {label ? <StEditLabel>{label}</StEditLabel> : null}
      {hint ? (
        <StEditHint>
          <span>{hint.text}</span>
          {hint.value > 0 ? (
            <button
              type="button"
              onClick={() => setText(hint.value.toLocaleString("ko-KR"))}
            >
              적용
            </button>
          ) : null}
        </StEditHint>
      ) : null}
      <StEditRow>
        <StEditInput
          type="text"
          inputMode="numeric"
          value={text}
          autoFocus
          placeholder={placeholder || "0"}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
            if (event.key === "Escape") onCancel();
          }}
        />
        <StEditSave type="button" onClick={submit}>
          저장
        </StEditSave>
        <StEditCancel type="button" onClick={onCancel}>
          취소
        </StEditCancel>
      </StEditRow>
    </StEditWrap>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

export default function AccountBookDashboardPanel({
  currentYear,
  currentMonthIndex,
  annualGoal,
  monthlyBudget,
  onChangeAnnualGoal,
  onChangeMonthlyBudget,
  dashboardRows,
  onSelectMonth,
  onOpenIncomeYearly,
  onOpenExpenseYearly,
  onOpenAssetYearly,
  monthlyMemo,
  onChangeMonthlyMemo,
  onSaveMonthlyMemo,
}: Props) {
  const [isAmountHidden, setIsAmountHidden] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const displayNum = (value: number) =>
    isAmountHidden ? "•••••" : formatNumber(value);

  const currentMonthRow =
    dashboardRows.find((row) => row.monthNumber === currentMonthIndex + 1) ||
    dashboardRows[0];

  const hasBudget = monthlyBudget > 0;
  const budgetUsed = currentMonthRow?.consumptionExpense || 0;
  const budgetPercent = hasBudget
    ? Math.round((budgetUsed / monthlyBudget) * 100)
    : 0;
  const budgetProgress = hasBudget
    ? Math.min(Math.max((budgetUsed / monthlyBudget) * 100, 0), 100)
    : 0;
  const isOverBudget = hasBudget && budgetUsed > monthlyBudget;
  const metricColumns = "0.55fr 1fr 1fr 1fr 1fr 1fr";
  const metricMobileColumns = "0.55fr 1fr 1fr 1fr";
  const annualSavings =
    dashboardRows[dashboardRows.length - 1]?.cumulativeSavings || 0;
  const annualAchievementRate =
    annualGoal > 0 ? (annualSavings / annualGoal) * 100 : null;

  const monthlySavingGoal = Math.round(annualGoal / 12);
  // 급여 기준 안내선: 수입 − 고정비 − 월 저축 목표 = 소비에 쓸 수 있는 여유
  const monthIncome = currentMonthRow?.income || 0;
  // 수입 카드 하단 비율 팁: 수입 대비 총 지출/실제 저축
  const monthTotalExpense = currentMonthRow?.totalExpense || 0;
  const monthActualSavings = currentMonthRow?.actualSavings || 0;
  const incomeExpensePct =
    monthIncome > 0 ? Math.round((monthTotalExpense / monthIncome) * 100) : 0;
  const incomeSavingsPct =
    monthIncome > 0 ? Math.round((monthActualSavings / monthIncome) * 100) : 0;
  const incomeLeftoverPct = 100 - incomeExpensePct - incomeSavingsPct;
  const incomeExpenseWidth = Math.min(incomeExpensePct, 100);
  const incomeSavingsWidth = Math.min(
    incomeSavingsPct,
    Math.max(100 - incomeExpenseWidth, 0),
  );
  const monthFixedExpense = currentMonthRow?.fixedExpense || 0;
  const budgetHeadroom = monthIncome - monthFixedExpense - monthlySavingGoal;
  const budgetHint =
    monthIncome > 0
      ? {
          text: `수입 ${formatNumber(monthIncome)} − 고정비 ${formatNumber(
            monthFixedExpense,
          )} − 월 저축 목표 ${formatNumber(monthlySavingGoal)} = 여유 ${formatNumber(
            budgetHeadroom,
          )}원`,
          value: Math.max(budgetHeadroom, 0),
        }
      : null;
  const hasSavingsGoal = monthlySavingGoal > 0;
  const savingsUsed = currentMonthRow?.actualSavings || 0;
  const savingsPercent = hasSavingsGoal
    ? Math.round((savingsUsed / monthlySavingGoal) * 100)
    : 0;
  const savingsProgress = hasSavingsGoal
    ? Math.min(Math.max((savingsUsed / monthlySavingGoal) * 100, 0), 100)
    : 0;
  const isSavingsGoalMet = hasSavingsGoal && savingsUsed >= monthlySavingGoal;

  const chartMax = Math.max(
    1,
    ...dashboardRows.map((row) => Math.max(row.income, row.totalExpense)),
  );
  const hasChartData = dashboardRows.some(
    (row) => row.income > 0 || row.totalExpense > 0,
  );

  return (
    <StWrap>
      <StHeader>
        <div>
          <StTitle>가계부 대시보드</StTitle>
          <StSubTitle>
            {currentYear}년 흐름을 한 화면에서 보고 월을 눌러 바로 이동합니다.
          </StSubTitle>
        </div>
        <StHeaderActions>
          <StAmountToggle
            type="button"
            onClick={() => setIsAmountHidden((prev) => !prev)}
            aria-pressed={isAmountHidden}
          >
            {isAmountHidden ? "금액 보기" : "금액 숨기기"}
          </StAmountToggle>
          <MonthlyIssueMemo
            memo={monthlyMemo}
            onChangeMemo={onChangeMonthlyMemo}
            onSaveMemo={onSaveMonthlyMemo}
          />
        </StHeaderActions>
      </StHeader>

      <StSummaryGrid>
        <StSummaryCell>
          <StSummaryCard type="button" onClick={onOpenIncomeYearly}>
            <span>수입</span>
            <strong>{displayNum(monthIncome)}</strong>
            <em>이번 달 들어온 금액</em>
          </StSummaryCard>
          {/* 수입이 없는 달에도 같은 높이로 렌더해 월 이동 시 카드 높이가 튀지 않게 한다 */}
          <StRatioWrap title="이번 달 수입 대비 총 지출·실제 저축 비율입니다">
            <StGoalBar>
              {monthIncome > 0 ? (
                <>
                  <StRatioSegment
                    $kind="expense"
                    style={{ width: `${incomeExpenseWidth}%` }}
                  />
                  <StRatioSegment
                    $kind="savings"
                    style={{ width: `${incomeSavingsWidth}%` }}
                  />
                </>
              ) : null}
            </StGoalBar>
            <StGoalMeta>
              {monthIncome > 0 ? (
                <>
                  <span>
                    지출 {incomeExpensePct}% · 저축 {incomeSavingsPct}%
                  </span>
                  {incomeLeftoverPct >= 0 ? (
                    <strong>여유 {incomeLeftoverPct}%</strong>
                  ) : (
                    <strong className="over">
                      수입보다 {Math.abs(incomeLeftoverPct)}% 초과
                    </strong>
                  )}
                </>
              ) : (
                <span>이번 달 수입이 아직 없어요</span>
              )}
            </StGoalMeta>
          </StRatioWrap>
        </StSummaryCell>
        <StSummaryRightGrid>
          <StSummaryCell>
            <StSummaryCard type="button" onClick={onOpenExpenseYearly}>
              <span>지출</span>
              <strong>{displayNum(currentMonthRow?.totalExpense || 0)}</strong>
              <em>총 지출 기준</em>
            </StSummaryCard>
            {isEditingBudget ? (
              <AmountEditor
                initialValue={monthlyBudget}
                label="월 예산"
                placeholder="월 예산 금액"
                hint={budgetHint}
                onSave={(value) => {
                  void onChangeMonthlyBudget?.(value);
                  setIsEditingBudget(false);
                }}
                onCancel={() => setIsEditingBudget(false)}
              />
            ) : hasBudget ? (
              <StGoalButton
                type="button"
                onClick={() => setIsEditingBudget(true)}
                title="고정비를 제외한 소비성 지출 기준입니다"
              >
                <StGoalBar>
                  <StGoalFill
                    $over={isOverBudget}
                    style={{ width: `${budgetProgress}%` }}
                  />
                </StGoalBar>
                <StGoalMeta>
                  <span>
                    소비지출 {displayNum(budgetUsed)} / 월 예산{" "}
                    {formatNumber(monthlyBudget)}원
                  </span>
                  {isOverBudget ? (
                    <strong className="over">
                      {formatNumber(budgetUsed - monthlyBudget)}원 초과 (
                      {budgetPercent}%)
                    </strong>
                  ) : (
                    <strong>
                      {formatNumber(monthlyBudget - budgetUsed)}원 남음 (
                      {budgetPercent}%)
                    </strong>
                  )}
                </StGoalMeta>
              </StGoalButton>
            ) : (
              <StSetButton
                type="button"
                onClick={() => setIsEditingBudget(true)}
              >
                월 예산 설정
              </StSetButton>
            )}
          </StSummaryCell>
          <StSummaryCell>
            <StSummaryCard type="button" onClick={onOpenAssetYearly}>
              <span>저축</span>
              <strong>{displayNum(currentMonthRow?.actualSavings || 0)}</strong>
              <em>실제 저축 · 연간 누적 {formatPercent(annualAchievementRate)}</em>
            </StSummaryCard>
            {isEditingGoal ? (
              <AmountEditor
                initialValue={monthlySavingGoal}
                label="월 저축 목표"
                placeholder="월 저축 목표 금액"
                onSave={(value) => {
                  void onChangeAnnualGoal?.(value * 12);
                  setIsEditingGoal(false);
                }}
                onCancel={() => setIsEditingGoal(false)}
              />
            ) : hasSavingsGoal ? (
              <StGoalButton
                type="button"
                onClick={() => setIsEditingGoal(true)}
              >
                <StGoalBar>
                  <StGoalFill style={{ width: `${savingsProgress}%` }} />
                </StGoalBar>
                <StGoalMeta>
                  <span>월 목표 {formatNumber(monthlySavingGoal)}원</span>
                  {isSavingsGoalMet ? (
                    <strong>
                      {formatNumber(savingsUsed - monthlySavingGoal)}원 초과
                      달성 ({savingsPercent}%)
                    </strong>
                  ) : (
                    <strong>
                      {formatNumber(monthlySavingGoal - savingsUsed)}원 남음 (
                      {savingsPercent}%)
                    </strong>
                  )}
                </StGoalMeta>
              </StGoalButton>
            ) : (
              <StSetButton
                type="button"
                onClick={() => setIsEditingGoal(true)}
              >
                월 저축 목표 설정
              </StSetButton>
            )}
          </StSummaryCell>
        </StSummaryRightGrid>
      </StSummaryGrid>

      <StPanel>
        <StChartHead>
          <StPanelTitle>월별 수입 · 지출</StPanelTitle>
          <StChartLegend>
            <span className="income">수입</span>
            <span className="expense">지출</span>
          </StChartLegend>
        </StChartHead>
        {hasChartData ? (
          <StChart>
            {dashboardRows.map((row) => {
              const incomeHeight =
                row.income > 0
                  ? Math.max((row.income / chartMax) * 100, 3)
                  : 0;
              const expenseHeight =
                row.totalExpense > 0
                  ? Math.max((row.totalExpense / chartMax) * 100, 3)
                  : 0;
              return (
                <StChartCol
                  key={`chart-${row.monthNumber}`}
                  type="button"
                  $active={currentMonthIndex + 1 === row.monthNumber}
                  onClick={() => onSelectMonth(row.monthNumber)}
                  title={`${row.monthLabel} · 수입 ${displayNum(
                    row.income,
                  )} · 지출 ${displayNum(row.totalExpense)}`}
                >
                  <StChartBars>
                    <StChartBar
                      className="income"
                      style={{ height: `${incomeHeight}%` }}
                    />
                    <StChartBar
                      className="expense"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </StChartBars>
                  <StChartLabel>{row.monthNumber}</StChartLabel>
                </StChartCol>
              );
            })}
          </StChart>
        ) : (
          <StChartEmpty>아직 표시할 수입·지출 데이터가 없어요.</StChartEmpty>
        )}
      </StPanel>

      <StPanel>
        <StPanelTitle>월별 상세</StPanelTitle>
        <StMetricTable>
          <StMetricHead
            $columns={metricColumns}
            $mobileColumns={metricMobileColumns}
          >
            <StHeadCell $align="left">월</StHeadCell>
            <StHeadCell>수입</StHeadCell>
            <StHeadCell>총 지출</StHeadCell>
            <StHeadCell $hideOnMobile>고정비</StHeadCell>
            <StHeadCell>소비지출</StHeadCell>
            <StHeadCell $hideOnMobile>정기 저축</StHeadCell>
          </StMetricHead>
          {dashboardRows.map((row) => {
            return (
              <StMetricRow
                key={`month-${row.monthNumber}`}
                type="button"
                $columns={metricColumns}
                $mobileColumns={metricMobileColumns}
                $active={currentMonthIndex + 1 === row.monthNumber}
                onClick={() => onSelectMonth(row.monthNumber)}
              >
                <StCell $align="left">{row.monthLabel}</StCell>
                <StCell $tone="positive">{displayNum(row.income)}</StCell>
                <StCell>{displayNum(row.totalExpense)}</StCell>
                <StCell $hideOnMobile>{displayNum(row.fixedExpense)}</StCell>
                <StCell>{displayNum(row.consumptionExpense)}</StCell>
                <StCell $hideOnMobile>{displayNum(row.regularSavings)}</StCell>
              </StMetricRow>
            );
          })}
        </StMetricTable>
      </StPanel>
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

const StHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
`;

const StAmountToggle = styled.button`
  border: 1px solid #e2e3e4;
  border-radius: 999px;
  background: #ffffff;
  color: #8a8e95;
  padding: 0.42rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: #d3d5d8;
    background: #f5f6f7;
    color: #656971;
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
  color: #83878f;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(190px, 0.62fr) minmax(0, 1.38fr);
  gap: 0.75rem;

  @media (max-width: 1080px) {
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

const StSummaryCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StGoalButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0 0.15rem;
  cursor: pointer;
  text-align: left;
`;

const StRatioWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  width: 100%;
  padding: 0 0.15rem;
`;

const StRatioSegment = styled.div<{ $kind: "expense" | "savings" }>`
  height: 100%;
  background: ${({ $kind }) => ($kind === "expense" ? "#8b95a1" : "#3182f6")};

  &:first-child {
    border-radius: 999px 0 0 999px;
  }
`;

const StGoalBar = styled.div`
  display: flex;
  height: 0.4rem;
  border-radius: 999px;
  background: #eceef1;
  overflow: hidden;
`;

const StGoalFill = styled.div<{ $over?: boolean }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $over }) => ($over ? "#e11d48" : "#3182f6")};
  transition: width 0.2s ease;
`;

const StGoalMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  /* span만 있는 달과 strong이 함께 있는 달의 줄 높이를 동일하게 고정 (월 이동 시 흔들림 방지) */
  flex-wrap: nowrap;
  min-height: 1.05rem;

  span {
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 700;
    line-height: 1.35;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 0.74rem;
    color: #3182f6;
    font-weight: 900;
    line-height: 1.35;
    flex-shrink: 0;
    white-space: nowrap;
  }

  strong.over {
    color: #e11d48;
  }
`;

const StSetButton = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  padding: 0 0.15rem;
  font-size: 0.74rem;
  font-weight: 800;
  color: #8a8e95;
  cursor: pointer;

  &:hover {
    color: #3182f6;
  }
`;

const StEditWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
`;

const StEditLabel = styled.span`
  padding: 0 0.15rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #8a8e95;
`;

const StEditHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #8a8e95;
  font-variant-numeric: tabular-nums;

  button {
    flex-shrink: 0;
    border: 1px solid #d3d5d8;
    background: #ffffff;
    color: #3182f6;
    border-radius: 999px;
    padding: 0.12rem 0.5rem;
    font-size: 0.66rem;
    font-weight: 800;
    cursor: pointer;
  }
`;

const StEditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.15rem;
`;

const StEditInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 1px solid #d3d5d8;
  border-radius: 8px;
  padding: 0.38rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #172a48;
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
    border-color: #3182f6;
  }
`;

const StEditSave = styled.button`
  border: none;
  border-radius: 8px;
  background: #3182f6;
  color: #ffffff;
  padding: 0.38rem 0.6rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
`;

const StEditCancel = styled.button`
  border: 1px solid #e2e3e4;
  border-radius: 8px;
  background: #ffffff;
  color: #8a8e95;
  padding: 0.38rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
`;

const StSummaryCard = styled.button`
  width: 100%;
  display: block;
  text-align: left;
  border-radius: 16px;
  border: 1px solid #eaebec;
  background: #fdfdfd;
  padding: 0.75rem 0.85rem;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #dbdcde;
    box-shadow: 0 10px 24px rgba(162, 165, 170, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(154, 157, 163, 0.34);
    outline-offset: 2px;
  }

  small {
    display: block;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    color: #95999f;
  }

  span {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.8rem;
    font-weight: 800;
    color: #30579a;
  }

  strong {
    display: block;
    margin-top: 0.22rem;
    font-size: 1.02rem;
    color: #172a48;
  }

  em {
    display: block;
    margin-top: 0.2rem;
    font-style: normal;
    font-size: 0.72rem;
    color: #8d9198;
  }

  @media (max-width: 720px) {
    em {
      display: none;
    }
  }
`;

const StPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const StPanelTitle = styled.h4`
  font-size: 0.92rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StChartHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StChartLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.74rem;
    font-weight: 800;
    color: #70747c;
  }

  span::before {
    content: "";
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 3px;
  }

  span.income::before {
    background: #3182f6;
  }

  span.expense::before {
    background: #f04452;
  }
`;

const StChart = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0.3rem;
  align-items: end;
  height: 168px;
  padding: 0.6rem 0.2rem 0;
  border: 1px solid #eeeff1;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.white};
`;

const StChartCol = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  border: none;
  background: ${({ $active }) => ($active ? "#f5f6f8" : "transparent")};
  border-radius: 8px;
  padding: 0 0.1rem 0.3rem;
  cursor: pointer;

  &:hover {
    background: #f5f6f8;
  }
`;

const StChartBars = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  min-height: 0;
`;

const StChartBar = styled.div`
  width: 42%;
  max-width: 12px;
  border-radius: 4px 4px 0 0;
  transition: height 0.2s ease;

  &.income {
    background: #3182f6;
  }

  &.expense {
    background: #f04452;
  }
`;

const StChartLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  color: #9aa0a8;
`;

const StChartEmpty = styled.p`
  font-size: 0.82rem;
  color: #8a8e95;
  padding: 1.2rem 0.2rem;
  border: 1px solid #eeeff1;
  border-radius: 14px;
  text-align: center;
`;

const StMetricTable = styled.div`
  max-width: 100%;
`;

const StMetricHead = styled.div<{
  $columns: string;
  $mobileColumns?: string;
}>`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
  padding: 0 0.35rem 0.5rem;
  border-bottom: 1px solid #ededef;

  span {
    font-size: 0.7rem;
    font-weight: 800;
    color: #a3a7ad;
    text-align: right;
    letter-spacing: -0.01em;
  }

  span:first-child {
    text-align: left;
  }

  @media (max-width: 720px) {
    grid-template-columns: ${({ $mobileColumns, $columns }) =>
      $mobileColumns || $columns};

    span {
      font-size: 0.68rem;
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
  align-items: center;
  background: ${({ $active }) => ($active ? "#f5f6f8" : "transparent")};
  border: none;
  border-radius: 10px;
  border-bottom: 1px solid #f4f4f6;
  cursor: pointer;
  transition: background 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f7f8fa;
  }

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
  $tone?: "positive" | "negative" | "neutral" | "over";
  $align?: "left" | "right";
  $hideOnMobile?: boolean;
}>`
  padding: 0.62rem 0.35rem;
  text-align: ${({ $align = "right" }) => $align};
  font-size: 0.8rem;
  font-weight: ${({ $align }) => ($align === "left" ? 800 : 700)};
  font-variant-numeric: tabular-nums;
  color: ${({ $tone, $align, theme }) => {
    if ($align === "left") return theme.colors.gray500;
    if ($tone === "positive") return "#3182f6";
    if ($tone === "over") return "#e11d48";
    if ($tone === "negative") return "#888c94";
    return theme.colors.gray800;
  }};

  @media (max-width: 720px) {
    display: ${({ $hideOnMobile }) => ($hideOnMobile ? "none" : "block")};
    padding: 0.58rem 0.3rem;
    font-size: 0.75rem;
  }
`;

