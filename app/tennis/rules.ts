// 대진표 규칙 목록. 만들 때 켜고 끄고, 만든 뒤엔 배지로 보여준다.
// 생성기(generate.ts)는 켜진 규칙만 벌점으로 세고, 점검(validateBracket)도 켜진 규칙만 경고한다.
//
// 규칙은 두 층이다.
//  1) 빠른 층 — 칩으로 켜고 끄는 6가지 (balanced ~ teamMatch). 예전 저장본에도 이것만 들어 있다.
//  2) 세부 요건 층 — 아래 "세부 요건" 항목들. 안 쓰면 전부 꺼진 상태(=예전과 똑같이 동작)라
//     예전에 저장한 rules JSON을 그대로 읽어도 문제가 없다.
import type { MatchType, Player } from "./types";

export type RuleId =
  | "balanced" // 전원 고르게 출전 (같은 성별 안에서 횟수 차이 1 이하)
  | "noRepeatPair" // 같은 짝 두 번 없음
  | "maxRest" // 연속 휴식 최대 N묶음
  | "balancedYears" // 양 팀 구력 합 비슷하게
  | "noBackToBack" // 같은 사람 연속 출전 없음 (한 묶음은 쉬고 나오기)
  | "teamMatch"; // 팀 대항: 같은 소속끼리 짝, 다른 소속과 대결

// 종목(남복/여복/혼복) 수를 자동으로 정할지, 사람이 직접 정할지
export type SplitMode = "auto" | "manual";

// 묶음마다 어떤 종목을 넣을지의 순서
export type RoundOrder =
  | "sameFirst" // 같은 성별(남복·여복) 먼저, 혼복은 뒤 — 기본
  | "mixedFirst" // 혼복 먼저, 같은 성별은 뒤
  | "alternate" // 섞어서 번갈아
  | "custom"; // 묶음마다 직접 고름

// 두 사람 사이의 요건. 이름 두 개를 [작은 쪽, 큰 쪽] 순서로 담는다
export type PairRule = [string, string];

// 사람마다 정하는 출전 횟수 제한. 비워 두면 제한 없음
export type PlayerLimit = { max?: number; min?: number };

export type RuleSettings = {
  balanced: boolean;
  noRepeatPair: boolean;
  maxRest: number | null; // null이면 규칙 끔
  balancedYears: boolean;
  noBackToBack: boolean;
  teamMatch: boolean;

  // === 세부 요건 (안 쓰면 전부 꺼짐) ===
  splitMode: SplitMode;
  roundOrder: RoundOrder;
  customOrder: MatchType[][] | null; // roundOrder가 "custom"일 때만. [묶음][코트]
  appearanceCap: number | null; // 전원 출전 상한 (null이면 없음)
  playerLimits: Record<string, PlayerLimit>; // 사람별 상한/하한
  restRounds: Record<string, number[]>; // 사람별 "이 묶음은 무조건 쉼" 목록 (1부터)
  mustPair: PairRule[]; // 꼭 같이 짝
  avoidPair: PairRule[]; // 같은 짝 금지
  avoidOpponent: PairRule[]; // 같은 경기에서 상대로 만나지 않기
  yearsTolerance: number | null; // 구력 균형에서 봐주는 차이(년). null이면 예전처럼 차이만큼 벌점
};

// 세부 요건의 "안 쓰는 상태" — 예전 저장본을 읽을 때도 이 값이 채워진다
export const EMPTY_DETAIL = {
  splitMode: "auto" as SplitMode,
  roundOrder: "sameFirst" as RoundOrder,
  customOrder: null,
  appearanceCap: null,
  playerLimits: {},
  restRounds: {},
  mustPair: [],
  avoidPair: [],
  avoidOpponent: [],
  yearsTolerance: null,
} satisfies Pick<
  RuleSettings,
  | "splitMode"
  | "roundOrder"
  | "customOrder"
  | "appearanceCap"
  | "playerLimits"
  | "restRounds"
  | "mustPair"
  | "avoidPair"
  | "avoidOpponent"
  | "yearsTolerance"
>;

// 기본값: PDF 대진표(한화 교류전)가 지킨 규칙 그대로
export const DEFAULT_RULES: RuleSettings = {
  balanced: true,
  noRepeatPair: true,
  maxRest: 3,
  balancedYears: true,
  noBackToBack: false,
  teamMatch: false,
  ...EMPTY_DETAIL,
};

export type RuleInfo = {
  id: RuleId;
  label: string; // 배지·칩에 쓰는 짧은 이름
  description: string; // 12살도 알아듣게
};

