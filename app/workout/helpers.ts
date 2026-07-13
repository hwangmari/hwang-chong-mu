import type {
  ExercisePR,
  GymRecord,
  GymSet,
  RunningBest,
  RunningRecord,
} from "./types";
import { formatDateKey } from "@/utils/date";

// =========================
// 시간 / 페이스 포맷
// =========================
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatPace(paceSec?: number | null): string {
  if (!paceSec || paceSec <= 0) return "-";
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}'${String(s).padStart(2, "0")}"/km`;
}

export function parseDurationInput(input: string): number {
  // "45:30" | "1:05:30" | "1800" (초)
  const trimmed = (input || "").trim();
  if (!trimmed) return 0;
  if (!trimmed.includes(":")) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  }
  const parts = trimmed.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

export function computePaceSec(distanceKm: number, durationSec: number) {
  if (!distanceKm || distanceKm <= 0 || !durationSec) return undefined;
  return Math.round(durationSec / distanceKm);
}

// 60분 이상이면 "시간 분" 형식, 미만이면 "N분"
export function formatDurationMin(min?: number | null): string {
  if (!min || min <= 0) return "";
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// 입력칸 포맷 — 분 숫자를 "h:mm" 혹은 단순 "N" 문자열로 표시
export function formatMinInput(min?: number | null): string {
  if (!min || min <= 0) return "";
  if (min < 60) return String(min);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// "45" | "1:30" | "4:08:22" 같은 입력을 분 단위 정수로 파싱
// 2-part는 h:mm (시간:분), 3-part는 h:mm:ss (시간:분:초)
export function parseMinutesInput(input: string): number {
  const trimmed = (input || "").trim();
  if (!trimmed) return 0;
  if (!trimmed.includes(":")) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  }
  const parts = trimmed.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 2) {
    const [h, m] = parts;
    return h * 60 + m;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 60 + m + Math.round(s / 60);
  }
  return 0;
}

// =========================
// 날짜 / 주간
// =========================
export function todayISO() {
  return formatDateKey(new Date());
}

function toISO(d: Date) {
  return formatDateKey(d);
}

