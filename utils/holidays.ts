import { format } from "date-fns";

// 한국 법정공휴일 (양력 고정 + 음력 변동분은 연도별 기입)
const HOLIDAYS: Record<string, string> = {
  // 양력 고정
  "01-01": "새해",
  "03-01": "삼일절",
  "05-01": "근로자의날",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "크리스마스",

  // 2025 음력 공휴일
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-05-05": "부처님오신날", // 어린이날과 겹침
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-08": "대체공휴일",

  // 2026 음력 공휴일
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-05-24": "부처님오신날",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",

  // 2027 음력 공휴일
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-05-13": "부처님오신날",
  "2027-10-14": "추석 연휴",
  "2027-10-15": "추석",
  "2027-10-16": "추석 연휴",
};

export function getHolidayName(date: Date): string | null {
  const fullKey = format(date, "yyyy-MM-dd");
  if (HOLIDAYS[fullKey]) return HOLIDAYS[fullKey];

  const monthDayKey = format(date, "MM-dd");
  if (HOLIDAYS[monthDayKey]) return HOLIDAYS[monthDayKey];

  return null;
}

export function isHoliday(date: Date): boolean {
  return getHolidayName(date) !== null;
}
