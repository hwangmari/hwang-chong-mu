import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
  isWithinInterval,
  format,
} from "date-fns";
import { SchedulePhase } from "@/types/work-schedule";

export interface CalendarTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  phaseId: string;
  phaseName: string;
  color: string;
  isCompleted: boolean;
  memberName?: string;
}
export function useCalendarLayout(
  phases: SchedulePhase[],
  daysToShow: Date[],
  cols: number,
) {
  return useMemo(() => {
    const map = new Map<string, number>();
    const maxSlots = new Map<string, number>();

    const allTasks: CalendarTask[] = phases.flatMap((phase) =>
      phase.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        phaseId: phase.id,
        phaseName: phase.phaseName,
        color: phase.color,
        isCompleted: t.isCompleted || false,
        memberName: phase.memberName,
      })),
    );

    for (let i = 0; i < daysToShow.length; i += cols) {
      const rowDays = daysToShow.slice(i, i + cols);
      if (rowDays.length === 0) continue;

      const rowStart = startOfDay(rowDays[0]);
      const rowEnd = endOfDay(rowDays[rowDays.length - 1]);

      const tasksInRow = allTasks.filter((t) => {
        const isOverlapping = areIntervalsOverlapping(
          { start: startOfDay(t.startDate), end: endOfDay(t.endDate) },
          { start: rowStart, end: rowEnd },
        );
        return isOverlapping && !t.isCompleted;
      });

      tasksInRow.sort((a, b) => {
        if (a.phaseId !== b.phaseId) return a.phaseId.localeCompare(b.phaseId);
        return a.startDate.getTime() - b.startDate.getTime();
      });

      const slots: boolean[][] = [];
      tasksInRow.forEach((task) => {
        const activeIndices = rowDays
          .map((day, idx) =>
            isWithinInterval(day, {
              start: startOfDay(task.startDate),
              end: endOfDay(task.endDate),
            })
              ? idx
              : -1,
          )
          .filter((idx) => idx !== -1);

        if (activeIndices.length === 0) return;

        let slotIndex = 0;
        while (true) {
          if (!slots[slotIndex]) slots[slotIndex] = [];
          const isClear = activeIndices.every((idx) => !slots[slotIndex][idx]);
          if (isClear) {
            activeIndices.forEach((idx) => {
              slots[slotIndex][idx] = true;
              const dateKey = format(rowDays[idx], "yyyy-MM-dd");
              map.set(`${dateKey}_${task.id}`, slotIndex);
              const currentMax = maxSlots.get(dateKey) || 0;
              maxSlots.set(dateKey, Math.max(currentMax, slotIndex));
            });
            break;
          }
          slotIndex++;
        }
      });
    }
    return { slotMap: map, maxSlotsPerDay: maxSlots, allTasks };
  }, [phases, daysToShow, cols]);
}