export function startOfWeek(reference: Date = new Date()): Date {
  const d = new Date(reference);
  const day = d.getDay(); // 0(일) ~ 6(토)
  const diff = (day + 6) % 7; // 월요일 시작
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// =========================
// 러닝 통계
// =========================
export function computeRunningBest(records: RunningRecord[]): RunningBest | null {
  if (!records.length) return null;
  let longest = records[0];
  let fastest = records[0];
  for (const r of records) {
    if (r.distanceKm > longest.distanceKm) longest = r;
    const pace = r.avgPaceSec ?? computePaceSec(r.distanceKm, r.durationSec);
    const curFastestPace =
      fastest.avgPaceSec ?? computePaceSec(fastest.distanceKm, fastest.durationSec);
    if (pace && (!curFastestPace || pace < curFastestPace) && r.distanceKm >= 1) {
      fastest = r;
    }
  }
  const fastestPace =
    fastest.avgPaceSec ?? computePaceSec(fastest.distanceKm, fastest.durationSec) ?? 0;
  return {
    longestDistanceKm: longest.distanceKm,
    longestAt: longest.date,
    bestPaceSec: fastestPace,
    bestPaceAt: fastest.date,
  };
}

export function weeklyRunDistance(records: RunningRecord[]): number {
  const weekStart = startOfWeek();
  return records
    .filter((r) => new Date(r.date).getTime() >= weekStart.getTime())
    .reduce((sum, r) => sum + (r.distanceKm || 0), 0);
}

// =========================
// 헬스 통계
// =========================
// 빈 바벨 기본 무게 (kg). 토글이 켜진 운동은 입력 원판 무게에 이 값을 더해 계산.
export const DEFAULT_BARBELL_WEIGHT_KG = 20;

export function setVolumeKg(
  set: GymSet,
  sideCount: number = 1,
  barWeight: number = 0,
) {
  const bar = barWeight > 0 ? barWeight : 0;
  const multiplier = sideCount && sideCount > 0 ? sideCount : 1;
  // 원판은 양쪽(×sideCount) 합산 후 빈 바를 한 번만 더함.
  // 빈 바는 1개라서 sideCount 영향을 받지 않음.
  // 원판이 0이어도 빈 바로 운동한 거니까 빈 바 무게는 합산.
  const effective = (plate: number) => plate * multiplier + bar;
  const main = effective(set.weight || 0) * (set.reps || 0);
  const drops = (set.dropSets || []).reduce(
    (s, d) => s + effective(d.weight || 0) * (d.reps || 0),
    0,
  );
  return main + drops;
}

export function gymRecordVolumeKg(record: GymRecord) {
  return record.exercises.reduce(
    (sum, ex) =>
      // 시간 기록 운동은 무게·횟수가 없으므로 볼륨 계산에서 제외.
      ex.measure === "time"
        ? sum
        : sum +
          ex.sets.reduce(
            (s, set) => s + setVolumeKg(set, ex.sideCount, ex.barWeight),
            0,
          ),
    0,
  );
}

export function computeExercisePRs(records: GymRecord[]): ExercisePR[] {
  const bestByName = new Map<string, ExercisePR>();
  for (const r of records) {
    for (const ex of r.exercises) {
      // 시간 기록 운동: 버틴 최대 시간(durationSec)이 PR.
      // weight는 해당 세트의 무게(중량 매달리기), reps는 0.
      if (ex.measure === "time") {
        for (const set of ex.sets) {
          if (set.type === "warmup") continue;
          const dur = set.durationSec || 0;
          if (dur <= 0) continue;
          const prev = bestByName.get(ex.name);
          if (!prev || dur > (prev.durationSec ?? 0)) {
            bestByName.set(ex.name, {
              exerciseName: ex.name,
              achievedAt: r.date,
              weight: set.weight || 0,
              reps: 0,
              durationSec: dur,
              bodyPart: r.bodyPart,
            });
          }
        }
        continue;
      }
      const bar = ex.barWeight && ex.barWeight > 0 ? ex.barWeight : 0;
      const multiplier =
        ex.sideCount && ex.sideCount > 0 ? ex.sideCount : 1;
      for (const set of ex.sets) {
        if (set.type === "warmup") continue;
        if (!set.reps) continue;
        const plate = set.weight || 0;
        // 원판은 양쪽 합산 후 빈 바를 한 번만 더함. 원판 0이면 PR 기록 안 함.
        const effective = plate > 0 ? plate * multiplier + bar : 0;
        if (effective <= 0) continue;
        const prev = bestByName.get(ex.name);
        if (
          !prev ||
          effective > prev.weight ||
          (effective === prev.weight && set.reps > prev.reps)
        ) {
          bestByName.set(ex.name, {
            exerciseName: ex.name,
            achievedAt: r.date,
            weight: effective,
            reps: set.reps,
            bodyPart: r.bodyPart,
          });
        }
      }
    }
  }
  return Array.from(bestByName.values()).sort(
    (a, b) => b.weight - a.weight || b.reps - a.reps,
  );
}

export function weeklyGymVolume(records: GymRecord[]): number {
  const weekStart = startOfWeek();
  return records
    .filter((r) => new Date(r.date).getTime() >= weekStart.getTime())
    .reduce((sum, r) => sum + gymRecordVolumeKg(r), 0);
}

// =========================
// 월별 그룹핑 (아코디언 등 목록 정리용)
// =========================
export type MonthGroup<T> = {
  key: string; // "YYYY-MM"
  year: number;
  month: number;
  label: string; // "2026년 5월"
  items: T[];
};

export function groupRecordsByMonth<T extends { date: string }>(
  records: T[],
): MonthGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const r of records) {
    const key = r.date?.slice(0, 7);
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => {
      const [y, m] = key.split("-");
      return {
        key,
        year: Number(y),
        month: Number(m),
        label: `${y}년 ${Number(m)}월`,
        items,
      };
    });
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// =========================
// 운동 일수 (날짜 dedupe)
// =========================
export function monthlyWorkoutDays(
  ...buckets: Array<Array<{ date: string }>>
): number {
  const now = new Date();
  const ymPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const days = new Set<string>();
  for (const arr of buckets) {
    for (const r of arr) {
      if (r.date && r.date.startsWith(ymPrefix)) days.add(r.date);
    }
  }
  return days.size;
}

