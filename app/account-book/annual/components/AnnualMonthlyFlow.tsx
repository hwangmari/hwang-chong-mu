import {
  StCard,
  StSectionHeader,
  StSectionTitle,
  StSectionHeaderActions,
  StFilterChip,
  StFilterChipPlaceholder,
  StEmpty,
  StMonthChart,
  StMonthChartCol,
  StMonthChartTrack,
  StMonthChartBar,
  StMonthChartLabel,
  StMonthlyList,
  StMonthLine,
} from "../page.styles";

type MonthlyFlowRow = {
  month: string;
  amount: number;
  count: number;
};

type AnnualMonthlyFlowProps = {
  selectedCategory: string | null;
  selectedMonth: string | null;
  monthlyRows: MonthlyFlowRow[];
  maxMonthlyAmount: number;
  maskAmount: (value: number) => string;
  onClearCategory: () => void;
  onClearMonth: () => void;
  onToggleMonth: (month: string) => void;
};

export default function AnnualMonthlyFlow({
  selectedCategory,
  selectedMonth,
  monthlyRows,
  maxMonthlyAmount,
  maskAmount,
  onClearCategory,
  onClearMonth,
  onToggleMonth,
}: AnnualMonthlyFlowProps) {
  return (
    <StCard>
      <StSectionHeader>
        <StSectionTitle>
          월별 흐름{selectedCategory ? ` · ${selectedCategory}` : ""}
        </StSectionTitle>
        <StSectionHeaderActions>
          {selectedCategory ? (
            <StFilterChip type="button" onClick={onClearCategory}>
              {selectedCategory} 필터 해제
            </StFilterChip>
          ) : null}
          {selectedMonth ? (
            <StFilterChip type="button" onClick={onClearMonth}>
              {selectedMonth} 필터 해제
            </StFilterChip>
          ) : null}
          {!selectedCategory && !selectedMonth ? (
            <StFilterChipPlaceholder aria-hidden="true" />
          ) : null}
        </StSectionHeaderActions>
      </StSectionHeader>
      {monthlyRows.every((row) => row.amount === 0) ? (
        <StEmpty>해당 연도 내역이 없습니다.</StEmpty>
      ) : (
        <>
          <StMonthChart>
            {monthlyRows.map((row) => {
              const isActive = selectedMonth === row.month;
              const height =
                row.amount > 0 && maxMonthlyAmount > 0
                  ? Math.max((row.amount / maxMonthlyAmount) * 96, 6)
                  : 2;
              return (
                <StMonthChartCol
                  key={`chart-${row.month}`}
                  type="button"
                  $active={isActive}
                  onClick={() => onToggleMonth(row.month)}
                  title={`${row.month} ${maskAmount(row.amount)}`}
                >
                  <StMonthChartTrack>
                    <StMonthChartBar
                      style={{ height: `${height}px` }}
                      $active={isActive}
                      $empty={row.amount === 0}
                    />
                  </StMonthChartTrack>
                  <StMonthChartLabel $active={isActive}>
                    {row.month.replace("월", "")}
                  </StMonthChartLabel>
                </StMonthChartCol>
              );
            })}
          </StMonthChart>
          <StMonthlyList>
            {monthlyRows.map((row) => {
              const isActive = selectedMonth === row.month;
              const ratio =
                row.amount > 0 && maxMonthlyAmount > 0
                  ? (row.amount / maxMonthlyAmount) * 100
                  : 0;

              return (
                <StMonthLine
                  key={row.month}
                  type="button"
                  $active={isActive}
                  onClick={() => onToggleMonth(row.month)}
                >
                  <strong>{row.month}</strong>
                  <span>{row.count}건</span>
                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${Math.max(ratio, row.amount > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <em>{maskAmount(row.amount)}</em>
                </StMonthLine>
              );
            })}
          </StMonthlyList>
        </>
      )}
    </StCard>
  );
}
