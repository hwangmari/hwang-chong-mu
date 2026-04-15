import type {
  ExercisePR,
  GymRecord,
  GymSet,
  RunningBest,
  RunningRecord,
} from "./types";

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
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
export function setVolumeKg(set: GymSet) {
  const main = (set.weight || 0) * (set.reps || 0);
  const drops = (set.dropSets || []).reduce(
    (s, d) => s + (d.weight || 0) * (d.reps || 0),
    0,
  );
  return main + drops;
}

export function gymRecordVolumeKg(record: GymRecord) {
  return record.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + setVolumeKg(set), 0),
    0,
  );
}

export function computeExercisePRs(records: GymRecord[]): ExercisePR[] {
  const bestByName = new Map<string, ExercisePR>();
  for (const r of records) {
    for (const ex of r.exercises) {
      for (const set of ex.sets) {
        if (set.type === "warmup") continue;
        if (!set.weight || !set.reps) continue;
        const prev = bestByName.get(ex.name);
        if (
          !prev ||
          set.weight > prev.weight ||
          (set.weight === prev.weight && set.reps > prev.reps)
        ) {
          bestByName.set(ex.name, {
            exerciseName: ex.name,
            achievedAt: r.date,
            weight: set.weight,
            reps: set.reps,
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
