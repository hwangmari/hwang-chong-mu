// 대진표 규칙 목록. 만들 때 켜고 끄고, 만든 뒤엔 배지로 보여준다.
// 생성기(generate.ts)는 켜진 규칙만 벌점으로 세고, 점검(validateBracket)도 켜진 규칙만 경고한다.
import type { Player } from "./types";

export type RuleId =
  | "balanced" // 전원 고르게 출전 (같은 성별 안에서 횟수 차이 1 이하)
  | "noRepeatPair" // 같은 짝 두 번 없음
  | "maxRest" // 연속 휴식 최대 N묶음
  | "balancedYears" // 양 팀 구력 합 비슷하게
  | "noBackToBack" // 같은 사람 연속 출전 없음 (한 묶음은 쉬고 나오기)
  | "teamMatch"; // 팀 대항: 같은 소속끼리 짝, 다른 소속과 대결

export type RuleSettings = {
  balanced: boolean;
  noRepeatPair: boolean;
  maxRest: number | null; // null이면 규칙 끔
  balancedYears: boolean;
  noBackToBack: boolean;
  teamMatch: boolean;
};

// 기본값: PDF 대진표(한화 교류전)가 지킨 규칙 그대로
export const DEFAULT_RULES: RuleSettings = {
  balanced: true,
  noRepeatPair: true,
  maxRest: 3,
  balancedYears: true,
  noBackToBack: false,
  teamMatch: false,
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

export function isRuleOn(rules: RuleSettings, id: RuleId): boolean {
  if (id === "maxRest") return rules.maxRest !== null;
  return rules[id];
}

// 규칙 배지에 쓸 짧은 문구 목록 (켜진 것만)
export function ruleBadges(rules: RuleSettings): string[] {
  const out: string[] = [];
  for (const info of RULE_INFO) {
    if (!isRuleOn(rules, info.id)) continue;
    out.push(info.id === "maxRest" ? `연속 휴식 ≤${rules.maxRest}` : info.label);
  }
  return out;
}

// 팀 대항 규칙을 켤 수 있는지: 소속이 2개 이상이고 모두 소속이 있어야 한다
export function teamMatchAvailable(players: Player[]): { ok: boolean; reason: string } {
  const teams = new Set(players.map((p) => p.team?.trim()).filter(Boolean));
  if (players.some((p) => !p.team?.trim())) return { ok: false, reason: "소속이 비어 있는 선수가 있어요." };
  if (teams.size < 2) return { ok: false, reason: "소속이 2개 이상이어야 해요." };
  return { ok: true, reason: "" };
}

// 저장된 값이 없거나 오래된 형식이어도 안전하게 읽는다
export function normalizeRules(raw: unknown): RuleSettings {
  const r = (raw ?? {}) as Partial<Record<keyof RuleSettings, unknown>>;
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
  };
}