export const RULE_INFO: RuleInfo[] = [
  { id: "balanced", label: "전원 고른 출전", description: "같은 성별끼리는 출전 횟수 차이가 1회를 넘지 않게 해요." },
  { id: "noRepeatPair", label: "짝 중복 없음", description: "같은 두 사람이 두 번 짝이 되지 않아요." },
  { id: "maxRest", label: "연속 휴식 제한", description: "한 사람이 너무 오래 쉬지 않게, 연속으로 쉬는 묶음 수를 제한해요." },
  { id: "balancedYears", label: "구력 균형", description: "양 팀 구력(년)을 더한 값이 비슷해지도록 짝을 맞춰요." },
  { id: "noBackToBack", label: "연속 출전 없음", description: "한 경기 뛰면 다음 묶음은 반드시 쉬어요. 인원이 적으면 못 지킬 수 있어요." },
  { id: "teamMatch", label: "팀 대항", description: "같은 소속끼리 짝이 되고, 다른 소속과 붙어요. 선수 명단에 소속이 있어야 해요." },
];

// 항상 지키는 규칙(끌 수 없음) — 배지에만 보여준다
export const FIXED_RULES: { label: string; description: string }[] = [
  { label: "성별 규칙", description: "남자 복식은 남자 4명, 여자 복식은 여자 4명, 혼합 복식은 팀마다 남1·여1이에요." },
  { label: "동시 출전 없음", description: "같은 사람이 같은 시간에 두 코트에서 뛰지 않아요." },
];

export const ROUND_ORDER_LABEL: Record<RoundOrder, string> = {
  sameFirst: "같은 성별 먼저",
  mixedFirst: "혼합 복식 먼저",
  alternate: "섞어서",
  custom: "직접 정하기",
};

export const ROUND_ORDER_HINT: Record<RoundOrder, string> = {
  sameFirst: "남자·여자 복식을 앞에 몰고 혼합 복식을 뒤로 보내요. (지금까지의 기본)",
  mixedFirst: "혼합 복식을 먼저 해서 처음부터 섞여 놀아요.",
  alternate: "남복·여복·혼복을 번갈아 넣어 골고루 섞어요.",
  custom: "묶음마다 어떤 종목을 할지 직접 골라요.",
};

export const PAIR_RELATION_LABEL = {
  mustPair: "꼭 같이 짝",
  avoidPair: "짝 금지",
  avoidOpponent: "상대 금지",
} as const;

export type PairRelation = keyof typeof PAIR_RELATION_LABEL;

export function isRuleOn(rules: RuleSettings, id: RuleId): boolean {
  if (id === "maxRest") return rules.maxRest !== null;
  return rules[id];
}

// === 세부 요건 읽기 도우미 (생성기·화면 공용) ===

export function normPair(a: string, b: string): PairRule {
  return a <= b ? [a, b] : [b, a];
}

export function pairListHas(list: PairRule[], a: string, b: string): boolean {
  const [x, y] = normPair(a, b);
  return list.some(([p, q]) => p === x && q === y);
}

// 이 사람과 "꼭 같이 짝"인 사람들
export function mustPartners(rules: RuleSettings, name: string): string[] {
  const out: string[] = [];
  for (const [a, b] of rules.mustPair) {
    if (a === name) out.push(b);
    else if (b === name) out.push(a);
  }
  return out;
}

// 이 사람의 출전 상한 (사람별 설정 > 전원 상한). 없으면 null
export function playerMax(rules: RuleSettings, name: string): number | null {
  const own = rules.playerLimits[name]?.max;
  if (typeof own === "number") return own;
  return rules.appearanceCap;
}

// 이 사람의 출전 하한. 없으면 0
export function playerMin(rules: RuleSettings, name: string): number {
  const own = rules.playerLimits[name]?.min;
  return typeof own === "number" ? own : 0;
}

// 이 사람이 이 묶음(1부터)에 무조건 쉬는지
export function restsAt(rules: RuleSettings, name: string, round: number): boolean {
  return (rules.restRounds[name] ?? []).includes(round);
}

// 세부 요건을 하나라도 쓰고 있는지 (배지·안내에 쓴다)
export function hasDetailRules(rules: RuleSettings): boolean {
  return (
    rules.splitMode === "manual" ||
    rules.roundOrder !== "sameFirst" ||
    rules.appearanceCap !== null ||
    Object.keys(rules.playerLimits).length > 0 ||
    Object.keys(rules.restRounds).length > 0 ||
    rules.mustPair.length > 0 ||
    rules.avoidPair.length > 0 ||
    rules.avoidOpponent.length > 0 ||
    rules.yearsTolerance !== null
  );
}

// 규칙 배지에 쓸 짧은 문구 목록 (켜진 것만)
export function ruleBadges(rules: RuleSettings): string[] {
  const out: string[] = [];
  for (const info of RULE_INFO) {
    if (!isRuleOn(rules, info.id)) continue;
    if (info.id === "maxRest") {
      out.push(`연속 휴식 ≤${rules.maxRest}`);
      continue;
    }
    if (info.id === "balancedYears" && rules.yearsTolerance !== null) {
      out.push(`구력 차 ≤${rules.yearsTolerance}년`);
      continue;
    }
    out.push(info.label);
  }

  if (rules.splitMode === "manual") out.push("종목 직접 지정");
  if (rules.roundOrder !== "sameFirst") out.push(`종목 순서 ${ROUND_ORDER_LABEL[rules.roundOrder]}`);
  if (rules.appearanceCap !== null) out.push(`출전 상한 ${rules.appearanceCap}`);

  const limitCount = Object.keys(rules.playerLimits).length;
  if (limitCount > 0) out.push(`출전 조정 ${limitCount}명`);

  const restCount = Object.values(rules.restRounds).filter((v) => v.length > 0).length;
  if (restCount > 0) out.push(`쉬는 묶음 ${restCount}명`);

  const pairCount = rules.mustPair.length + rules.avoidPair.length + rules.avoidOpponent.length;
  if (pairCount > 0) out.push(`짝 요건 ${pairCount}`);

  return out;
}

