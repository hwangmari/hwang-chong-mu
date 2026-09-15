// 여행 플랜을 카카오톡·메모장에 그대로 붙여 넣을 수 있는 글로 바꾼다.
// 링크를 못 여는 사람에게도 일정을 통째로 보내 주려고 만든 것이라, 그림 없이 글자만 쓴다. (2026-09-16)
import { CATEGORY_LABEL, type TransitLeg, type TravelPlan } from "../types";
import { dayLabel, nightsLabel } from "./plan";

// 이동 수단별 표시 (아이콘 + 이름)
const MODE_TEXT: Record<TransitLeg["mode"], string> = {
  WALK: "🚶 도보",
  TRANSIT: "🚆 대중교통",
  DRIVE: "🚗 차량",
};

export function buildTravelText(plan: TravelPlan): string {
  const lines: string[] = [
    `🧳 ${plan.title} (${plan.startDate}–${plan.endDate} · ${nightsLabel(plan.startDate, plan.endDate)})`,
  ];

  plan.days.forEach((day, index) => {
    lines.push("");
    lines.push(`[DAY ${String(index + 1).padStart(2, "0")} · ${dayLabel(day.date)}]`);

    // 숙소는 그날의 기준점이라 번호 없이 맨 위에 한 줄로 따로 적는다
    const stay = day.places.find((place) => place.isStay);
    if (stay) {
      lines.push(`🏨 숙소: ${stay.name}`);
      if (stay.transitToNext) lines.push(transitLine(stay.transitToNext));
    }

    day.places
      .filter((place) => !place.isStay)
      .forEach((place, i) => {
        const memo = place.memo?.trim() ? ` (메모: ${place.memo.trim()})` : "";
        lines.push(`${i + 1}. ${CATEGORY_LABEL[place.category]} · ${place.name}${memo}`);
        if (place.transitToNext) lines.push(transitLine(place.transitToNext));
      });
  });

  return lines.join("\n");
}

function transitLine(leg: TransitLeg): string {
  return `   ↳ ${MODE_TEXT[leg.mode]} ${leg.minutes}분`;
}

/** 글을 파일로 내려받기 (브라우저에서만 부른다) */
export function downloadTextFile(
  name: string,
  content: string,
  mime = "text/plain;charset=utf-8",
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
