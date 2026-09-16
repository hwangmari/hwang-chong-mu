// 여행 플랜을 카카오톡·메모장에 그대로 붙여 넣을 수 있는 글로 바꾼다.
// 링크를 못 여는 사람에게도 일정을 통째로 보내 주려고 만든 것이라, 그림 없이 글자만 쓴다. (2026-09-16)
// 같은 글을 달력 파일(.ics)의 하루 설명으로도 쓴다 — 두 곳의 내용이 갈라지지 않게 한 군데서만 만든다.
import { addDays, format, parseISO } from "date-fns";
import { CATEGORY_LABEL, type TransitLeg, type TravelDay, type TravelPlan } from "../types";
import { dayLabel, nightsLabel } from "./plan";

// 이동 수단별 표시 (아이콘 + 이름)
const MODE_TEXT: Record<TransitLeg["mode"], string> = {
  WALK: "🚶 도보",
  TRANSIT: "🚆 대중교통",
  DRIVE: "🚗 차량",
};

/** 사람이 여는 여행 주소. 달력 앱에서 눌러 들어올 수 있게 붙인다. */
const SITE = "https://www.hwang-lab.kr";

export function buildTravelText(plan: TravelPlan): string {
  const lines: string[] = [
    `🧳 ${plan.title} (${plan.startDate}–${plan.endDate} · ${nightsLabel(plan.startDate, plan.endDate)})`,
  ];

  plan.days.forEach((day, index) => {
    lines.push("");
    lines.push(`[DAY ${dayNumber(index)} · ${dayLabel(day.date)}]`);
    lines.push(...buildDayLines(day));
  });

  return lines.join("\n");
}

/** 하루치 본문(머리말 줄은 뺀 나머지). 글 내보내기와 달력 파일이 같이 쓴다. */
function buildDayLines(day: TravelDay): string[] {
  const lines: string[] = [];

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

  return lines;
}

function transitLine(leg: TransitLeg): string {
  const summary = leg.summary ? ` · ${leg.summary}` : "";
  return `   ↳ ${MODE_TEXT[leg.mode]} ${leg.minutes}분${summary}`;
}

/** 1 → "01" (달력 제목의 DAY 번호를 두 자리로 맞춘다) */
function dayNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/* ===== 달력 파일(.ics) =====
   하루를 "종일 일정" 한 칸으로 만든다. 시간을 정해 두지 않았으니 시각이 아니라 날짜로만 적는다.
   ics 규칙 두 가지를 지켜야 달력 앱이 읽는다.
   1) 줄 끝은 CRLF, 2) 한 줄은 75옥텟까지 — 넘으면 다음 줄 맨 앞에 공백 한 칸을 두고 이어 적는다. */

/** ics 에서 뜻이 있는 글자(\ ; ,)와 줄바꿈을 그대로 보이게 바꾼다. */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "2026-10-16" → "20261016" */
function icsDate(date: string): string {
  return date.replace(/-/g, "");
}

/** 날짜 문자열을 하루 뒤로. 종일 일정의 끝(DTEND)은 "다음 날"을 적는 규칙이라 필요하다. */
function nextDay(date: string): string {
  return format(addDays(parseISO(date), 1), "yyyyMMdd");
}

/** 지금 시각을 UTC 로 "20260916T031500Z" 모양으로. */
function icsStamp(now: Date): string {
  return `${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;
}

/**
 * 한 줄을 75옥텟씩 자른다. 한글·그림글자가 반으로 쪼개지지 않게 글자 단위로 센다.
 * 이어지는 줄은 맨 앞 공백 한 칸까지 합쳐 75옥텟이다.
 */
function foldLine(line: string): string[] {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let buffer = "";
  let used = 0;

  for (const char of Array.from(line)) {
    const size = encoder.encode(char).length;
    if (used + size > 75) {
      parts.push(buffer);
      buffer = "";
      used = 1; // 이어지는 줄 맨 앞 공백 한 칸
    }
    buffer += char;
    used += size;
  }
  parts.push(buffer);

  return parts.map((part, index) => (index === 0 ? part : ` ${part}`));
}

export function buildTravelIcs(plan: TravelPlan, now = new Date()): string {
  const stamp = icsStamp(now);
  const url = `${SITE}/travel/${plan.id}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//황총무의 실험실//여행 플랜//KO",
    "CALSCALE:GREGORIAN",
  ];

  plan.days.forEach((day, index) => {
    const description = buildDayLines(day).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${icsDate(day.date)}`,
      `DTEND;VALUE=DATE:${nextDay(day.date)}`,
      `UID:${plan.id}-day${index + 1}@hwang-lab.kr`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${escapeIcs(`${plan.title} DAY ${dayNumber(index)}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `URL:${url}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");

  return `${lines.flatMap(foldLine).join("\r\n")}\r\n`;
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