// 팀 대항 규칙을 켤 수 있는지: 소속이 2개 이상이고 모두 소속이 있어야 한다
export function teamMatchAvailable(players: Player[]): { ok: boolean; reason: string } {
  const teams = new Set(players.map((p) => p.team?.trim()).filter(Boolean));
  if (players.some((p) => !p.team?.trim())) return { ok: false, reason: "소속이 비어 있는 선수가 있어요." };
  if (teams.size < 2) return { ok: false, reason: "소속이 2개 이상이어야 해요." };
  return { ok: true, reason: "" };
}

// === 저장된 값 읽기 ===

function num(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  return n >= min && n <= max ? n : null;
}

function readPairList(value: unknown): PairRule[] {
  if (!Array.isArray(value)) return [];
  const out: PairRule[] = [];
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const [a, b] = item;
    if (typeof a !== "string" || typeof b !== "string") continue;
    const an = a.trim();
    const bn = b.trim();
    if (!an || !bn || an === bn) continue;
    if (pairListHas(out, an, bn)) continue;
    out.push(normPair(an, bn));
  }
  return out;
}

function readPlayerLimits(value: unknown): Record<string, PlayerLimit> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, PlayerLimit> = {};
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as { max?: unknown; min?: unknown };
    const max = num(item.max, 0, 99);
    const min = num(item.min, 0, 99);
    const limit: PlayerLimit = {};
    if (max !== null) limit.max = max;
    if (min !== null) limit.min = min;
    if (limit.max !== undefined || limit.min !== undefined) out[name] = limit;
  }
  return out;
}

function readRestRounds(value: unknown): Record<string, number[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number[]> = {};
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(raw)) continue;
    const rounds = [...new Set(raw.map((n) => num(n, 1, 99)).filter((n): n is number => n !== null))].sort(
      (a, b) => a - b,
    );
    if (rounds.length > 0) out[name] = rounds;
  }
  return out;
}

function readCustomOrder(value: unknown): MatchType[][] | null {
  if (!Array.isArray(value)) return null;
  const out: MatchType[][] = [];
  for (const row of value) {
    if (!Array.isArray(row)) return null;
    const types: MatchType[] = [];
    for (const t of row) {
      if (t !== "men" && t !== "women" && t !== "mixed") return null;
      types.push(t);
    }
    out.push(types);
  }
  return out.length > 0 ? out : null;
}

// 저장된 값이 없거나 오래된 형식이어도 안전하게 읽는다.
// 세부 요건 키가 없으면 "안 씀"이 되어 예전 대진표와 똑같이 동작한다.
export function normalizeRules(raw: unknown): RuleSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const roundOrder = r.roundOrder;
  const customOrder = readCustomOrder(r.customOrder);
  return {
    balanced: typeof r.balanced === "boolean" ? r.balanced : DEFAULT_RULES.balanced,
    noRepeatPair: typeof r.noRepeatPair === "boolean" ? r.noRepeatPair : DEFAULT_RULES.noRepeatPair,
    maxRest:
      r.maxRest === null
        ? null
        : typeof r.maxRest === "number" && r.maxRest >= 1
          ? Math.floor(r.maxRest)
          : DEFAULT_RULES.maxRest,
    balancedYears: typeof r.balancedYears === "boolean" ? r.balancedYears : DEFAULT_RULES.balancedYears,
    noBackToBack: typeof r.noBackToBack === "boolean" ? r.noBackToBack : DEFAULT_RULES.noBackToBack,
    teamMatch: typeof r.teamMatch === "boolean" ? r.teamMatch : DEFAULT_RULES.teamMatch,

    splitMode: r.splitMode === "manual" ? "manual" : "auto",
    roundOrder:
      roundOrder === "mixedFirst" || roundOrder === "alternate" || (roundOrder === "custom" && customOrder)
        ? (roundOrder as RoundOrder)
        : "sameFirst",
    customOrder,
    appearanceCap: num(r.appearanceCap, 1, 99),
    playerLimits: readPlayerLimits(r.playerLimits),
    restRounds: readRestRounds(r.restRounds),
    mustPair: readPairList(r.mustPair),
    avoidPair: readPairList(r.avoidPair),
    avoidOpponent: readPairList(r.avoidOpponent),
    yearsTolerance: num(r.yearsTolerance, 0, 60),
  };
}
