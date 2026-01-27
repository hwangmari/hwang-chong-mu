import { format } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";

export const buildScheduleText = (
  schedules: ServiceSchedule[],
  hiddenIds: Set<string>, // 숨겨진 일정 제외하고 복사
  currentYear: number,
): string => {
  let text = "";

  schedules.forEach((svc) => {
    // 숨겨진 일정은 복사에서 제외 (원하시면 주석 처리)
    if (hiddenIds.has(svc.id)) return;

    text += `[${svc.serviceName}]\n`;
    svc.tasks.forEach((t) => {
      const sYear = t.startDate.getFullYear();
      const eYear = t.endDate.getFullYear();

      const startStr =
        sYear === currentYear
          ? format(t.startDate, "MM.dd")
          : format(t.startDate, "yyyy.MM.dd");

      let dateStr = "";
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
        text += ` (${t.memo})`;
      }
      text += "\n";
    });
    text += "\n";
  });

  return text;
};
