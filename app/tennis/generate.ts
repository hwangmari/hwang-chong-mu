// 대진표 자동 생성 (순수 함수).
// 항상 지키는 것: 성별 규칙(남복 남4·여복 여4·혼복 팀마다 남1여1), 같은 묶음(동시에 뛰는 코트들)에 같은 사람 없음.
// 켜고 끄는 규칙(rules.ts): 전원 고른 출전, 짝 중복 없음, 연속 휴식 제한, 구력 균형, 연속 출전 없음, 팀 대항.
// 방법: 우선순위(출전 적은 순 → 오래 쉰 순) + 약간의 무작위로 여러 번 만들어 벌점이 가장 낮은 안을 고른다.
import { roundLabel, roundTime } from "./format";
import { DEFAULT_RULES, type RuleSettings } from "./rules";
import type { EventDraft, Gender, Match, MatchType, Player, Round } from "./types";

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

// 출전 횟수를 "고르게"의 기준 묶음: 보통은 성별, 팀 대항이면 소속×성별
export type AppearanceGroup = { key: string; label: string; count: number; players: Player[] };

export function appearanceGroups(players: Player[], teamMatch: boolean): AppearanceGroup[] {
  const map = new Map<string, AppearanceGroup>();
  for (const p of players) {
    const team = teamMatch ? (p.team?.trim() ?? "") : "";
    const key = `${team}|${p.gender}`;
    const label = `${team ? `${team} ` : ""}${p.gender === "M" ? "남자" : "여자"}`;
    const g = map.get(key) ?? { key, label, count: 0, players: [] };
    g.count += 1;
    g.players.push(p);
    map.set(key, g);
  }
  return [...map.values()];
}

// 이 구성(남복/여복/혼복 경기 수)에서 각 묶음의 1인당 예상 출전 횟수
export function expectedAppearances(
  players: Player[],
  split: Split,
  teamMatch: boolean,
): { label: string; perPlayer: number }[] {
  const groups = appearanceGroups(players, teamMatch);
  const teams = teamMatch ? new Set(groups.map((g) => g.key.split("|")[0])).size : 1;
  return groups.map((g) => {
    const gender = g.key.split("|")[1];
    // 팀 대항이면 한 경기의 자리가 팀 수만큼 나뉜다 (2팀이면 남복 한 경기에 팀당 남자 2명)
    const slots =
      gender === "M"
        ? (4 * split.menMatches + 2 * split.mixedMatches) / teams
        : (4 * split.womenMatches + 2 * split.mixedMatches) / teams;
    return { label: g.label, perPlayer: g.count ? slots / g.count : 0 };
  });
}

// 남복/여복/혼복 경기 수 추천: 묶음별 1인당 출전 횟수가 가장 비슷해지는 조합
export function suggestSplit(players: Player[], courts: number, total: number, teamMatch = false): Split {
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
      if (menM > 0 && men < 4 * Math.min(courts, menM) && mixed + womenM === 0) continue;
      if (men === 0 && (menM > 0 || mixed > 0)) continue;
      if (women === 0 && (womenM > 0 || mixed > 0)) continue;

      const split = { menMatches: menM, womenMatches: womenM, mixedMatches: mixed };
      const rates = expectedAppearances(players, split, teamMatch).map((r) => r.perPlayer);
      const spread = Math.max(...rates) - Math.min(...rates);
      // 묶음 간 출전 횟수 차이가 작을수록 좋고, 혼복이 많을수록(교류 취지) 좋다.
      // 인원이 4명 이상인 성별은 같은 성별 복식도 한 경기 이상 넣어 준다
      const missingSame =
        (men >= 4 && menM === 0 ? 1 : 0) + (women >= 4 && womenM === 0 ? 1 : 0);
      const score = spread * 100 + missingSame * 20 - mixed * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = split;
      }
    }
  }
  return best;
}

// 묶음(동시에 뛰는 코트들)마다 어떤 종목 경기가 들어가는지 배치 (같은 성별 경기를 앞에, 혼복을 뒤에)
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
  // 총 경기 수가 코트 수로 나누어떨어지지 않으면 마지막 묶음은 경기가 적다
  if (pool.length > courts * rounds || pool.length <= courts * (rounds - 1)) return null;

  const need = (types: MatchType[], gender: Gender) =>
    types.reduce(
      (sum, t) => sum + (t === "mixed" ? 2 : (t === "men") === (gender === "M") ? 4 : 0),
      0,
    );

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
  lastRound: Map<string, number>; // 마지막 출전 묶음(1부터). 0이면 아직 없음
  lastMatchNo: Map<string, number>; // 마지막 출전 경기 번호(순서). 0이면 아직 없음
  pairs: Set<string>;
  nextNo: number; // 지금 뽑고 있는 경기의 번호
  courts: number;
};

