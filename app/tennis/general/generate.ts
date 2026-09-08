// 일반 대회 대진 만들기 (순수 함수).
// 여기서 만든 경기 번호(no)는 점수(tennis_scores.match_no)와 묶이므로 만든 뒤에는 절대 바뀌면 안 된다.
// 번호 구역: 리그·조별 = 1번부터, 조별 대회의 결선 = 1001번부터.
import { courtLetters } from "../timeline";
import type {
  GeneralGroup,
  GeneralMatch,
  GeneralSettings,
  GeneralSlot,
  GeneralTeam,
} from "./types";
import { GROUP_IDS } from "./types";

export const KO_START_NO = 1001; // 조별 대회의 결선 경기 번호 시작

const BYE = "__bye__";

// === 1. 서클 방식 풀리그 ===
// 한 자리를 고정하고 나머지를 한 칸씩 돌리면 모든 팀이 서로 한 번씩 만난다.
// 팀이 홀수면 가상의 "쉬는 자리"를 하나 넣어 그 자리와 만난 팀이 그 라운드를 쉰다.
export function roundRobin(ids: string[]): [string, string][][] {
  const list = [...ids];
  if (list.length < 2) return [];
  if (list.length % 2 === 1) list.push(BYE);
  const n = list.length;
  let arr = list;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const x = arr[i];
      const y = arr[n - 1 - i];
      if (x === BYE || y === BYE) continue; // 이 팀은 이번 라운드 휴식
      // A/B 자리를 라운드마다 뒤집어 서브 순서를 고르게 한다
      pairs.push(r % 2 === 0 ? [x, y] : [y, x]);
    }
    rounds.push(pairs);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return rounds;
}

// === 2. 표준 브래킷 자리 순서 ===
// seedOrder(8) === [1, 8, 4, 5, 2, 7, 3, 6] — 1번 시드와 2번 시드는 결승에서만 만난다
export function seedOrder(size: number): number[] {
  let arr = [1];
  while (arr.length < size) {
    const m = arr.length * 2 + 1;
    arr = arr.flatMap((s) => [s, m - s]);
  }
  return arr;
}

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

// 남은 자리 수 → 라운드 이름
export function roundLabelOf(slots: number): string {
  if (slots <= 2) return "결승";
  if (slots === 4) return "4강";
  return `${slots}강`;
}

// === 3. 브래킷 만들기 (부전승 = 빈자리) ===
// entries는 1라운드 자리 목록이며 길이가 2의 거듭제곱, 모자란 자리는 { kind: "bye" }다.
export function buildBracket(
  entries: GeneralSlot[],
  startNo: number,
  thirdPlace: boolean,
): GeneralMatch[] {
  let slots = entries;
  let no = startNo;
  let round = 1;
  const out: GeneralMatch[] = [];
  let lastRoundNos: number[] = [];

  while (slots.length > 1) {
    const next: GeneralSlot[] = [];
    const thisRoundNos: number[] = [];
    const label = roundLabelOf(slots.length);
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i];
      const b = slots[i + 1] ?? { kind: "bye" as const };
      if (a.kind === "bye" && b.kind === "bye") {
        next.push({ kind: "bye" });
        continue;
      }
      if (a.kind === "bye") {
        next.push(b); // b가 부전승으로 다음 라운드 직행
        continue;
      }
      if (b.kind === "bye") {
        next.push(a);
        continue;
      }
      out.push({ no, stage: "ko", round, label, block: 0, court: "A", a, b });
      next.push({ kind: "winner", of: no });
      thisRoundNos.push(no);
      no += 1;
    }
    if (thisRoundNos.length === 2) lastRoundNos = thisRoundNos; // 준결승 후보를 기억
    slots = next;
    round += 1;
  }

  if (thirdPlace && lastRoundNos.length === 2) {
    out.push({
      no,
      stage: "ko",
      round,
      label: "3-4위전",
      block: 0,
      court: "A",
      a: { kind: "loser", of: lastRoundNos[0] },
      b: { kind: "loser", of: lastRoundNos[1] },
    });
  }
  return out;
}

// === 4. 조 배정 (뱀 시드) ===
// 8팀 · 2조면 A조 = 시드 1·4·5·8, B조 = 시드 2·3·6·7. 전력이 고르게 나뉜다.
export function groupCountOf(teamCount: number, settings: GeneralSettings): number {
  const raw =
    settings.groupBy === "count"
      ? settings.groupCount
      : Math.ceil(teamCount / Math.max(2, settings.groupSize));
  return Math.max(2, Math.min(GROUP_IDS.length, Math.min(raw, Math.floor(teamCount / 2))));
}

