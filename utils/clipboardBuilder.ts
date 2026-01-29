import { format } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";

export const buildScheduleText = (
  schedules: ServiceSchedule[],
  hiddenIds: Set<string>, // 숨겨진 일정 제외하고 복사
  currentYear: number,
): string => {
  let text = "";

  // 1. 데이터 정렬 및 필터링 (원본 배열 보호를 위해 복사 후 처리)
  const sortedSchedules = schedules
    .filter((svc) => !hiddenIds.has(svc.id)) // 숨김 처리
    .map((svc) => ({
      ...svc,
      // 서비스 내부의 Tasks를 시작 날짜 오름차순 정렬
      tasks: [...svc.tasks].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      ),
    }))
    // (선택 사항) 서비스 덩어리 자체도 '가장 빠른 일정'이 있는 순서대로 정렬
    .sort((a, b) => {
      const startA = a.tasks[0]?.startDate.getTime() || Infinity;
      const startB = b.tasks[0]?.startDate.getTime() || Infinity;
      return startA - startB;
    });

  // 2. 텍스트 생성 (기존 포맷 유지)
  sortedSchedules.forEach((svc) => {
    // 태스크가 하나도 없으면 굳이 출력 안 함 (필요시 제거 가능)
    if (svc.tasks.length === 0) return;

    text += `[${svc.serviceName}]\n`;

    svc.tasks.forEach((t) => {
      const sYear = t.startDate.getFullYear();
      const eYear = t.endDate.getFullYear();

      const startStr =
        sYear === currentYear
          ? format(t.startDate, "MM.dd")
          : format(t.startDate, "yyyy.MM.dd");

      let dateStr = "";
      // 시작일과 종료일이 같으면 하루만 표시
      if (format(t.startDate, "yyyyMMdd") === format(t.endDate, "yyyyMMdd")) {
        dateStr = startStr;
      } else {
        let endStr = "";
        if (sYear === eYear) {
          endStr = format(t.endDate, "MM.dd");
        } else {
          endStr =
            eYear === currentYear
              ? format(t.endDate, "MM.dd")
              : format(t.endDate, "yyyy.MM.dd");
        }
        dateStr = `${startStr} ~ ${endStr}`;
      }

      text += `- ${t.title}: ${dateStr}`;
      if (t.memo && t.memo.trim() !== "") {
        text += `\n(${t.memo})`;
      }
      text += "\n";
    });
    text += "\n"; // 서비스 그룹 간 줄바꿈
  });

  return text;
};
