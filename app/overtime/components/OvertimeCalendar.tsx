import { CalendarDay, DayBucket } from "@/app/overtime/types";
import {
  formatCompactDuration,
  formatMonthLabel,
} from "@/app/overtime/utils";
import {
  CalendarCellButton,
  CalendarDayNumber,
  CalendarDaySummary,
  CalendarGrid,
  CalendarMonthLabel,
  CalendarNavButton,
  CalendarPlaceholder,
  CalendarToolbar,
  CalendarToolbarMain,
  SectionHeader,
  SectionTitle,
  TodayButton,
  WeekdayCell,
  WeekdayRow,
  WeekendToggleButton,
} from "@/app/overtime/components/styles";

interface OvertimeCalendarProps {
  currentMonth: Date;
  visibleWeekdays: string[];
  calendarWeeks: Array<Array<CalendarDay | null>>;
  recordsByDate: Map<string, DayBucket>;
  showWeekends: boolean;
  selectedDate: string;
  onMoveMonth: (amount: number) => void;
  onGoToday: () => void;
  onToggleWeekends: () => void;
  onSelectDate: (dateKey: string) => void;
  onResetQuickAddForm: () => void;
}

export default function OvertimeCalendar({
  currentMonth,
  visibleWeekdays,
  calendarWeeks,
  recordsByDate,
  showWeekends,
  selectedDate,
  onMoveMonth,
  onGoToday,
  onToggleWeekends,
  onSelectDate,
  onResetQuickAddForm,
}: OvertimeCalendarProps) {
  return (
    <>
      <SectionHeader>
        <SectionTitle>야근 기록 캘린더</SectionTitle>
        <CalendarToolbar>
          <CalendarToolbarMain>
            <CalendarNavButton type="button" onClick={() => onMoveMonth(-1)}>
              이전
            </CalendarNavButton>
            <CalendarMonthLabel>
              {formatMonthLabel(currentMonth)}
            </CalendarMonthLabel>
            <CalendarNavButton type="button" onClick={() => onMoveMonth(1)}>
              다음
            </CalendarNavButton>
            <TodayButton type="button" onClick={onGoToday}>
              오늘
            </TodayButton>
          </CalendarToolbarMain>
          <WeekendToggleButton
            type="button"
            $isActive={showWeekends}
            onClick={onToggleWeekends}
          >
            주말 {showWeekends ? "ON" : "OFF"}
          </WeekendToggleButton>
        </CalendarToolbar>
      </SectionHeader>

      <WeekdayRow $columns={visibleWeekdays.length}>
        {visibleWeekdays.map((weekday) => (
          <WeekdayCell key={weekday}>{weekday}</WeekdayCell>
        ))}
      </WeekdayRow>

      <CalendarGrid $columns={visibleWeekdays.length}>
        {calendarWeeks.flatMap((week, weekIndex) =>
          week
            .filter(
              (_, weekdayIndex) =>
                showWeekends || (weekdayIndex !== 0 && weekdayIndex !== 6),
            )
            .map((day, dayIndex) => {
              if (!day) {
                return (
                  <CalendarPlaceholder key={`empty-${weekIndex}-${dayIndex}`} />
                );
              }

              const bucket = recordsByDate.get(day.dateKey);

              return (
                <CalendarCellButton
                  key={day.dateKey}
                  type="button"
                  $isCurrentMonth={true}
                  $isSelected={selectedDate === day.dateKey}
                  $isToday={day.isToday}
                  onClick={() => {
                    onSelectDate(day.dateKey);
                    onResetQuickAddForm();
                  }}
                >
                  <CalendarDayNumber>{day.dayNumber}</CalendarDayNumber>
                  {bucket && (
                    <CalendarDaySummary>
                      {bucket.before10Minutes > 0 && (
                        <span>
                          {formatCompactDuration(bucket.before10Minutes)}
                        </span>
                      )}
                      {bucket.after10Minutes > 0 && (
                        <span>
                          {formatCompactDuration(bucket.after10Minutes)}
                        </span>
                      )}
                    </CalendarDaySummary>
                  )}
                </CalendarCellButton>
              );
            }),
        )}
      </CalendarGrid>
    </>
  );
}
