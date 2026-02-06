import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
  isWithinInterval,
  format,
} from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";

export interface CalendarTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  svcId: string;
  svcName: string;
  color: string;
  isCompleted: boolean;
}
export function useCalendarLayout(
  schedules: ServiceSchedule[],
  daysToShow: Date[],
  cols: number,
) {
  return useMemo(() => {
    const map = new Map<string, number>();
    const maxSlots = new Map<string, number>();

    const allTasks: CalendarTask[] = schedules.flatMap((svc) =>
      svc.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        svcId: svc.id,
        svcName: svc.serviceName,
        color: svc.color,
        isCompleted: t.isCompleted || false,
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
        return isOverlapping && !t.isCompleted; // 완료된 태스크는 레이아웃 계산에서 제외
      });

      tasksInRow.sort((a, b) => {
        if (a.svcId !== b.svcId) return a.svcId.localeCompare(b.svcId);
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
  }, [schedules, daysToShow, cols]);
}
