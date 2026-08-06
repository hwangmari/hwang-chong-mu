import {
  StHeader,
  StHeaderLeft,
  StHeaderCenter,
  StAmountToggle,
  StYearNav,
  StEyebrow,
  StBackButton,
} from "../page.styles";

type AnnualHeaderProps = {
  selectedYear: number;
  kindLabel: string;
  isAmountHidden: boolean;
  onBack: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onToggleAmount: () => void;
};

export default function AnnualHeader({
  selectedYear,
  kindLabel,
  isAmountHidden,
  onBack,
  onPrevYear,
  onNextYear,
  onToggleAmount,
}: AnnualHeaderProps) {
  return (
    <StHeader>
      <StHeaderLeft>
        <StBackButton type="button" aria-label="뒤로 가기" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14.71 6.71-1.42-1.42L6.59 12l6.7 6.71 1.42-1.42L9.41 12z" />
          </svg>
        </StBackButton>
      </StHeaderLeft>
      <StHeaderCenter>
        <StYearNav>
          <button type="button" aria-label="이전 연도" onClick={onPrevYear}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <StEyebrow>{selectedYear}년 {kindLabel} 연간 상세</StEyebrow>
          <button type="button" aria-label="다음 연도" onClick={onNextYear}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </StYearNav>
      </StHeaderCenter>
      <StAmountToggle
        type="button"
        onClick={onToggleAmount}
        aria-pressed={!isAmountHidden}
      >
        {isAmountHidden ? "금액 보기" : "금액 숨기기"}
      </StAmountToggle>
    </StHeader>
  );
}