function priorityOf(p: Player, round: number, tracker: Tracker, rules: RuleSettings, rand: () => number) {
  const app = tracker.appearances.get(p.name) ?? 0;
  const last = tracker.lastRound.get(p.name) ?? 0;
  const rest = round - last;
  let priority = app * 10 - rest * 2 + rand() * 4;
  if (rules.maxRest !== null && rest > rules.maxRest) priority -= 50; // 너무 오래 쉬면 강하게 당긴다
  if (rules.noBackToBack && last === round - 1) priority += 100; // 직전 묶음에 뛰었으면 뒤로
  // 순서상 바로 앞 경기(코트 수 안쪽)에 뛴 사람은 피한다 — 앞 경기가 안 끝나면 코트가 기다리게 되므로
  const lastNo = tracker.lastMatchNo.get(p.name) ?? 0;
  if (lastNo > 0 && tracker.nextNo - lastNo < tracker.courts) priority += 30;
  return priority;
}

function pickPlayers(
  candidates: Player[],
  count: number,
  round: number,
  tracker: Tracker,
  rules: RuleSettings,
  rand: () => number,
): Player[] {
  return candidates
    .map((p) => ({ p, priority: priorityOf(p, round, tracker, rules, rand) }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count)
    .map((s) => s.p);
}

type Four = [Player, Player, Player, Player];
type Picked = { teams: Four; penalty: number };

function pairPenalty(four: Four, tracker: Tracker, rules: RuleSettings): number {
  const [a1, a2, b1, b2] = four;
  const repeated =
    (tracker.pairs.has(pairKey(a1.name, a2.name)) ? 1 : 0) +
    (tracker.pairs.has(pairKey(b1.name, b2.name)) ? 1 : 0);
  const diff = Math.abs(a1.years + a2.years - (b1.years + b2.years));
  return (rules.noRepeatPair ? repeated * 100 : 0) + (rules.balancedYears ? diff : 0);
}

// 4명을 두 팀으로 나누는 방법 중 짝 중복이 없고(규칙 켜짐) 구력 합이 비슷한(규칙 켜짐) 쪽
function bestPairing(options: Four[], tracker: Tracker, rules: RuleSettings): Picked {
  let best = options[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const opt of options) {
    const score = pairPenalty(opt, tracker, rules);
    if (score < bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return { teams: best, penalty: bestScore };
}

// 팀 대항: 같은 소속끼리 짝, 다른 소속과 대결. 소속 두 개를 골라 각각에서 뽑는다
function pickTeamMatch(
  type: MatchType,
  free: Player[],
  round: number,
  tracker: Tracker,
  rules: RuleSettings,
  rand: () => number,
): Picked | null {
  const byTeam = new Map<string, Player[]>();
  for (const p of free) {
    const team = p.team?.trim() ?? "";
    if (!team) continue;
    byTeam.set(team, [...(byTeam.get(team) ?? []), p]);
  }
  const teamNames = [...byTeam.keys()];
  if (teamNames.length < 2) return null;

  // 한 소속에서 이 종목의 한 팀(2명)을 뽑는다
  const pickSide = (pool: Player[]): [Player, Player] | null => {
    if (type === "mixed") {
      const [m] = pickPlayers(pool.filter((p) => p.gender === "M"), 1, round, tracker, rules, rand);
      const [f] = pickPlayers(pool.filter((p) => p.gender === "F"), 1, round, tracker, rules, rand);
      return m && f ? [m, f] : null;
    }
    const gender: Gender = type === "men" ? "M" : "F";
    const [a, b] = pickPlayers(pool.filter((p) => p.gender === gender), 2, round, tracker, rules, rand);
    return a && b ? [a, b] : null;
  };

  let best: Picked | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < teamNames.length; i += 1) {
    for (let j = i + 1; j < teamNames.length; j += 1) {
      const sideA = pickSide(byTeam.get(teamNames[i]) ?? []);
      const sideB = pickSide(byTeam.get(teamNames[j]) ?? []);
      if (!sideA || !sideB) continue;
      const four: Four = [sideA[0], sideA[1], sideB[0], sideB[1]];
      // 소속이 정해져 있으니 짝 바꾸기는 없고, 우선순위 합(출전 적고 오래 쉰 사람 우선)으로 고른다
      const prio = four.reduce((sum, p) => sum + priorityOf(p, round, tracker, rules, () => 0), 0);
      const penalty = pairPenalty(four, tracker, rules);
      const score = prio + penalty;
      if (score < bestScore) {
        bestScore = score;
        best = { teams: four, penalty };
      }
    }
  }
  return best;
}

function buildOnce(
  players: Player[],
  plan: MatchType[][],
  rules: RuleSettings,
  rand: () => number,
): { matches: Match[]; penalty: number } {
  const men = players.filter((p) => p.gender === "M");
  const women = players.filter((p) => p.gender === "F");
  const tracker: Tracker = {
    appearances: new Map(),
    lastRound: new Map(),
    lastMatchNo: new Map(),
    pairs: new Set(),
    nextNo: 1,
    courts: Math.max(1, plan[0]?.length ?? 1),
  };
  const matches: Match[] = [];
  let penalty = 0;
  let no = 1;

  plan.forEach((types, roundIndex) => {
    const round = roundIndex + 1;
    const used = new Set<string>();
    types.forEach((type, courtIndex) => {
      tracker.nextNo = no;
      const free = players.filter((p) => !used.has(p.name));
      let picked: Picked | null = null;

      if (rules.teamMatch) {
        picked = pickTeamMatch(type, free, round, tracker, rules, rand);
        if (!picked) penalty += 200; // 팀 대항 규칙을 못 지킨 경기
      }
      if (!picked) {
        if (type === "mixed") {
          const [m1, m2] = pickPlayers(men.filter((p) => !used.has(p.name)), 2, round, tracker, rules, rand);
          const [f1, f2] = pickPlayers(women.filter((p) => !used.has(p.name)), 2, round, tracker, rules, rand);
          picked = bestPairing(
            [
              [m1, f1, m2, f2],
              [m1, f2, m2, f1],
            ],
            tracker,
            rules,
          );
        } else {
          const pool = type === "men" ? men : women;
          const [p1, p2, p3, p4] = pickPlayers(pool.filter((p) => !used.has(p.name)), 4, round, tracker, rules, rand);
          picked = bestPairing(
            [
              [p1, p2, p3, p4],
              [p1, p3, p2, p4],
              [p1, p4, p2, p3],
            ],
            tracker,
            rules,
          );
        }
      }

      const [a1, a2, b1, b2] = picked.teams;
      penalty += picked.penalty;
      for (const p of picked.teams) {
        if (rules.noBackToBack && (tracker.lastRound.get(p.name) ?? 0) === round - 1) penalty += 60;
        const lastNo = tracker.lastMatchNo.get(p.name) ?? 0;
        if (lastNo > 0 && no - lastNo < tracker.courts) penalty += 25; // 바로 앞 경기와 겹침
        used.add(p.name);
        tracker.appearances.set(p.name, (tracker.appearances.get(p.name) ?? 0) + 1);
        tracker.lastRound.set(p.name, round);
        tracker.lastMatchNo.set(p.name, no);
      }
      tracker.pairs.add(pairKey(a1.name, a2.name));
      tracker.pairs.add(pairKey(b1.name, b2.name));

      // round/court는 "처음 계획"으로만 남긴다. 실제 진행은 목록 순서 + 빈 코트
      matches.push({
        no,
        type,
        teamA: [a1.name, a2.name],
        teamB: [b1.name, b2.name],
        round,
        court: courtIndex === 0 ? "A" : "B",
      });
      no += 1;
    });
  });

  // 출전 횟수 편차·연속 휴식 벌점 (규칙이 켜진 것만). 팀 대항이면 소속×성별 묶음 안에서 비교
  for (const group of appearanceGroups(players, rules.teamMatch)) {
    const apps = group.players.map((p) => tracker.appearances.get(p.name) ?? 0);
    const spread = Math.max(...apps) - Math.min(...apps);
    if (rules.balanced && spread > 1) penalty += (spread - 1) * 60;
    if (Math.min(...apps) === 0) penalty += 500; // 한 경기도 없는 사람은 규칙과 무관하게 피한다
  }
  if (rules.maxRest !== null) {
    penalty += countRestViolations(players, matches, plan.length, rules.maxRest) * 40;
  }

  return { matches, penalty };
}

// 연속 휴식 위반 수. 마지막 경기 뒤로 쉬는 건 세지 않는다 (PDF 대진표의 검증 기준과 동일)
function countRestViolations(players: Player[], matches: Match[], rounds: number, maxRest: number): number {
  const courts = Math.max(1, Math.ceil(matches.length / Math.max(1, rounds)));
  let count = 0;
  for (const p of players) {
    const playedRounds = matches
      .map((m, i) => ({ m, round: Math.floor(i / courts) + 1 }))
      .filter(({ m }) => m.teamA.includes(p.name) || m.teamB.includes(p.name))
      .map(({ round }) => round);
    if (playedRounds.length === 0) continue;
    const played = new Set(playedRounds);
    const last = Math.max(...playedRounds);
    let rest = 0;
    for (let r = 1; r <= Math.min(rounds, last); r += 1) {
      if (played.has(r)) rest = 0;
      else {
        rest += 1;
        if (rest > maxRest) {
          count += 1;
          rest = 0;
        }
      }
    }
  }
  return count;
}

export function generateBracket(draft: EventDraft, attempts = 400): Generated | { error: string } {
  const { players, courts, totalMatches } = draft;
  const rules = draft.rules ?? DEFAULT_RULES;
  const men = players.filter((p) => p.gender === "M").length;
  const women = players.length - men;
  if (players.length < 4) return { error: "선수가 최소 4명은 있어야 해요." };
  if (courts < 1 || totalMatches < 1) return { error: "코트 수와 총 경기 수는 1 이상이어야 해요." };
  if (courts > 2) return { error: "지금은 코트 2면까지만 지원해요." };
  const rounds = Math.ceil(totalMatches / courts);

  const split: Split = {
    menMatches: draft.menMatches,
    womenMatches: draft.womenMatches,
    mixedMatches: draft.mixedMatches,
  };
  if (split.menMatches + split.womenMatches + split.mixedMatches !== totalMatches) {
    return { error: `남복·여복·혼복 경기 수의 합이 총 경기 수(${totalMatches})와 같아야 해요.` };
  }

  let seed = Date.now() % 100000;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const plan = planRoundTypes(split, courts, rounds, men, women, rand);
  if (!plan) {
    return {
      error: "이 인원으로는 묶음마다 필요한 남/여 선수 수를 채울 수 없어요. 총 경기 수를 줄여 보세요.",
    };
  }

  let best: { matches: Match[]; penalty: number } | null = null;
  for (let i = 0; i < attempts; i += 1) {
    const result = buildOnce(players, plan, rules, rand);
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
    warnings: validateBracket(players, best.matches, courts, rules),
  };
}

// 대진표 점검 (자동 생성 결과·손으로 고친 결과 모두 여기로). 켜진 규칙만 경고한다
export function validateBracket(
  players: Player[],
  matches: Match[],
  courts = 2,
  rules: RuleSettings = DEFAULT_RULES,
): BracketWarning[] {
  const warnings: BracketWarning[] = [];
  const byName = new Map(players.map((p) => [p.name, p]));
  const apps = new Map<string, number>();
  const pairs = new Map<string, number>();
  const label = (i: number) => `${i + 1}번째 경기`;

  // 순서상 코트 수만큼 연달아 붙은 경기들은 동시에 뛸 수 있으니 같은 사람이 겹치면 안 된다 (항상)
  const step = Math.max(1, courts);
  for (let i = 0; i + 1 < matches.length; i += 1) {
    const window = matches.slice(i, i + step);
    if (window.length < 2) continue;
    const seen = new Map<string, number>();
    for (const m of window) for (const n of [...m.teamA, ...m.teamB]) seen.set(n, (seen.get(n) ?? 0) + 1);
    for (const [name, count] of seen) {
      if (count > 1) {
        warnings.push({
          level: "warn",
          message: `${i + 1}~${i + window.length}번째 경기에 ${name} 님이 연달아 있어요. 한 코트가 기다리게 돼요.`,
        });
      }
    }
  }
  const rounds = Math.ceil(matches.length / step);

  matches.forEach((m, i) => {
    const all = [...m.teamA, ...m.teamB];
    if (new Set(all).size !== 4) warnings.push({ level: "error", message: `${label(i)}에 같은 사람이 두 번 들어 있어요.` });
    for (const n of all) {
      apps.set(n, (apps.get(n) ?? 0) + 1);
      if (!byName.has(n)) warnings.push({ level: "error", message: `${n} 님은 선수 명단에 없어요.` });
    }
    const genders = (team: [string, string]) => team.map((n) => byName.get(n)?.gender ?? null);
    const check = (team: [string, string], side: string) => {
      const g = genders(team);
      if (m.type === "men" && g.some((x) => x !== "M"))
        warnings.push({ level: "error", message: `${label(i)} ${side}팀: 남자 복식인데 남자가 아닌 선수가 있어요.` });
      if (m.type === "women" && g.some((x) => x !== "F"))
        warnings.push({ level: "error", message: `${label(i)} ${side}팀: 여자 복식인데 여자가 아닌 선수가 있어요.` });
      if (m.type === "mixed" && !(g.includes("M") && g.includes("F")))
        warnings.push({ level: "error", message: `${label(i)} ${side}팀: 혼합 복식은 남1·여1이어야 해요.` });
    };
    check(m.teamA, "A");
    check(m.teamB, "B");
    for (const team of [m.teamA, m.teamB]) {
      const key = pairKey(team[0], team[1]);
      pairs.set(key, (pairs.get(key) ?? 0) + 1);
    }
    if (rules.teamMatch) {
      const t = (n: string) => byName.get(n)?.team?.trim() ?? "";
      if (t(m.teamA[0]) !== t(m.teamA[1]) || t(m.teamB[0]) !== t(m.teamB[1]))
        warnings.push({ level: "warn", message: `${label(i)}: 팀 대항 규칙인데 짝의 소속이 달라요.` });
      else if (t(m.teamA[0]) === t(m.teamB[0]))
        warnings.push({ level: "warn", message: `${label(i)}: 팀 대항 규칙인데 같은 소속끼리 붙어요.` });
    }
  });

  if (rules.noRepeatPair) {
    for (const [key, count] of pairs) {
      if (count > 1) warnings.push({ level: "warn", message: `${key.replace("|", " · ")} 짝이 ${count}번 나와요.` });
    }
  }

  for (const group of appearanceGroups(players, rules.teamMatch)) {
    const counts = group.players.map((p) => apps.get(p.name) ?? 0);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    if (min === 0) {
      const names = group.players.filter((p) => (apps.get(p.name) ?? 0) === 0).map((p) => p.name);
      warnings.push({ level: "error", message: `${names.join(", ")} 님은 한 경기도 없어요.` });
    }
    if (rules.balanced && max - min > 1) {
      warnings.push({ level: "warn", message: `${group.label} 출전 횟수가 ${min}~${max}회로 차이가 나요.` });
    }
  }

  if (rules.maxRest !== null) {
    const restViolations = countRestViolations(players, matches, rounds, rules.maxRest);
    if (restViolations > 0) {
      warnings.push({ level: "warn", message: `연속 ${rules.maxRest}묶음 넘게 쉬는 경우가 ${restViolations}번 있어요.` });
    }
  }

  if (rules.noBackToBack) {
    let count = 0;
    const lastRound = new Map<string, number>();
    matches.forEach((m, i) => {
      const round = Math.floor(i / step) + 1;
      for (const n of [...m.teamA, ...m.teamB]) {
        if (lastRound.get(n) === round - 1) count += 1;
        lastRound.set(n, round);
      }
    });
    if (count > 0) warnings.push({ level: "warn", message: `연속 출전이 ${count}번 있어요.` });
  }

  return warnings;
}


// === 순서 변경 추천 ===
// "연달아 있어요" 같은 순서 경고를 줄이는 두 경기 맞바꾸기를 찾는다. (잠긴 경기는 건드리지 않는다)
export type SwapSuggestion = {
  from: number; // 위치(0부터)
  to: number;
  message: string; // 예) "11번을 13번과 바꾸면 경고 2개 → 0개"
};

function orderWarningCount(players: Player[], matches: Match[], courts: number, rules: RuleSettings): number {
  // 순서와 관련 있는 경고만 센다 (연달아 / 연속 휴식 / 연속 출전)
  return validateBracket(players, matches, courts, rules).filter(
    (w) => w.message.includes("연달아") || w.message.includes("연속"),
  ).length;
}

export function suggestSwaps(
  players: Player[],
  matches: Match[],
  courts: number,
  rules: RuleSettings,
  locked: Set<number> = new Set(), // 이미 시작·완료된 경기 번호(no)
  limit = 3,
): SwapSuggestion[] {
  const base = orderWarningCount(players, matches, courts, rules);
  if (base === 0) return [];
  const candidates: (SwapSuggestion & { after: number })[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    if (locked.has(matches[i].no)) continue;
    for (let j = i + 1; j < matches.length; j += 1) {
      if (locked.has(matches[j].no)) continue;
      const next = [...matches];
      [next[i], next[j]] = [next[j], next[i]];
      const after = orderWarningCount(players, next, courts, rules);
      if (after < base) {
        candidates.push({
          from: i,
          to: j,
          after,
          message: `${i + 1}번을 ${j + 1}번과 바꾸면 순서 경고 ${base}개 → ${after}개`,
        });
      }
    }
  }
  candidates.sort((a, b) => a.after - b.after || Math.abs(a.from - a.to) - Math.abs(b.from - b.to));
  return candidates.slice(0, limit).map(({ from, to, message }) => ({ from, to, message }));
}
