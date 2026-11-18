// 지출 내역의 날짜는 따로 저장하는 칸이 없어서, 사용 내역 앞에 "11/14 " 처럼 붙여 둔다.
// 입력(ExpenseInput)과 목록·날짜별 보기(ExpenseList)가 같은 규칙을 쓰도록 여기 한 곳에 둔다.

const DATE_PREFIX = /^(\d{1,2})\/(\d{1,2})\s+(.*)$/;
const WEEKDAYS = "일월화수목금토";

/** "11/14 커피" → { key: "11/14", order: 1114, rest: "커피" }. 날짜가 없으면 key 는 null */
export function splitDate(description: string) {
  const m = description.match(DATE_PREFIX);
  if (!m) return { key: null, order: -1, rest: description };
  const month = +m[1];
  const day = +m[2];
  return { key: `${month}/${day}`, order: month * 100 + day, rest: m[3] };
}

/** 날짜 키를 붙인 사용 내역. 키가 비어 있으면 그대로 */
export function withDate(key: string, description: string) {
  return key ? `${key} ${description}` : description;
}

/** Date → "11/14" */
export function toDateKey(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** "2026-11-14" (date 입력칸 값) → "11/14" */
export function isoToDateKey(iso: string) {
  const [, m, d] = iso.split("-");
  return m && d ? `${+m}/${+d}` : "";
}

/** 정렬 순서(월*100+일)로 요일. 연도 정보가 없어 올해로 본다 */
export function weekdayOf(order: number) {
  const d = new Date(
    new Date().getFullYear(),
    Math.floor(order / 100) - 1,
    order % 100,
  );
  return WEEKDAYS[d.getDay()];
}