export function assignGroups(teams: GeneralTeam[], settings: GeneralSettings): GeneralGroup[] {
  const count = groupCountOf(teams.length, settings);
  const groups: GeneralGroup[] = Array.from({ length: count }, (_, i) => ({
    id: GROUP_IDS[i],
    label: `${GROUP_IDS[i]}조`,
    teamIds: [],
  }));
  teams.forEach((team, i) => {
    const row = Math.floor(i / count);
    const col = i % count;
    const g = row % 2 === 0 ? col : count - 1 - col; // 지그재그
    groups[g].teamIds.push(team.id);
  });
  return groups;
}

// === 5. 조별 → 결선 (엇갈려 배치) ===
// A조 1위 vs B조 2위 / B조 1위 vs A조 2위. 같은 조에서 온 두 팀이 결승 전에 다시 만나지 않게 한다.
export function crossSeedPairs(groups: GeneralGroup[], advance: number): GeneralSlot[][] {
  const rank = (g: GeneralGroup, r: number): GeneralSlot => ({
    kind: "groupRank",
    group: g.id,
    rank: r,
  });
  const pairs: GeneralSlot[][] = [];
  for (let i = 0; i < groups.length; i += 2) {
    const A = groups[i];
    const B = groups[i + 1];
    if (!B) {
      // 조 개수가 홀수면 마지막 조에서 올라온 팀은 부전승으로 다음 라운드에 간다
      for (let r = 1; r <= advance; r++) pairs.push([rank(A, r), { kind: "bye" }]);
      break;
    }
    if (advance === 1) {
      pairs.push([rank(A, 1), rank(B, 1)]);
      continue;
    }
    pairs.push([rank(A, 1), rank(B, 2)]);
    pairs.push([rank(B, 1), rank(A, 2)]);
  }
  return pairs;
}

// 짝 목록 → 1라운드 자리 목록. 짝 번호에 다시 seedOrder를 적용해 부전승끼리 반대편에 놓는다.
export function pairsToEntries(pairs: GeneralSlot[][]): GeneralSlot[] {
  const size = nextPowerOfTwo(Math.max(1, pairs.length));
  const bye: GeneralSlot = { kind: "bye" };
  const arranged = seedOrder(size).map((s) => pairs[s - 1] ?? [bye, bye]);
  return arranged.flat();
}

export function buildKnockoutFromGroups(
  groups: GeneralGroup[],
  settings: GeneralSettings,
  startNo = KO_START_NO,
): GeneralMatch[] {
  const pairs = crossSeedPairs(groups, settings.advancePerGroup);
  return buildBracket(pairsToEntries(pairs), startNo, settings.thirdPlace);
}

// === 6. 코트·시간 배정 (블록) ===
// 한 블록 = "같은 시간대에 동시에 돌리는 경기 묶음". 한 팀은 한 블록에 한 번만 뛴다.
// 앞에서부터 빈자리가 있는 가장 이른 블록을 찾는다. 결선은 팀이 미정이라 앞 경기 순서만으로 갈린다.
type BlockState = { teams: Set<string>; count: number };

function teamIdsOf(match: GeneralMatch): string[] {
  return [match.a, match.b]
    .filter((s): s is { kind: "team"; teamId: string } => s.kind === "team")
    .map((s) => s.teamId);
}

export function assignBlocks(
  matches: GeneralMatch[],
  courts: number,
  placed: GeneralMatch[] = [], // 이미 블록이 정해진 경기 (조별 뒤에 결선을 붙일 때)
): void {
  const letters = courtLetters(courts);
  const lanes = letters.length;
  const blocks: BlockState[] = [];
  const blockOf = new Map<number, number>(); // 경기 번호 → 블록 index(0부터)
  const groupLast = new Map<string, number>(); // 조 → 그 조 마지막 경기의 블록 index

  const touch = (k: number): BlockState => {
    while (blocks.length <= k) blocks.push({ teams: new Set<string>(), count: 0 });
    return blocks[k];
  };

  for (const m of placed) {
    const k = Math.max(0, m.block - 1);
    const bl = touch(k);
    bl.count += 1;
    for (const id of teamIdsOf(m)) bl.teams.add(id);
    blockOf.set(m.no, k);
    if (m.groupId) groupLast.set(m.groupId, Math.max(groupLast.get(m.groupId) ?? 0, k));
  }

  const minBlockFor = (m: GeneralMatch): number => {
    let min = 0;
    for (const slot of [m.a, m.b]) {
      if (slot.kind === "winner" || slot.kind === "loser") {
        const b = blockOf.get(slot.of);
        if (b !== undefined) min = Math.max(min, b + 1);
      } else if (slot.kind === "groupRank") {
        const b = groupLast.get(slot.group);
        if (b !== undefined) min = Math.max(min, b + 1);
      }
    }
    return min;
  };

  for (const m of matches) {
    const need = teamIdsOf(m);
    let k = minBlockFor(m);
    for (;;) {
      const bl = touch(k);
      if (bl.count < lanes && need.every((t) => !bl.teams.has(t))) {
        need.forEach((t) => bl.teams.add(t));
        bl.count += 1;
        break;
      }
      k += 1;
    }
    m.block = k + 1; // 1부터
    m.court = letters[Math.min(blocks[k].count - 1, lanes - 1)];
    blockOf.set(m.no, k);
    if (m.groupId) groupLast.set(m.groupId, Math.max(groupLast.get(m.groupId) ?? 0, k));
  }
}

