// 대진표 자동 생성 (순수 함수).
// 목표(PDF 대진표의 검증 항목과 동일):
//  1) 전원 최소 출전 횟수 채우기 + 성별 안에서 출전 횟수 차이 1 이하
//  2) 성별 규칙: 남복은 남 4, 여복은 여 4, 혼복은 각 팀 남1·여1
//  3) 한 라운드에 같은 사람이 두 번 나오지 않기
//  4) 같은 짝(팀 조합) 중복 없음
//  5) 연속 휴식 최대 3라운드
//  6) 양 팀 구력 합산이 비슷하게
// 방법: 우선순위(출전 적은 순 → 오래 쉰 순) + 약간의 무작위로 여러 번 만들어 벌점이 가장 낮은 안을 고른다.
import { roundLabel, roundTime } from "./format";
import type {
  EventDraft,
  Gender,
  Match,
  MatchType,
  Player,
  Round,
} from "./types";

export const MAX_REST_ROUNDS = 3;

export type Split = { menMatches: number; womenMatches: number; mixedMatches: number };

export type BracketWarning = {
  level: "error" | "warn";
  message: string;
};

export type Generated = {
  matches: Match[];
  rounds: Round[];
  warnings: BracketWarning[];
};

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 남복/여복/혼복 경기 수 추천: 남녀 1인당 출전 횟수가 가장 비슷해지는 조합
export function suggestSplit(players: Player[], courts: number, rounds: number): Split {
  const total = courts * rounds;
  const men = players.filter((p) => p.gender === "M").length;
  const women = players.length - men;

  let best: Split = { menMatches: 0, womenMatches: 0, mixedMatches: 0 };
  let bestScore = Number.POSITIVE_INFINITY;

  for (let mixed = 0; mixed <= total; mixed += 1) {
    for (let menM = 0; menM + mixed <= total; menM += 1) {
      const womenM = total - mixed - menM;
      if (menM > 0 && men < 4) continue;
      if (womenM > 0 && women < 4) continue;
      if (mixed > 0 && (men < 2 || women < 2)) continue;
      // 한 라운드에 필요한 최대 인원이 실제 인원을 넘으면 불가 (대략 검사: 코트 수만큼 같은 종목이 몰릴 때)
      if (menM > 0 && men < 4 * Math.min(courts, menM) && mixed + womenM === 0) continue;

      const menSlots = 4 * menM + 2 * mixed;
      const womenSlots = 4 * womenM + 2 * mixed;
      if (men === 0 && menSlots > 0) continue;
      if (women === 0 && womenSlots > 0) continue;
      const appM = men ? menSlots / men : 0;
      const appF = women ? womenSlots / women : 0;
      // 남녀 출전 횟수 차이가 작을수록 좋고, 혼복이 많을수록(교류 취지) 좋다.
      // 인원이 4명 이상인 성별은 같은 성별 복식도 한 경기 이상 넣어 준다
      const missingSame =
        (men >= 4 && menM === 0 ? 1 : 0) + (women >= 4 && womenM === 0 ? 1 : 0);
      const score = Math.abs(appM - appF) * 100 + missingSame * 20 - mixed * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = { menMatches: menM, womenMatches: womenM, mixedMatches: mixed };
      }
    }
  }
  return best;
}

// 라운드마다 어떤 종목 경기가 몇 개 들어가는지 배치 (같은 성별 경기를 앞 라운드에, 혼복을 뒤에)
function planRoundTypes(
  split: Split,
  courts: number,
  rounds: number,
  men: number,
  women: number,
  rand: () => number,
): MatchType[][] | null {
  const pool: MatchType[] = [
    ...Array<MatchType>(split.menMatches).fill("men"),
    ...Array<MatchType>(split.womenMatches).fill("women"),
    ...Array<MatchType>(split.mixedMatches).fill("mixed"),
  ];
  if (pool.length !== courts * rounds) return null;

  const need = (types: MatchType[], gender: Gender) =>
    types.reduce(
      (sum, t) =>
        sum + (t === "mixed" ? 2 : (t === "men") === (gender === "M") ? 4 : 0),
      0,
    );

  // 여러 번 섞어 보고 라운드별 인원 조건(남/여 각각 충분)을 만족하는 배치를 찾는다
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const order = attempt === 0 ? pool : shuffle(pool, rand);
    const plan: MatchType[][] = [];
    for (let r = 0; r < rounds; r += 1) plan.push(order.slice(r * courts, (r + 1) * courts));
    const ok = plan.every((types) => need(types, "M") <= men && need(types, "F") <= women);
    if (ok) return plan;
  }
  return null;
}

