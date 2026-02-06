import { format } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";

export const buildScheduleText = (
  schedules: ServiceSchedule[],
  hiddenIds: Set<string>,
  currentYear: number,
): string => {
  let text = "";

  const sortedSchedules = schedules
    .filter((svc) => !hiddenIds.has(svc.id) && !svc.isCompleted)
    .map((svc) => ({
      ...svc,
      tasks: [...svc.tasks].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      ),
    }))
    .sort((a, b) => {
      const startA = a.tasks[0]?.startDate.getTime() || Infinity;
      const startB = b.tasks[0]?.startDate.getTime() || Infinity;
      return startA - startB;
    });

  sortedSchedules.forEach((svc) => {
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
    text += "\n";
  });

  return text;
};
