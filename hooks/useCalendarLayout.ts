import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
  isWithinInterval,
  format,
} from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";

// 훅에서 사용할 평탄화된 태스크 타입
export interface CalendarTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  svcId: string;
  svcName: string;
  color: string;
}

export function useCalendarLayout(
  schedules: ServiceSchedule[],
  daysToShow: Date[],
  cols: number,
) {
  return useMemo(() => {
    const map = new Map<string, number>();
    const maxSlots = new Map<string, number>();

    // 1. 모든 스케줄을 하나의 배열로 평탄화(Flatten)
    const allTasks: CalendarTask[] = schedules.flatMap((svc) =>
      svc.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        svcId: svc.id,
        svcName: svc.serviceName,
        color: svc.color,
      })),
    );

    // 2. 주 단위(Row)로 끊어서 슬롯 계산
    for (let i = 0; i < daysToShow.length; i += cols) {
      const rowDays = daysToShow.slice(i, i + cols);
      if (rowDays.length === 0) continue;

      const rowStart = startOfDay(rowDays[0]);
      const rowEnd = endOfDay(rowDays[rowDays.length - 1]);

      // 해당 주(Row)에 걸치는 태스크 필터링
      const tasksInRow = allTasks.filter((t) =>
        areIntervalsOverlapping(
          { start: startOfDay(t.startDate), end: endOfDay(t.endDate) },
          { start: rowStart, end: rowEnd },
        ),
      );

      // 정렬: 같은 프로젝트끼리 뭉치게(svcId) -> 시작일 순
      tasksInRow.sort((a, b) => {
        if (a.svcId !== b.svcId) {
          return a.svcId.localeCompare(b.svcId);
        }
        return a.startDate.getTime() - b.startDate.getTime();
      });

      // 슬롯 할당 알고리즘
      const slots: boolean[][] = [];

      tasksInRow.forEach((task) => {
        // 이 태스크가 차지하는 요일 인덱스들 (0~6)
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
          // 해당 슬롯(층)이 비어있는지 확인
          const isClear = activeIndices.every((idx) => !slots[slotIndex][idx]);
          if (isClear) {
            // 할당
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
