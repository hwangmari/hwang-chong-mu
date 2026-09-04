// 대진표 자동 생성 (순수 함수).
// 항상 지키는 것: 성별 규칙(남복 남4·여복 여4·혼복 팀마다 남1여1), 같은 묶음(동시에 뛰는 코트들)에 같은 사람 없음.
// 켜고 끄는 규칙(rules.ts): 전원 고른 출전, 짝 중복 없음, 연속 휴식 제한, 구력 균형, 연속 출전 없음, 팀 대항.
// 방법: 우선순위(출전 적은 순 → 오래 쉰 순) + 약간의 무작위로 여러 번 만들어 벌점이 가장 낮은 안을 고른다.
import { roundLabel, roundTime } from "./format";
import {
  DEFAULT_RULES,
  mustPartners,
  pairListHas,
  playerMax,
  playerMin,
  restsAt,
  type RoundOrder,
  type RuleSettings,
} from "./rules";
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

// 고른 순서(rules.roundOrder)대로 종목 경기들을 한 줄로 늘어놓는다
export function orderedPool(split: Split, order: RoundOrder): MatchType[] {
  const men = Array<MatchType>(split.menMatches).fill("men");
  const women = Array<MatchType>(split.womenMatches).fill("women");
  const mixed = Array<MatchType>(split.mixedMatches).fill("mixed");
  const total = men.length + women.length + mixed.length;

  if (order === "mixedFirst") return [...mixed, ...men, ...women];
  if (order === "alternate") {
    // 남복 → 여복 → 혼복 순으로 하나씩 번갈아 꺼낸다 (없는 종목은 건너뛴다)
    const lists = [men, women, mixed];
    const out: MatchType[] = [];
    let i = 0;
    while (out.length < total) {
      const item = lists[i % lists.length].pop();
      if (item) out.push(item);
      i += 1;
    }
    return out;
  }
  return [...men, ...women, ...mixed]; // sameFirst (기본)
}

// 한 묶음에 들어간 종목들이 필요로 하는 남/여 인원
function needPlayers(types: MatchType[], gender: Gender): number {
  return types.reduce(
    (sum, t) => sum + (t === "mixed" ? 2 : (t === "men") === (gender === "M") ? 4 : 0),
    0,
  );
}

// 직접 짠 순서(custom)가 쓸 수 있는지 확인한다. 문제가 있으면 사람이 읽을 이유를 돌려준다
export function checkCustomOrder(
  customOrder: MatchType[][] | null,
  split: Split,
  courts: number,
  rounds: number,
  men: number,
  women: number,
): string {
  if (!customOrder) return "묶음마다 종목을 골라 주세요.";
  if (customOrder.length !== rounds) return `묶음이 ${rounds}개여야 하는데 ${customOrder.length}개예요.`;
  if (customOrder.some((types) => types.length > courts)) return `한 묶음에 코트 수(${courts})보다 많은 경기가 있어요.`;
  const flat = customOrder.flat();
  const count = (t: MatchType) => flat.filter((x) => x === t).length;
  if (
    count("men") !== split.menMatches ||
    count("women") !== split.womenMatches ||
    count("mixed") !== split.mixedMatches
  ) {
    return `종목 수가 맞지 않아요. 남복 ${count("men")}/${split.menMatches} · 여복 ${count("women")}/${split.womenMatches} · 혼복 ${count("mixed")}/${split.mixedMatches}`;
  }
  const bad = customOrder.findIndex(
    (types) => needPlayers(types, "M") > men || needPlayers(types, "F") > women,
  );
  if (bad >= 0) return `${bad + 1}번째 묶음은 남/여 인원이 모자라요.`;
  return "";
}

