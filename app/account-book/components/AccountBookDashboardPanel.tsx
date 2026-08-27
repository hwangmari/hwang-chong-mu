"use client";

import { useState } from "react";
import styled from "styled-components";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import MonthlyIssueMemo from "./MonthlyIssueMemo";

type DashboardRow = {
  monthNumber: number;
  monthLabel: string;
  income: number;
  totalExpense: number;
  fixedExpense: number;
  consumptionExpense: number;
  regularSavings: number;
  welfareExpense: number;
  netAmount: number;
  actualSavings: number;
  savingsRate: number | null;
  cumulativeSavings: number;
  goalAmount: number;
  achievementRate: number | null;
};

// 리뷰 집계 단위: 세부항목("생활비 · 외식") / 큰 카테고리("생활비")
export type ReviewGroupMode = "detail" | "category";

export type MonthlyReviewEntry = {
  id: string;
  date: string;
  label: string;
  amount: number;
};

export type MonthlyReviewSurge = {
  category: string;
  currentAmount: number;
  averageAmount: number;
  increaseRatio: number;
  // 이번달 해당 카테고리 세부 내역 전체(금액 큰 순)
  entries: MonthlyReviewEntry[];
  // 비교용 직전 달 세부 내역 전체(금액 큰 순)
  prevEntries: MonthlyReviewEntry[];
};

export type MonthlyReviewDrop = {
  category: string;
  currentAmount: number;
  averageAmount: number;
  decreaseRatio: number;
  // 이번달 해당 카테고리 세부 내역 전체(금액 큰 순 — 0원이면 빈 배열)
  entries: MonthlyReviewEntry[];
  // 비교용 직전 달 세부 내역 전체(금액 큰 순)
  prevEntries: MonthlyReviewEntry[];
};

export type MonthlyReviewRepeat = {
  label: string;
  count: number;
  total: number;
};

export type MonthlyReview = {
  surges: MonthlyReviewSurge[];
  drops: MonthlyReviewDrop[];
  repeats: MonthlyReviewRepeat[];
  // 비교에 사용된 직전 개월 수(0이면 아직 비교할 과거 데이터 없음)
  comparedMonthCount: number;
  // 직전 달 표기용 라벨 (예: "7월")
  prevMonthLabel: string;
};