// === 7. 대회 하나의 대진 전체 ===
export type GeneratedSchedule = { matches: GeneralMatch[]; groups: GeneralGroup[] };

export function buildGeneralSchedule(
  teams: GeneralTeam[],
  settings: GeneralSettings,
  courts: number,
): GeneratedSchedule {
  const teamSlot = (id: string): GeneralSlot => ({ kind: "team", teamId: id });

  if (settings.format === "knockout") {
    const size = nextPowerOfTwo(teams.length);
    const entries: GeneralSlot[] = seedOrder(size).map((s) =>
      s <= teams.length ? teamSlot(teams[s - 1].id) : { kind: "bye" },
    );
    const matches = buildBracket(entries, 1, settings.thirdPlace);
    assignBlocks(matches, courts);
    return { matches, groups: [] };
  }

  if (settings.format === "league") {
    const rounds = roundRobin(teams.map((t) => t.id));
    const matches: GeneralMatch[] = [];
    let no = 1;
    rounds.forEach((pairs, i) => {
      for (const [x, y] of pairs) {
        matches.push({
          no: no++,
          stage: "league",
          round: i + 1,
          label: `${i + 1}라운드`,
          block: 0,
          court: "A",
          a: teamSlot(x),
          b: teamSlot(y),
        });
      }
    });
    assignBlocks(matches, courts);
    return { matches, groups: [] };
  }

  // groups: 조를 나누고, 각 조가 자기 조 안에서 풀리그를 돈다.
  // 경기 번호는 라운드 순서(1라운드 모든 조 → 2라운드 …)로 매겨 번호가 곧 진행 순서가 되게 한다.
  const groups = assignGroups(teams, settings);
  const perGroup = groups.map((g) => roundRobin(g.teamIds));
  const maxRounds = perGroup.reduce((m, rounds) => Math.max(m, rounds.length), 0);
  const matches: GeneralMatch[] = [];
  let no = 1;
  for (let r = 0; r < maxRounds; r++) {
    groups.forEach((g, gi) => {
      const pairs = perGroup[gi][r] ?? [];
      for (const [x, y] of pairs) {
        matches.push({
          no: no++,
          stage: "group",
          round: r + 1,
          groupId: g.id,
          label: `${g.label} ${r + 1}라운드`,
          block: 0,
          court: "A",
          a: teamSlot(x),
          b: teamSlot(y),
        });
      }
    });
  }
  assignBlocks(matches, courts);
  return { matches, groups };
}

// 만들기 폼의 미리보기용: 실제로 만들지 않고 경기 수·타임 수만 센다
export type SchedulePreview = {
  total: number;
  groupMatches: number;
  koMatches: number;
  blocks: number;
  groupCount: number;
  groupSizes: number[];
};

export function previewSchedule(
  teamCount: number,
  settings: GeneralSettings,
  courts: number,
): SchedulePreview {
  const teams: GeneralTeam[] = Array.from({ length: teamCount }, (_, i) => ({
    id: `t${i + 1}`,
    seed: i + 1,
    name: `${i + 1}팀`,
    players: [],
  }));
  const { matches, groups } = buildGeneralSchedule(teams, settings, courts);
  let koMatches: GeneralMatch[] = [];
  if (settings.format === "groups" && groups.length > 0) {
    koMatches = buildKnockoutFromGroups(groups, settings);
    assignBlocks(koMatches, courts, matches);
  }
  const all = [...matches, ...koMatches];
  return {
    total: all.length,
    groupMatches: matches.length,
    koMatches: koMatches.length,
    blocks: all.reduce((m, x) => Math.max(m, x.block), 0),
    groupCount: groups.length,
    groupSizes: groups.map((g) => g.teamIds.length),
  };
}