// 묶음(동시에 뛰는 코트들)마다 어떤 종목 경기가 들어가는지 배치
function planRoundTypes(
  split: Split,
  courts: number,
  rounds: number,
  men: number,
  women: number,
  rules: RuleSettings,
  rand: () => number,
): MatchType[][] | null {
  if (rules.roundOrder === "custom") {
    if (checkCustomOrder(rules.customOrder, split, courts, rounds, men, women)) return null;
    return rules.customOrder;
  }

  const pool = orderedPool(split, rules.roundOrder);
  // 총 경기 수가 코트 수로 나누어떨어지지 않으면 마지막 묶음은 경기가 적다
  if (pool.length > courts * rounds || pool.length <= courts * (rounds - 1)) return null;

  // 고른 순서 그대로 묶음에 넣어 본 다음, 남/여 인원이 모자란 묶음만 가까운 묶음과 맞바꿔 고친다.
  // (예: 여자가 7명뿐인데 여자 복식 두 경기가 한 묶음에 몰린 경우)
  const plan: MatchType[][] = [];
  for (let r = 0; r < rounds; r += 1) plan.push(pool.slice(r * courts, (r + 1) * courts));
  const fits = (types: MatchType[]) =>
    needPlayers(types, "M") <= men && needPlayers(types, "F") <= women;

  for (let pass = 0; pass < rounds * courts + 10; pass += 1) {
    const bad = plan.findIndex((types) => !fits(types));
    if (bad < 0) return plan;
    // 가까운 묶음부터 후보로 본다 — 순서를 최대한 덜 흐트러뜨리기 위해
    const nearby = plan
      .map((_, j) => j)
      .filter((j) => j !== bad)
      .sort((a, b) => Math.abs(a - bad) - Math.abs(b - bad));
    let swapped = false;
    for (let i = 0; i < plan[bad].length && !swapped; i += 1) {
      for (const j of nearby) {
        for (let k = 0; k < plan[j].length; k += 1) {
          if (plan[j][k] === plan[bad][i]) continue;
          const a = [...plan[bad]];
          const b = [...plan[j]];
          [a[i], b[k]] = [b[k], a[i]];
          if (!fits(a) || !fits(b)) continue;
          plan[bad] = a;
          plan[j] = b;
          swapped = true;
          break;
        }
        if (swapped) break;
      }
    }
    if (!swapped) break;
  }

  // 그래도 안 되면(인원이 빠듯한 경우) 순서를 섞어 가며 되는 배치를 찾는다
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const order = attempt === 0 ? pool : shuffle(pool, rand);
    const plan: MatchType[][] = [];
    for (let r = 0; r < rounds; r += 1) plan.push(order.slice(r * courts, (r + 1) * courts));
    const ok = plan.every((types) => needPlayers(types, "M") <= men && needPlayers(types, "F") <= women);
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
  hardBreaks: number; // 꼭 지켜야 할 세부 요건(고정 휴식·출전 상한)을 어쩔 수 없이 어긴 횟수
  byName: Map<string, Player>;
};

// "꼭 같이 짝"인 사람은 그 짝이 될 수 있는 종목에만 나온다.
// (남자 둘이면 남자 복식, 여자 둘이면 여자 복식, 남녀면 혼합 복식)
function mustPairFits(rules: RuleSettings, tracker: Tracker, name: string, type: MatchType): boolean {
  const partners = mustPartners(rules, name);
  if (partners.length === 0) return true;
  const me = tracker.byName.get(name);
  if (!me) return true;
  return partners.every((n) => {
    const other = tracker.byName.get(n);
    if (!other) return true; // 명단에 없는 이름은 무시한다
    if (type === "mixed") return me.gender !== other.gender;
    const gender: Gender = type === "men" ? "M" : "F";
    return me.gender === gender && other.gender === gender;
  });
}

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
  // 출전 하한을 아직 못 채운 사람은 앞으로 강하게 당긴다
  if (app < playerMin(rules, p.name)) priority -= 200;
  return priority;
}