type Props = {
  currentYear: number;
  currentMonthIndex: number;
  currentMonthKey: string;
  annualGoal: number;
  monthlyBudget: number;
  onChangeAnnualGoal?: (value: number) => boolean | Promise<boolean>;
  onChangeMonthlyBudget?: (
    value: number,
    monthKey: string,
  ) => boolean | Promise<boolean>;
  dashboardRows: DashboardRow[];
  monthlyReview: MonthlyReview;
  reviewGroupMode: ReviewGroupMode;
  onChangeReviewGroupMode: (mode: ReviewGroupMode) => void;
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

// 리뷰 세부 내역 그룹: 기본 10건 + "더보기"로 전체 펼침. 아코디언을 닫으면 초기화된다.
function ReviewEntriesList({
  label,
  entries,
  formatValue,
}: {
  label: string;
  entries: MonthlyReviewEntry[];
  formatValue: (value: number) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleEntries = showAll ? entries : entries.slice(0, 10);
  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <StReviewSubList>
      <StReviewSubGroup>
        <span>{label}</span>
        <em>
          {entries.length}건 ·{" "}
          {formatValue(entries.reduce((sum, entry) => sum + entry.amount, 0))}원
        </em>
      </StReviewSubGroup>
      {visibleEntries.map((entry) => (
        <li key={entry.id}>
          <StReviewSubLabel>{entry.label}</StReviewSubLabel>
          <StReviewSubAmount>{formatValue(entry.amount)}원</StReviewSubAmount>
        </li>
      ))}
      {hiddenCount > 0 ? (
        <StReviewMoreItem>
          <button type="button" onClick={() => setShowAll(true)}>
            더보기 ({hiddenCount}건)
          </button>
        </StReviewMoreItem>
      ) : null}
    </StReviewSubList>
  );
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

export default function AccountBookDashboardPanel({
  currentYear,
  currentMonthIndex,
  currentMonthKey,
  annualGoal,
  monthlyBudget,
  onChangeAnnualGoal,
  onChangeMonthlyBudget,
  dashboardRows,
  monthlyReview,
  reviewGroupMode,
  onChangeReviewGroupMode,
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
  // 리뷰 카드 아코디언: "surge:카테고리" / "drop:카테고리" 형식의 키 하나만 펼침
  const [expandedReviewKey, setExpandedReviewKey] = useState<string | null>(
    null,
  );
  const displayNum = (value: number) =>
    isAmountHidden ? "•••••" : formatNumber(value);

  const currentMonthRow =
    dashboardRows.find((row) => row.monthNumber === currentMonthIndex + 1) ||
    dashboardRows[0];

  // 이번달 + 직전 달 내역 렌더 — 직전 달이 있으면 좌우 2단(좁으면 자동 세로 스택)
  const renderReviewSubList = (
    entries: MonthlyReviewEntry[],
    prevEntries: MonthlyReviewEntry[],
  ) =>
    prevEntries.length > 0 ? (
      <StReviewSubColumns>
        <ReviewEntriesList
          label={`지난달 · ${monthlyReview.prevMonthLabel}`}
          entries={prevEntries}
          formatValue={displayNum}
        />
        {entries.length > 0 ? (
          <ReviewEntriesList
            label="이번달"
            entries={entries}
            formatValue={displayNum}
          />
        ) : null}
      </StReviewSubColumns>
    ) : (
      <ReviewEntriesList
        label="이번달"
        entries={entries}
        formatValue={displayNum}
      />
    );

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
  // 수입 카드 하단 비율 팁: 수입 대비 실제 쓴 돈(고정비+소비, 저축 제외)/실제 저축.
  // 총지출에는 저축이 포함돼 있어 그대로 쓰면 저축이 이중으로 잡힌다.
  const monthTotalExpense =
    (currentMonthRow?.fixedExpense || 0) +
    (currentMonthRow?.consumptionExpense || 0);
  const monthActualSavings = currentMonthRow?.actualSavings || 0;
  // 복지카드 사용액: 총지출/예산엔 안 잡히는 별도 집계(0보다 클 때만 노출)
  const monthWelfareExpense = currentMonthRow?.welfareExpense || 0;
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
  // 목표(계획) 배분 비율: 목표 지출 = 고정비 + 월 예산, 목표 저축 = 월 저축 목표
  const hasPlanRatio = monthlyBudget > 0 || monthlySavingGoal > 0;
  const planExpense = monthFixedExpense + monthlyBudget;
  const planExpensePct =
    monthIncome > 0 ? Math.round((planExpense / monthIncome) * 100) : 0;
  const planSavingsPct =
    monthIncome > 0 ? Math.round((monthlySavingGoal / monthIncome) * 100) : 0;
  const planLeftoverPct = 100 - planExpensePct - planSavingsPct;
  // "계획 여유 → 실제 여유" 흐름: 초과분이 어디로 갔는지 %p로 설명해
  // 큰 달성률(예산의 140% 등)이 과장돼 보이지 않게 맥락을 붙인다
  const extraExpensePct = incomeExpensePct - planExpensePct;
  const extraSavingsPct = incomeSavingsPct - planSavingsPct;
  const leftoverFlowParts = [
    extraSavingsPct !== 0
      ? `저축에 ${extraSavingsPct > 0 ? "+" : "−"}${Math.abs(extraSavingsPct)}%p`
      : null,
    extraExpensePct !== 0
      ? `지출에 ${extraExpensePct > 0 ? "+" : "−"}${Math.abs(extraExpensePct)}%p`
      : null,
  ].filter(Boolean);
  // 계획 배분 바: 실제 배분 바와 같은 수입 100% 스케일로 나란히 비교
  const planExpenseWidth = Math.min(planExpensePct, 100);
  const planSavingsWidth = Math.min(
    planSavingsPct,
    Math.max(100 - planExpenseWidth, 0),
  );

  const hasSavingsGoal = monthlySavingGoal > 0;
  const savingsUsed = currentMonthRow?.actualSavings || 0;
  const savingsPercent = hasSavingsGoal
    ? Math.round((savingsUsed / monthlySavingGoal) * 100)
    : 0;
  const savingsProgress = hasSavingsGoal
    ? Math.min(Math.max((savingsUsed / monthlySavingGoal) * 100, 0), 100)
    : 0;
  const isSavingsGoalMet = hasSavingsGoal && savingsUsed >= monthlySavingGoal;

  // 차트의 지출 막대는 저축(정기 저축)을 뺀 실제 쓴 돈 기준 — 저축은 별도 막대로 분리
  const chartSpentOf = (row: DashboardRow) =>
    row.fixedExpense + row.consumptionExpense;
  const chartMax = Math.max(
    1,
    ...dashboardRows.map((row) =>
      Math.max(row.income, chartSpentOf(row), row.regularSavings),
    ),
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
            <em>이번달 들어온 금액</em>
          </StSummaryCard>
          {/* 수입이 없는 달에도 같은 높이로 렌더해 월 이동 시 카드 높이가 튀지 않게 한다 */}
          <StRatioWrap title="이번달 수입 대비 실제 지출(저축 제외)·실제 저축 비율입니다">
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
                    실제 지출 {incomeExpensePct}% · 저축 {incomeSavingsPct}%
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
                <span>이번달 수입이 아직 없어요</span>
              )}
            </StGoalMeta>
          </StRatioWrap>
          {hasPlanRatio ? (
            <StRatioWrap title="월 예산(고정비 포함)·저축 목표 기준 계획 배분입니다 — 위의 실제 배분과 같은 수입 100% 스케일입니다">
              <StPlanBar>
                {monthIncome > 0 ? (
                  <>
                    <StRatioSegment
                      $kind="expense"
                      style={{ width: `${planExpenseWidth}%` }}
                    />
                    <StRatioSegment
                      $kind="savings"
                      style={{ width: `${planSavingsWidth}%` }}
                    />
                  </>
                ) : null}
              </StPlanBar>
              <StGoalMeta>
                {monthIncome > 0 ? (
                  <>
                    <span>
                      계획 지출 {planExpensePct}% · 저축 {planSavingsPct}%
                    </span>
                    {planLeftoverPct >= 0 ? (
                      <strong>여유 {planLeftoverPct}%</strong>
                    ) : (
                      <strong className="over">
                        계획이 수입 {Math.abs(planLeftoverPct)}% 초과
                      </strong>
                    )}
                  </>
                ) : (
                  <span>이번달 수입이 아직 없어요</span>
                )}
              </StGoalMeta>
            </StRatioWrap>
          ) : null}
          {monthIncome > 0 &&
          hasPlanRatio &&
          leftoverFlowParts.length > 0 ? (
            <StLeftoverFlow>
              계획 여유 {planLeftoverPct}% → 실제 {incomeLeftoverPct}% (
              {leftoverFlowParts.join(" · ")})
            </StLeftoverFlow>
          ) : null}
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
                label={`${Number(currentMonthKey.slice(5, 7))}월 예산`}
                placeholder="월 예산 금액"
                hint={budgetHint}
                onSave={(value) => {
                  void onChangeMonthlyBudget?.(value, currentMonthKey);
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
                      {formatNumber(budgetUsed - monthlyBudget)}원 초과 (예산의{" "}
                      {budgetPercent}%)
                    </strong>
                  ) : (
                    <strong>
                      {formatNumber(monthlyBudget - budgetUsed)}원 남음 (예산의{" "}
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
            {monthWelfareExpense > 0 ? (
              <StWelfareNote title="복지카드 지출은 총지출·예산·집계에서 제외됩니다">
                복지카드 사용 {displayNum(monthWelfareExpense)}원
              </StWelfareNote>
            ) : null}
          </StSummaryCell>
          <StSummaryCell>
            <StSummaryCard type="button" onClick={onOpenAssetYearly}>
              <span>저축</span>
              <strong>{displayNum(currentMonthRow?.actualSavings || 0)}</strong>
              <em>
                실제 저축 · 연간 목표의 {formatPercent(annualAchievementRate)}{" "}
                달성
              </em>
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
                      달성 (목표의 {savingsPercent}%)
                    </strong>
                  ) : (
                    <strong>
                      {formatNumber(monthlySavingGoal - savingsUsed)}원 남음
                      (목표의 {savingsPercent}%)
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
        <StReviewHead>
          <StPanelTitle>
            {Number(currentMonthKey.slice(5, 7))}월 리뷰
          </StPanelTitle>
          <StReviewCaption>
            {monthlyReview.comparedMonthCount > 0
              ? `지난달(${monthlyReview.prevMonthLabel})과 비교했어요`
              : "지난달 내역이 쌓이면 비교해드려요"}
          </StReviewCaption>
          <StReviewModeToggle role="group" aria-label="리뷰 집계 단위">
            <button
              type="button"
              aria-pressed={reviewGroupMode === "category"}
              onClick={() => onChangeReviewGroupMode("category")}
            >
              카테고리
            </button>
            <button
              type="button"
              aria-pressed={reviewGroupMode === "detail"}
              onClick={() => onChangeReviewGroupMode("detail")}
            >
              세부항목
            </button>
          </StReviewModeToggle>
        </StReviewHead>
        <StReviewGrid>
          <StReviewCard>
            <StReviewCardTitle>지난달보다 늘어난 지출</StReviewCardTitle>
            {monthlyReview.surges.length > 0 ? (
              <StReviewList>
                {monthlyReview.surges.map((surge) => {
                  const reviewKey = `surge:${surge.category}`;
                  const isExpanded = expandedReviewKey === reviewKey;
                  const increasedAmount =
                    surge.currentAmount - surge.averageAmount;
                  return (
                    <StReviewRow key={`surge-${surge.category}`}>
                      <StReviewRowButton
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedReviewKey((current) =>
                            current === reviewKey ? null : reviewKey,
                          )
                        }
                      >
                        <StReviewRowText>
                          <strong>{surge.category}</strong>
                          <StReviewRowMeta>
                            지난달 {displayNum(surge.averageAmount)}원 → 이번달 {displayNum(surge.currentAmount)}원
                          </StReviewRowMeta>
                        </StReviewRowText>
                        <StReviewRowSide>
                          <StReviewBadge>
                            +{displayNum(increasedAmount)}원
                          </StReviewBadge>
                          <StReviewCaret $expanded={isExpanded}>
                            <ExpandMoreRoundedIcon fontSize="inherit" />
                          </StReviewCaret>
                        </StReviewRowSide>
                      </StReviewRowButton>
                      {isExpanded
                        ? renderReviewSubList(surge.entries, surge.prevEntries)
                        : null}
                    </StReviewRow>
                  );
                })}
              </StReviewList>
            ) : (
              <StReviewEmpty>
                {monthlyReview.comparedMonthCount > 0
                  ? "지난달보다 크게 늘어난 카테고리가 없어요 👍"
                  : "아직 비교할 지난달 데이터가 없어요"}
              </StReviewEmpty>
            )}
          </StReviewCard>
          <StReviewCard>
            <StReviewCardTitle>지난달보다 줄어든 지출</StReviewCardTitle>
            {monthlyReview.drops.length > 0 ? (
              <StReviewList>
                {monthlyReview.drops.map((drop) => {
                  const reviewKey = `drop:${drop.category}`;
                  const hasEntries =
                    drop.entries.length > 0 || drop.prevEntries.length > 0;
                  const isExpanded = hasEntries && expandedReviewKey === reviewKey;
                  const savedAmount = drop.averageAmount - drop.currentAmount;
                  const rowContent = (
                    <>
                      <StReviewRowText>
                        <strong>{drop.category}</strong>
                        <StReviewRowMeta>
                          지난달 {displayNum(drop.averageAmount)}원 → 이번달{" "}
                          {drop.currentAmount > 0
                            ? `${displayNum(drop.currentAmount)}원`
                            : "0원 🎉"}
                        </StReviewRowMeta>
                      </StReviewRowText>
                      <StReviewRowSide>
                        <StReviewBadgeGood>
                          {displayNum(savedAmount)}원 아낌
                        </StReviewBadgeGood>
                        {hasEntries ? (
                          <StReviewCaret $expanded={isExpanded}>
                            <ExpandMoreRoundedIcon fontSize="inherit" />
                          </StReviewCaret>
                        ) : null}
                      </StReviewRowSide>
                    </>
                  );
                  return (
                    <StReviewRow key={`drop-${drop.category}`}>
                      {hasEntries ? (
                        <StReviewRowButton
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedReviewKey((current) =>
                              current === reviewKey ? null : reviewKey,
                            )
                          }
                        >
                          {rowContent}
                        </StReviewRowButton>
                      ) : (
                        <StReviewRowPlain>{rowContent}</StReviewRowPlain>
                      )}
                      {isExpanded
                        ? renderReviewSubList(drop.entries, drop.prevEntries)
                        : null}
                    </StReviewRow>
                  );
                })}
              </StReviewList>
            ) : (
              <StReviewEmpty>
                {monthlyReview.comparedMonthCount > 0
                  ? "지난달보다 크게 줄어든 카테고리가 아직 없어요"
                  : "아직 비교할 지난달 데이터가 없어요"}
              </StReviewEmpty>
            )}
          </StReviewCard>
          <StReviewCard>
            <StReviewCardTitle>자주 반복된 지출</StReviewCardTitle>
            {monthlyReview.repeats.length > 0 ? (
              <StReviewList>
                {monthlyReview.repeats.map((repeat) => (
                  <StReviewRow key={`repeat-${repeat.label}`}>
                    <StReviewRowMain>
                      <strong>{repeat.label}</strong>
                      <StReviewCount>{repeat.count}회</StReviewCount>
                    </StReviewRowMain>
                    <StReviewRowMeta>
                      합계 {displayNum(repeat.total)}원
                    </StReviewRowMeta>
                  </StReviewRow>
                ))}
              </StReviewList>
            ) : (
              <StReviewEmpty>3회 이상 반복된 지출이 없어요</StReviewEmpty>
            )}
          </StReviewCard>
        </StReviewGrid>
      </StPanel>

      <StPanel>
        <StChartHead>
          <StPanelTitle>월별 수입 · 지출 · 저축</StPanelTitle>
          <StChartLegend>
            <span className="income">수입</span>
            <span className="expense">지출</span>
            <span className="savings">저축</span>
          </StChartLegend>
        </StChartHead>
        {hasChartData ? (
          <StChart>
            {dashboardRows.map((row) => {
              const spent = chartSpentOf(row);
              const incomeHeight =
                row.income > 0
                  ? Math.max((row.income / chartMax) * 100, 3)
                  : 0;
              const expenseHeight =
                spent > 0 ? Math.max((spent / chartMax) * 100, 3) : 0;
              const savingsHeight =
                row.regularSavings > 0
                  ? Math.max((row.regularSavings / chartMax) * 100, 3)
                  : 0;
              return (
                <StChartCol
                  key={`chart-${row.monthNumber}`}
                  type="button"
                  $active={currentMonthIndex + 1 === row.monthNumber}
                  onClick={() => onSelectMonth(row.monthNumber)}
                  title={`${row.monthLabel} · 수입 ${displayNum(
                    row.income,
                  )} · 지출 ${displayNum(spent)} · 저축 ${displayNum(
                    row.regularSavings,
                  )}`}
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
                    <StChartBar
                      className="savings"
                      style={{ height: `${savingsHeight}%` }}
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
  /* 수입 칸 = (전체 − 갭 2개)/3 → 오른쪽이 지출·저축으로 갈라져도 세 칸이 정확히 동일 폭 */
  grid-template-columns: calc((100% - 1.5rem) / 3) minmax(0, 1fr);
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

// 셀 자체를 하나의 카드로 만들어 숫자·진행바·메타를 한 박스 안에 묶는다.
// (기존엔 테두리가 안쪽 숫자 버튼에만 있고 바는 박스 밖에 떠 있어 어색했음)
const StSummaryCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 16px;
  border: 1px solid #eaebec;
  background: #fdfdfd;
  padding: 0.8rem 0.75rem;
`;

// '예산 바→수정' 버튼. 숫자 버튼과 동일한 hover 하이라이트로 클릭 영역을 명확히 한다.
const StGoalButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  /* 음수 마진만큼 너비를 보정해 안쪽 바(0.15rem 인셋)가 수입 카드 비율 바와 좌우 정렬되게 */
  width: calc(100% + 0.6rem);
  border: none;
  background: transparent;
  padding: 0.3rem 0.45rem;
  margin: 0 -0.3rem;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.16s ease;

  &:hover {
    background: #f3f4f6;
  }

  &:focus-visible {
    outline: 2px solid rgba(154, 157, 163, 0.34);
    outline-offset: -2px;
  }
`;

// 지출/저축 카드의 클릭 버튼(StGoalButton, 상하 0.3rem 패딩)과 세로 간격을 맞춘다
const StRatioWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  width: 100%;
  padding: 0.3rem 0.15rem;

  /* 연달아 오는 목표 비율 줄은 실제 비율 줄에 바짝 붙여 한 묶음으로 읽히게 */
  & + & {
    margin-top: -0.55rem;
    padding-top: 0;
  }
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

// 계획 배분 바 — 실제 바와 같은 색이지만 연하게, "계획"임을 구분
const StPlanBar = styled(StGoalBar)`
  & > div {
    opacity: 0.4;
  }
`;

// 계획 여유가 실제로 어디에 쓰였는지 잇는 설명 줄 — 비율 줄 묶음에 바짝 붙인다
const StLeftoverFlow = styled.p`
  margin-top: -0.55rem;
  padding: 0 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #9aa0a8;
  font-variant-numeric: tabular-nums;
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

const StWelfareNote = styled.span`
  align-self: flex-start;
  margin-top: -0.4rem;
  padding: 0.12rem 0.15rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #9aa0a8;
  font-variant-numeric: tabular-nums;
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

// 카드 안의 '숫자→연간 상세' 버튼. 클릭 영역이 명확하도록 hover 시 은은한 배경 하이라이트.
// (음수 마진으로 하이라이트만 바깥으로 넓히고, 텍스트는 바와 좌우 정렬을 유지)
const StSummaryCard = styled.button`
  /* StGoalButton과 동일한 보정 — 호버 하이라이트가 좌우 대칭이 되게 */
  width: calc(100% + 0.6rem);
  display: block;
  text-align: left;
  border: none;
  background: transparent;
  padding: 0.35rem 0.45rem;
  margin: -0.35rem -0.3rem 0;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.16s ease;

  &:hover {
    background: #f3f4f6;
  }

  &:focus-visible {
    outline: 2px solid rgba(154, 157, 163, 0.34);
    outline-offset: -2px;
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
  gap: 0.55rem;
  /* 섹션 타이틀이 이전 박스와 확실히 구분되도록 위 여백을 넓게 */
  margin-top: 0.9rem;
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

const StReviewHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StReviewCaption = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: #9aa0a8;
`;

// 리뷰 집계 단위 토글(세부항목/카테고리) — 헤더 오른쪽 끝의 세그먼트 버튼
const StReviewModeToggle = styled.div`
  margin-left: auto;
  display: inline-flex;
  border: 1px solid #e2e3e4;
  border-radius: 999px;
  padding: 0.12rem;
  background: #ffffff;

  button {
    border: none;
    background: transparent;
    border-radius: 999px;
    padding: 0.22rem 0.6rem;
    font-size: 0.72rem;
    font-weight: 800;
    color: #8a8e95;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  button[aria-pressed="true"] {
    background: #f0f3f7;
    color: #33363c;
  }
`;

const StReviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StReviewCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border: 1px solid #eaebec;
  border-radius: 16px;
  background: #fdfdfd;
  padding: 0.8rem 0.85rem;
`;

const StReviewCardTitle = styled.h5`
  font-size: 0.78rem;
  font-weight: 900;
  color: #70747c;
`;

const StReviewList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const StReviewRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid #f4f4f6;

  &:first-child {
    padding-top: 0.1rem;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 0.1rem;
  }
`;

// 급증/감소 카테고리 행 전체를 눌러 세부 내역을 펼치는 버튼.
// 좌측(제목+메타) 높이에 맞춰 우측(배지+화살표)을 세로 센터 정렬한다.
const StReviewRowButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.1rem 0.3rem;
  margin: 0 -0.3rem;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: #f3f4f6;
  }

  &:focus-visible {
    outline: 2px solid rgba(154, 157, 163, 0.34);
    outline-offset: -2px;
  }
`;

// 펼칠 내역이 없는 행의 정적 래퍼 — 버튼 행과 동일한 2컬럼 센터 정렬
const StReviewRowPlain = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.1rem 0;
`;

// 행 좌측: 카테고리 제목 + 지난달→이번달 메타를 세로로 쌓는다
const StReviewRowText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    color: #33363c;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StReviewRowSide = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`;

const StReviewCaret = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
  color: #9aa0a8;
  transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
  transition: transform 0.15s ease;
`;

// 이번달/지난달 2단 배치 — 컬럼이 좁으면 자동으로 한 단 스택으로 떨어진다
const StReviewSubColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.5rem;
  align-items: start;
  margin-top: 0.35rem;

  & > ul {
    margin-top: 0;
  }
`;

const StReviewSubList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin-top: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 10px;
  background: #f6f7f9;

  li {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid #ecedf0;
  }

  li:last-child {
    border-bottom: none;
  }
`;

// 세부 내역의 월 구분 라벨("이번달" / "지난달 · 7월") + 건수·합계
const StReviewSubGroup = styled.li`
  && {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.42rem 0 0.12rem;
    border-bottom: none;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: #9aa0a8;
  }

  em {
    font-style: normal;
    font-weight: 800;
    color: #8a8e95;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
`;

// "더보기 (N건)" 행 — 리스트 li 기본 스타일(구분선·flex)을 덮어쓴다
const StReviewMoreItem = styled.li`
  && {
    display: block;
    padding: 0.15rem 0 0.3rem;
    border-bottom: none;
  }

  button {
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.25rem 0;
    font-size: 0.72rem;
    font-weight: 800;
    color: #8a8e95;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
      background: #eceef1;
      color: #3182f6;
    }
  }
`;

const StReviewSubLabel = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4c5058;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StReviewSubAmount = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 800;
  color: #33363c;
  font-variant-numeric: tabular-nums;
`;

const StReviewRowMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    color: #33363c;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StReviewBadge = styled.span`
  flex-shrink: 0;
  border-radius: 999px;
  background: #fdecef;
  color: #e11d48;
  padding: 0.1rem 0.48rem;
  font-size: 0.7rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
`;

const StReviewBadgeGood = styled.span`
  flex-shrink: 0;
  border-radius: 999px;
  background: #e6f6f3;
  color: #0d9488;
  padding: 0.1rem 0.48rem;
  font-size: 0.7rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
`;

const StReviewCount = styled.span`
  flex-shrink: 0;
  border-radius: 999px;
  background: #eef2f6;
  color: #5c626b;
  padding: 0.1rem 0.48rem;
  font-size: 0.7rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
`;

const StReviewRowMeta = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: #8a8e95;
  font-variant-numeric: tabular-nums;
`;

const StReviewEmpty = styled.p`
  font-size: 0.76rem;
  font-weight: 700;
  color: #9aa0a8;
  padding: 0.35rem 0 0.2rem;
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

  span.savings::before {
    background: #14b8a6;
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
  width: 28%;
  max-width: 12px;
  border-radius: 4px 4px 0 0;
  transition: height 0.2s ease;

  &.income {
    background: #3182f6;
  }

  &.expense {
    background: #f04452;
  }

  &.savings {
    background: #14b8a6;
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