type Tracker = {
  appearances: Map<string, number>;
  lastRound: Map<string, number>; // 마지막 출전 라운드(1부터). 0이면 아직 없음
  pairs: Set<string>;
};

function pickPlayers(
  candidates: Player[],
  count: number,
  round: number,
  tracker: Tracker,
  rand: () => number,
): Player[] {
  const scored = candidates.map((p) => {
    const app = tracker.appearances.get(p.name) ?? 0;
    const rest = round - (tracker.lastRound.get(p.name) ?? 0);
    // 출전이 적을수록, 오래 쉬었을수록 먼저. 3라운드 이상 쉬었으면 강하게 당긴다
    const priority = app * 10 - rest * 2 - (rest > MAX_REST_ROUNDS ? 50 : 0) + rand() * 4;
    return { p, priority };
  });
  scored.sort((a, b) => a.priority - b.priority);
  return scored.slice(0, count).map((s) => s.p);
}

// 4명을 두 팀으로 나누는 방법 중 짝 중복이 없고 구력 합이 비슷한 쪽
function bestPairing(
  options: [Player, Player, Player, Player][],
  tracker: Tracker,
): { teams: [Player, Player, Player, Player]; repeated: number } {
  let best = options[0];
  let bestScore = Number.POSITIVE_INFINITY;
  let bestRepeated = 0;
  for (const opt of options) {
    const [a1, a2, b1, b2] = opt;
    const repeated =
      (tracker.pairs.has(pairKey(a1.name, a2.name)) ? 1 : 0) +
      (tracker.pairs.has(pairKey(b1.name, b2.name)) ? 1 : 0);
    const diff = Math.abs(a1.years + a2.years - (b1.years + b2.years));
    const score = repeated * 100 + diff;
    if (score < bestScore) {
      bestScore = score;
      best = opt;
      bestRepeated = repeated;
    }
  }
  return { teams: best, repeated: bestRepeated };
}

