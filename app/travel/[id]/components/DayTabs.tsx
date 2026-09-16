"use client";

import { dayCountLabel, dayLabel } from "../../lib/plan";
import type { TravelDay } from "../../types";
import {
  StDayCount,
  StDayTab,
  StDayTabDate,
  StDayTabs,
  StDayTabTop,
} from "../page.styles";

// 날짜 탭. 상자가 아니라 글자 + 파란 밑줄이 옆으로 미끄러지는 방식(장부 화면과 같은 모양).
// 날짜가 많으면 탭 줄만 옆으로 밀리고 화면 전체는 가로로 밀리지 않는다. (2026-09-16)

type DayTabsProps = {
  days: TravelDay[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function DayTabs({ days, activeIndex, onSelect }: DayTabsProps) {
  return (
    <StDayTabs role="tablist" aria-label="날짜 고르기">
      {days.map((day, index) => {
        const active = index === activeIndex;
        // 숙소는 "들르는 곳"이 아니라 그 날의 기준점이라 개수에서 뺀다
        const count = day.places.filter((place) => !place.isStay).length;
        return (
          <StDayTab
            key={day.date}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onSelect(index)}
          >
            <StDayTabTop $active={active}>
              DAY {String(index + 1).padStart(2, "0")}
              <StDayCount>{dayCountLabel(count)}</StDayCount>
            </StDayTabTop>
            <StDayTabDate>{dayLabel(day.date)}</StDayTabDate>
          </StDayTab>
        );
      })}
    </StDayTabs>
  );
}