export function weeklyWorkoutDays(
  ...buckets: Array<Array<{ date: string }>>
): number {
  const weekStart = startOfWeek();
  const days = new Set<string>();
  for (const arr of buckets) {
    for (const r of arr) {
      if (!r.date) continue;
      if (new Date(r.date).getTime() >= weekStart.getTime()) {
        days.add(r.date);
      }
    }
  }
  return days.size;
}

// 오늘부터 거꾸로 세는 연속 운동 일수.
// 오늘 기록이 없어도 어제까지 이어졌다면 streak 유지(=오늘 안 빠뜨려도 됨).
export function currentWorkoutStreak(
  ...buckets: Array<Array<{ date: string }>>
): number {
  const days = new Set<string>();
  for (const arr of buckets) {
    for (const r of arr) {
      if (r.date) days.add(r.date);
    }
  }
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(toISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// =========================
// 차트용 집계
// =========================
export type TimeBucket = {
  start: Date;
  end: Date;
  key: string;
  label: string;
};

export function lastNWeeks(
  n: number,
  reference: Date = new Date(),
): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const cursor = startOfWeek(reference);
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date(cursor);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    buckets.push({
      start,
      end,
      key: toISO(start),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
    });
  }
  return buckets;
}

export function lastNMonths(
  n: number,
  reference: Date = new Date(),
): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const anchor = new Date(reference.getFullYear(), reference.getMonth(), 1);
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date(anchor);
    start.setMonth(start.getMonth() - i);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    buckets.push({
      start,
      end,
      key: `${start.getFullYear()}-${start.getMonth() + 1}`,
      label: `${start.getMonth() + 1}월`,
    });
  }
  return buckets;
}

function sumRunKmInRange(records: RunningRecord[], start: Date, end: Date) {
  return records
    .filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .reduce((sum, r) => sum + (r.distanceKm || 0), 0);
}

function sumGymVolumeInRange(records: GymRecord[], start: Date, end: Date) {
  return records
    .filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .reduce((sum, r) => sum + gymRecordVolumeKg(r), 0);
}

export function aggregateRunKm(
  records: RunningRecord[],
  buckets: TimeBucket[],
): number[] {
  return buckets.map((b) => sumRunKmInRange(records, b.start, b.end));
}

export function aggregateGymVolume(
  records: GymRecord[],
  buckets: TimeBucket[],
): number[] {
  return buckets.map((b) => sumGymVolumeInRange(records, b.start, b.end));
}

// =========================
// 운동 잔디 (GitHub 스타일 히트맵)
// =========================
export type CalendarCell = {
  iso: string;
  date: Date;
  dayOfWeek: number; // 0 = 월 (월요일 시작)
  intensity: 0 | 1 | 2 | 3;
};

export function buildWorkoutCalendar(
  runDates: string[],
  gymDates: string[],
  weekCount = 52,
  reference: Date = new Date(),
): CalendarCell[][] {
  const workoutDays = new Set<string>([...runDates, ...gymDates]);
  const countByDate = new Map<string, number>();
  [...runDates, ...gymDates].forEach((iso) => {
    countByDate.set(iso, (countByDate.get(iso) ?? 0) + 1);
  });

  const columns: CalendarCell[][] = [];
  const start = startOfWeek(reference);
  for (let w = weekCount - 1; w >= 0; w -= 1) {
    const col: CalendarCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start);
      date.setDate(date.getDate() - w * 7 + d);
      const iso = toISO(date);
      const count = countByDate.get(iso) ?? 0;
      let intensity: CalendarCell["intensity"] = 0;
      if (count >= 2) intensity = 3;
      else if (workoutDays.has(iso)) intensity = 2;
      col.push({
        iso,
        date,
        dayOfWeek: d,
        intensity,
      });
    }
    columns.push(col);
  }
  return columns;
}