function buildOnce(
  players: Player[],
  plan: MatchType[][],
  rand: () => number,
): { matches: Match[]; penalty: number } {
  const men = players.filter((p) => p.gender === "M");
  const women = players.filter((p) => p.gender === "F");
  const tracker: Tracker = { appearances: new Map(), lastRound: new Map(), pairs: new Set() };
  const matches: Match[] = [];
  let penalty = 0;
  let no = 1;

  plan.forEach((types, roundIndex) => {
    const round = roundIndex + 1;
    const used = new Set<string>();
    types.forEach((type, courtIndex) => {
      let teams: [Player, Player, Player, Player];
      if (type === "mixed") {
        const [m1, m2] = pickPlayers(men.filter((p) => !used.has(p.name)), 2, round, tracker, rand);
        const [f1, f2] = pickPlayers(women.filter((p) => !used.has(p.name)), 2, round, tracker, rand);
        const picked = bestPairing(
          [
            [m1, f1, m2, f2],
            [m1, f2, m2, f1],
          ],
          tracker,
        );
        teams = picked.teams;
        penalty += picked.repeated * 100;
      } else {
        const pool = type === "men" ? men : women;
        const [p1, p2, p3, p4] = pickPlayers(pool.filter((p) => !used.has(p.name)), 4, round, tracker, rand);
        const picked = bestPairing(
          [
            [p1, p2, p3, p4],
            [p1, p3, p2, p4],
            [p1, p4, p2, p3],
          ],
          tracker,
        );
        teams = picked.teams;
        penalty += picked.repeated * 100;
      }

      const [a1, a2, b1, b2] = teams;
      for (const p of teams) {
        used.add(p.name);
        tracker.appearances.set(p.name, (tracker.appearances.get(p.name) ?? 0) + 1);
        tracker.lastRound.set(p.name, round);
      }
      tracker.pairs.add(pairKey(a1.name, a2.name));
      tracker.pairs.add(pairKey(b1.name, b2.name));
      penalty += Math.abs(a1.years + a2.years - (b1.years + b2.years));

      matches.push({
        no,
        round,
        court: courtIndex === 0 ? "A" : "B",
        type,
        teamA: [a1.name, a2.name],
        teamB: [b1.name, b2.name],
      });
      no += 1;
    });
  });

  // 출전 횟수 편차·연속 휴식 벌점
  for (const gender of ["M", "F"] as Gender[]) {
    const apps = players
      .filter((p) => p.gender === gender)
      .map((p) => tracker.appearances.get(p.name) ?? 0);
    if (apps.length === 0) continue;
    const spread = Math.max(...apps) - Math.min(...apps);
    if (spread > 1) penalty += (spread - 1) * 60;
    if (Math.min(...apps) === 0) penalty += 500;
  }
  penalty += countRestViolations(players, matches, plan.length) * 40;

  return { matches, penalty };
}

// 연속 휴식 위반 수. 마지막 경기 뒤로 쉬는 건 세지 않는다 (PDF 대진표의 검증 기준과 동일)
function countRestViolations(players: Player[], matches: Match[], rounds: number): number {
  let count = 0;
  for (const p of players) {
    const playedRounds = matches
      .filter((m) => m.teamA.includes(p.name) || m.teamB.includes(p.name))
      .map((m) => m.round);
    if (playedRounds.length === 0) continue;
    const played = new Set(playedRounds);
    const last = Math.max(...playedRounds);
    let rest = 0;
    for (let r = 1; r <= Math.min(rounds, last); r += 1) {
      if (played.has(r)) rest = 0;
      else {
        rest += 1;
        if (rest > MAX_REST_ROUNDS) {
          count += 1;
          rest = 0;
        }
      }
    }
  }
  return count;
}