// 이 묶음에서 뽑아도 되는 사람만 남긴다.
// 1) 고정 휴식(restRounds)인 사람은 뺀다. 2) 출전 상한을 다 채운 사람도 뺀다.
// 그렇게 하면 인원이 모자라는 경우에만 어쩔 수 없이 되돌리고, 그 횟수를 tracker에 세어 둔다.
function eligibleFor(
  candidates: Player[],
  count: number,
  round: number,
  tracker: Tracker,
  rules: RuleSettings,
  type: MatchType,
): Player[] {
  const fits = candidates.filter((p) => mustPairFits(rules, tracker, p.name, type));
  const pool = fits.length >= count ? fits : candidates;

  const awake = pool.filter((p) => !restsAt(rules, p.name, round));
  const base = awake.length >= count ? awake : pool;
  if (awake.length < count && pool.length >= count) tracker.hardBreaks += 1;

  const underCap = base.filter((p) => {
    const max = playerMax(rules, p.name);
    return max === null || (tracker.appearances.get(p.name) ?? 0) < max;
  });
  if (underCap.length >= count) return underCap;
  if (base.length >= count) tracker.hardBreaks += 1;
  return base;
}

function pickPlayers(
  candidates: Player[],
  count: number,
  round: number,
  tracker: Tracker,
  rules: RuleSettings,
  type: MatchType,
  rand: () => number,
): Player[] {
  return eligibleFor(candidates, count, round, tracker, rules, type)
    .map((p) => ({ p, priority: priorityOf(p, round, tracker, rules, rand) }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count)
    .map((s) => s.p);
}

// "꼭 같이 짝" 요건: 뽑힌 사람의 짝꿍이 아직 후보에 남아 있으면 반드시 함께 뽑는다.
// 짝꿍이 없는 사람 중 우선순위가 가장 낮은 사람을 빼고 그 자리에 짝꿍을 넣는다.
function withMustPartners(picked: Player[], pool: Player[], rules: RuleSettings): Player[] {
  if (rules.mustPair.length === 0) return picked;
  const result = [...picked];
  const has = (name: string) => result.some((p) => p?.name === name);

  for (const p of picked) {
    if (!p) continue;
    for (const partnerName of mustPartners(rules, p.name)) {
      if (has(partnerName)) continue;
      const partner = pool.find((q) => q.name === partnerName);
      if (!partner) continue;
      // 뒤에서부터(=우선순위가 낮은 쪽부터) 뺄 사람을 찾는다
      let dropIndex = -1;
      for (let i = result.length - 1; i >= 0; i -= 1) {
        const q = result[i];
        if (!q || q.name === p.name) continue;
        if (mustPartners(rules, q.name).some((n) => has(n))) continue; // 이미 짝이 맞은 사람은 건드리지 않는다
        dropIndex = i;
        break;
      }
      if (dropIndex < 0) continue;
      result[dropIndex] = partner;
    }
  }
  return result;
}

type Four = [Player, Player, Player, Player];
type Picked = { teams: Four; penalty: number };

function pairPenalty(four: Four, tracker: Tracker, rules: RuleSettings): number {
  const [a1, a2, b1, b2] = four;
  const repeated =
    (tracker.pairs.has(pairKey(a1.name, a2.name)) ? 1 : 0) +
    (tracker.pairs.has(pairKey(b1.name, b2.name)) ? 1 : 0);
  const diff = Math.abs(a1.years + a2.years - (b1.years + b2.years));

  // 구력 균형: 허용 차이를 정했으면 그 안은 0점, 넘으면 가파르게 벌점
  const years = !rules.balancedYears
    ? 0
    : rules.yearsTolerance === null
      ? diff
      : diff <= rules.yearsTolerance
        ? 0
        : (diff - rules.yearsTolerance) * 10;

  let extra = 0;
  // 짝 금지: 이 둘이 같은 팀이면 큰 벌점
  if (pairListHas(rules.avoidPair, a1.name, a2.name)) extra += 2000;
  if (pairListHas(rules.avoidPair, b1.name, b2.name)) extra += 2000;
  // 서로 마주 보는 네 조합 = 상대편이 되는 조합
  const facing: [Player, Player][] = [
    [a1, b1],
    [a1, b2],
    [a2, b1],
    [a2, b2],
  ];
  for (const [x, y] of facing) {
    if (pairListHas(rules.mustPair, x.name, y.name)) extra += 3000; // 꼭 같이 짝인데 갈라졌다
    if (pairListHas(rules.avoidOpponent, x.name, y.name)) extra += 2000;
  }

  return (rules.noRepeatPair ? repeated * 100 : 0) + years + extra;
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
      const [m] = pickPlayers(pool.filter((p) => p.gender === "M"), 1, round, tracker, rules, type, rand);
      const [f] = pickPlayers(pool.filter((p) => p.gender === "F"), 1, round, tracker, rules, type, rand);
      return m && f ? [m, f] : null;
    }
    const gender: Gender = type === "men" ? "M" : "F";
    const [a, b] = pickPlayers(pool.filter((p) => p.gender === gender), 2, round, tracker, rules, type, rand);
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
    hardBreaks: 0,
    byName: new Map(players.map((p) => [p.name, p])),
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
          const menFree = men.filter((p) => !used.has(p.name));
          const womenFree = women.filter((p) => !used.has(p.name));
          const [m1, m2] = pickPlayers(menFree, 2, round, tracker, rules, "mixed", rand);
          // 뽑힌 남자 선수의 "꼭 같이 짝"인 여자 선수가 있으면 먼저 자리를 잡아 준다
          const forced: Player[] = [];
          for (const m of [m1, m2]) {
            if (!m) continue;
            for (const name of mustPartners(rules, m.name)) {
              const f = womenFree.find((q) => q.name === name);
              if (f && !forced.some((x) => x.name === name)) forced.push(f);
            }
          }
          const head = forced.slice(0, 2);
          const tail = pickPlayers(
            womenFree.filter((p) => !head.some((f) => f.name === p.name)),
            2 - head.length,
            round,
            tracker,
            rules,
            "mixed",
            rand,
          );
          const [f1, f2] = [...head, ...tail];
          picked = bestPairing(
            [
              [m1, f1, m2, f2],
              [m1, f2, m2, f1],
            ],
            tracker,
            rules,
          );
        } else {
          const pool = (type === "men" ? men : women).filter((p) => !used.has(p.name));
          const [p1, p2, p3, p4] = withMustPartners(
            pickPlayers(pool, 4, round, tracker, rules, type, rand),
            pool.filter((p) => !restsAt(rules, p.name, round)),
            rules,
          );
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

  // 세부 요건: 출전 상한/하한을 못 지킨 만큼 벌점 (상한은 못 지키면 안 되는 쪽이라 더 크게)
  for (const p of players) {
    const app = tracker.appearances.get(p.name) ?? 0;
    const max = playerMax(rules, p.name);
    if (max !== null && app > max) penalty += (app - max) * 800;
    const min = playerMin(rules, p.name);
    if (app < min) penalty += (min - app) * 300;
  }
  penalty += tracker.hardBreaks * 500; // 고정 휴식·상한을 어쩔 수 없이 어긴 횟수

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

// 세부 요건 자체가 서로 어긋나 있으면 대진표를 짤 수 없다. 그런 경우를 미리 알려 준다
export function checkRuleRequirements(players: Player[], split: Split, rules: RuleSettings): string {
  const byName = new Map(players.map((p) => [p.name, p]));
  const partnerCount = new Map<string, number>();

  for (const [a, b] of rules.mustPair) {
    if (!byName.has(a) || !byName.has(b)) continue; // 명단에 없는 이름은 그냥 무시한다
    if (pairListHas(rules.avoidPair, a, b)) return `${a} · ${b}는 "꼭 같이 짝"과 "짝 금지"가 같이 걸려 있어요.`;
    partnerCount.set(a, (partnerCount.get(a) ?? 0) + 1);
    partnerCount.set(b, (partnerCount.get(b) ?? 0) + 1);
    const ga = byName.get(a)?.gender;
    const gb = byName.get(b)?.gender;
    if (ga !== gb && split.mixedMatches === 0)
      return `${a} · ${b}는 남녀라 혼합 복식에서만 짝이 될 수 있는데, 혼합 복식이 0경기예요.`;
    if (ga === gb && ga === "M" && split.menMatches === 0)
      return `${a} · ${b}는 둘 다 남자라 남자 복식에서만 짝이 될 수 있는데, 남자 복식이 0경기예요.`;
    if (ga === gb && ga === "F" && split.womenMatches === 0)
      return `${a} · ${b}는 둘 다 여자라 여자 복식에서만 짝이 될 수 있는데, 여자 복식이 0경기예요.`;
  }
  for (const [name, count] of partnerCount) {
    if (count > 1) return `${name} 님에게 "꼭 같이 짝"이 ${count}명 걸려 있어요. 한 명만 골라 주세요.`;
  }

  for (const p of players) {
    const max = playerMax(rules, p.name);
    const min = playerMin(rules, p.name);
    if (max !== null && min > max) return `${p.name} 님의 최소(${min})가 최대(${max})보다 커요.`;
  }
  return "";
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

  const requirementError = checkRuleRequirements(players, split, rules);
  if (requirementError) return { error: requirementError };

  if (rules.roundOrder === "custom") {
    const reason = checkCustomOrder(rules.customOrder, split, courts, rounds, men, women);
    if (reason) return { error: `직접 정한 종목 순서를 쓸 수 없어요. ${reason}` };
  }

  let seed = Date.now() % 100000;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const plan = planRoundTypes(split, courts, rounds, men, women, rules, rand);
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

  // === 세부 요건 점검 (설정한 것만) ===
  const roundOf = (i: number) => Math.floor(i / step) + 1;
  const inMatch = (m: Match, name: string) => m.teamA.includes(name) || m.teamB.includes(name);

  for (const [name, list] of Object.entries(rules.restRounds)) {
    const broken = [
      ...new Set(
        matches
          .map((m, i) => ({ m, round: roundOf(i) }))
          .filter(({ m, round }) => list.includes(round) && inMatch(m, name))
          .map(({ round }) => round),
      ),
    ];
    if (broken.length > 0) {
      warnings.push({
        level: "warn",
        message: `쉬는 묶음 요건: ${name} 님이 ${broken.join(", ")}번째 묶음에 들어가 있어요.`,
      });
    }
  }

  for (const p of players) {
    const count = apps.get(p.name) ?? 0;
    const max = playerMax(rules, p.name);
    if (max !== null && count > max) {
      warnings.push({ level: "warn", message: `출전 상한 요건: ${p.name} 님이 ${count}회 뛰어요 (상한 ${max}회).` });
    }
    const min = playerMin(rules, p.name);
    if (count < min) {
      warnings.push({ level: "warn", message: `출전 하한 요건: ${p.name} 님이 ${count}회뿐이에요 (최소 ${min}회).` });
    }
  }

  for (const [a, b] of rules.mustPair) {
    let apart = 0;
    let together = 0;
    for (const m of matches) {
      if (!inMatch(m, a) && !inMatch(m, b)) continue;
      const same =
        (m.teamA.includes(a) && m.teamA.includes(b)) || (m.teamB.includes(a) && m.teamB.includes(b));
      if (same) together += 1;
      else apart += 1;
    }
    if (apart > 0) {
      warnings.push({ level: "warn", message: `꼭 같이 짝 요건: ${a} · ${b}가 따로 뛴 경기가 ${apart}번 있어요.` });
    } else if (together === 0) {
      warnings.push({ level: "warn", message: `꼭 같이 짝 요건: ${a} · ${b}가 함께 뛰는 경기가 없어요.` });
    }
  }
  for (const [a, b] of rules.avoidPair) {
    const count = matches.filter(
      (m) => (m.teamA.includes(a) && m.teamA.includes(b)) || (m.teamB.includes(a) && m.teamB.includes(b)),
    ).length;
    if (count > 0) warnings.push({ level: "warn", message: `짝 금지 요건: ${a} · ${b}가 ${count}번 짝이 됐어요.` });
  }
  for (const [a, b] of rules.avoidOpponent) {
    const count = matches.filter(
      (m) => (m.teamA.includes(a) && m.teamB.includes(b)) || (m.teamB.includes(a) && m.teamA.includes(b)),
    ).length;
    if (count > 0) warnings.push({ level: "warn", message: `상대 금지 요건: ${a} · ${b}가 ${count}번 맞붙어요.` });
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
