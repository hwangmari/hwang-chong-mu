import { format } from "date-fns";
import { SchedulePhase } from "@/types/work-schedule";

export const buildScheduleText = (
  phases: SchedulePhase[],
  hiddenIds: Set<string>,
  currentYear: number,
): string => {
  let text = "";

  const sortedPhases = phases
    .filter((phase) => !hiddenIds.has(phase.id) && !phase.isCompleted)
    .map((phase) => ({
      ...phase,
      tasks: [...phase.tasks].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      ),
    }))
    .sort((a, b) => {
      const startA = a.tasks[0]?.startDate.getTime() || Infinity;
      const startB = b.tasks[0]?.startDate.getTime() || Infinity;
      return startA - startB;
    });

  sortedPhases.forEach((phase) => {
    if (phase.tasks.length === 0) return;

    text += `[${phase.phaseName}]\n`;

    phase.tasks.forEach((t) => {
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