export function generateBracket(draft: EventDraft, attempts = 400): Generated | { error: string } {
  const { players, courts, rounds } = draft;
  const men = players.filter((p) => p.gender === "M").length;
  const women = players.length - men;
  if (players.length < 4) return { error: "선수가 최소 4명은 있어야 해요." };
  if (courts < 1 || rounds < 1) return { error: "코트 수와 라운드 수는 1 이상이어야 해요." };
  if (courts > 2) return { error: "지금은 코트 2면까지만 지원해요." };

  const split: Split = {
    menMatches: draft.menMatches,
    womenMatches: draft.womenMatches,
    mixedMatches: draft.mixedMatches,
  };
  if (split.menMatches + split.womenMatches + split.mixedMatches !== courts * rounds) {
    return { error: `남복·여복·혼복 경기 수의 합이 총 경기 수(${courts * rounds})와 같아야 해요.` };
  }

  let seed = Date.now() % 100000;
  const rand = () => {
    // 간단한 LCG — 재현 가능한 무작위
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const plan = planRoundTypes(split, courts, rounds, men, women, rand);
  if (!plan) {
    return {
      error: "이 인원으로는 라운드마다 필요한 남/여 선수 수를 채울 수 없어요. 경기 수 구성을 바꿔 보세요.",
    };
  }

  let best: { matches: Match[]; penalty: number } | null = null;
  for (let i = 0; i < attempts; i += 1) {
    const result = buildOnce(players, plan, rand);
    if (!best || result.penalty < best.penalty) best = result;
    if (best.penalty === 0) break;
  }
  if (!best) return { error: "대진표를 만들지 못했어요." };

  const roundsOut: Round[] = plan.map((types, i) => ({
    no: i + 1,
    label: roundLabel(types),
    time: roundTime(draft.startTime, draft.minutesPerMatch, i),
  }));
  return {
    matches: best.matches,
    rounds: roundsOut,
    warnings: validateBracket(players, best.matches, rounds),
  };
}

// 대진표 점검 (자동 생성 결과·손으로 고친 결과 모두 여기로)
export function validateBracket(players: Player[], matches: Match[], rounds: number): BracketWarning[] {
  const warnings: BracketWarning[] = [];
  const byName = new Map(players.map((p) => [p.name, p]));
  const apps = new Map<string, number>();
  const pairs = new Map<string, number>();

  for (let r = 1; r <= rounds; r += 1) {
    const seen = new Map<string, number>();
    for (const m of matches.filter((x) => x.round === r)) {
      for (const n of [...m.teamA, ...m.teamB]) seen.set(n, (seen.get(n) ?? 0) + 1);
    }
    for (const [name, count] of seen) {
      if (count > 1) warnings.push({ level: "error", message: `R${r}에 ${name} 님이 ${count}번 나와요.` });
    }
  }

  for (const m of matches) {
    const all = [...m.teamA, ...m.teamB];
    if (new Set(all).size !== 4) {
      warnings.push({ level: "error", message: `M${String(m.no).padStart(2, "0")}에 같은 사람이 두 번 들어 있어요.` });
    }
    for (const n of all) {
      apps.set(n, (apps.get(n) ?? 0) + 1);
      if (!byName.has(n)) warnings.push({ level: "error", message: `${n} 님은 선수 명단에 없어요.` });
    }
    const genders = (team: [string, string]) => team.map((n) => byName.get(n)?.gender ?? null);
    const check = (team: [string, string], side: string) => {
      const g = genders(team);
      if (m.type === "men" && g.some((x) => x !== "M"))
        warnings.push({ level: "error", message: `M${String(m.no).padStart(2, "0")} ${side}팀: 남자 복식인데 남자가 아닌 선수가 있어요.` });
      if (m.type === "women" && g.some((x) => x !== "F"))
        warnings.push({ level: "error", message: `M${String(m.no).padStart(2, "0")} ${side}팀: 여자 복식인데 여자가 아닌 선수가 있어요.` });
      if (m.type === "mixed" && !(g.includes("M") && g.includes("F")))
        warnings.push({ level: "error", message: `M${String(m.no).padStart(2, "0")} ${side}팀: 혼합 복식은 남1·여1이어야 해요.` });
    };
    check(m.teamA, "A");
    check(m.teamB, "B");
    for (const team of [m.teamA, m.teamB]) {
      const key = pairKey(team[0], team[1]);
      pairs.set(key, (pairs.get(key) ?? 0) + 1);
    }
  }

  for (const [key, count] of pairs) {
    if (count > 1) warnings.push({ level: "warn", message: `${key.replace("|", " · ")} 짝이 ${count}번 나와요.` });
  }

  for (const gender of ["M", "F"] as Gender[]) {
    const group = players.filter((p) => p.gender === gender);
    if (group.length === 0) continue;
    const counts = group.map((p) => apps.get(p.name) ?? 0);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    if (min === 0) {
      const names = group.filter((p) => (apps.get(p.name) ?? 0) === 0).map((p) => p.name);
      warnings.push({ level: "error", message: `${names.join(", ")} 님은 한 경기도 없어요.` });
    }
    if (max - min > 1) {
      warnings.push({
        level: "warn",
        message: `${gender === "M" ? "남자" : "여자"} 출전 횟수가 ${min}~${max}회로 차이가 나요.`,
      });
    }
  }

  const restViolations = countRestViolations(players, matches, rounds);
  if (restViolations > 0) {
    warnings.push({ level: "warn", message: `연속 ${MAX_REST_ROUNDS}라운드 넘게 쉬는 경우가 ${restViolations}번 있어요.` });
  }

  return warnings;
}
