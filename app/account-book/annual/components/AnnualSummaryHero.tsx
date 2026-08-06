import {
  StHeroCard,
  StSectionTitle,
  StTotal,
  StHeroDescription,
  StStatGrid,
  StStatCard,
} from "../page.styles";
import type { AnnualKind } from "../types";

type AnnualSummaryHeroProps = {
  kind: AnnualKind;
  kindLabel: string;
  total: number;
  selectedMonth: string | null;
  averageMonthlyAmount: number;
  topMonthRow: { month: string; amount: number } | null;
  activeMonthCount: number;
  latestEntryDate: string | null;
  maskAmount: (value: number) => string;
};

export default function AnnualSummaryHero({
  kind,
  kindLabel,
  total,
  selectedMonth,
  averageMonthlyAmount,
  topMonthRow,
  activeMonthCount,
  latestEntryDate,
  maskAmount,
}: AnnualSummaryHeroProps) {
  return (
    <StHeroCard>
      <div>
        <StSectionTitle>{kindLabel} 합계</StSectionTitle>
        <StTotal>{maskAmount(total)}</StTotal>
        <StHeroDescription>
          {kind === "asset"
            ? "연금 카테고리별 목표를 넣고 현재 누적 금액이 얼마나 찼는지 바로 확인할 수 있어요."
            : selectedMonth
            ? `${selectedMonth}만 보고 있어요. 다시 누르면 전체 연도로 돌아갑니다.`
            : "월별 흐름을 눌러 해당 월만 좁혀볼 수 있어요."}
        </StHeroDescription>
      </div>
      <StStatGrid>
        <StStatCard>
          <span>월평균</span>
          <strong>{maskAmount(Math.round(averageMonthlyAmount))}</strong>
        </StStatCard>
        <StStatCard>
          <span>가장 큰 달</span>
          <strong>
            {topMonthRow && topMonthRow.amount > 0
              ? `${topMonthRow.month} · ${maskAmount(topMonthRow.amount)}`
              : "-"}
          </strong>
        </StStatCard>
        <StStatCard>
          <span>기록된 월</span>
          <strong>{activeMonthCount}개월</strong>
        </StStatCard>
        <StStatCard>
          <span>최근 등록일</span>
          <strong>{latestEntryDate || "-"}</strong>
        </StStatCard>
      </StStatGrid>
    </StHeroCard>
  );
}
