"use client";

import { THEME_COLOR } from "../helpers";
import {
  CurrentMonthButton,
  MonthNavBar as MonthNavBarRoot,
  MonthNavButton,
  MonthText,
} from "../page.styles";

interface MonthNavBarProps {
  monthLabel: string;
  isCurrentMonth: boolean;
  onShiftMonth: (offset: number) => void;
  onJumpToCurrentMonth: () => void;
}

export default function MonthNavBar({
  monthLabel,
  isCurrentMonth,
  onShiftMonth,
  onJumpToCurrentMonth,
}: MonthNavBarProps) {
  return (
    <MonthNavBarRoot>
      <MonthNavButton type="button" onClick={() => onShiftMonth(-1)}>
        이전 달
      </MonthNavButton>
      <MonthText>{monthLabel}</MonthText>
      <MonthNavButton type="button" onClick={() => onShiftMonth(1)}>
        다음 달
      </MonthNavButton>
      <CurrentMonthButton
        type="button"
        onClick={onJumpToCurrentMonth}
        disabled={isCurrentMonth}
        $color={THEME_COLOR}
      >
        이번 달
      </CurrentMonthButton>
    </MonthNavBarRoot>
  );
}
