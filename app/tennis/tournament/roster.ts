// 팀 토너먼트 참가자 명단(팀 배정 전 풀) 다루기.
// 텍스트 한 줄(또는 쉼표)에 한 명: `이름 [성별] [구력]` — 성별·구력은 나중에 채워도 된다.
// 예) "유태현 남 3", "김지혜 여 1.5년", "권혁" (이름만)
import { parsePlayerLine } from "../parsePlayers";
import { GENDER_LABEL, type Gender } from "../types";
import type { RosterPlayer } from "./types";

function cleanName(raw: string): string {
  return raw
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d{1,3}[.)]\s+/, "");
}

export function parseRosterText(text: string): RosterPlayer[] {
  const out: RosterPlayer[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\r\n,]+/)) {
    const line = parsePlayerLine(raw);
    if (!line) continue; // 빈 줄
    const entry: RosterPlayer = line.player
      ? {
          name: line.player.name,
          gender: line.player.gender,
          ...(line.player.years > 0 ? { years: line.player.years } : {}),
        }
      : { name: cleanName(raw) }; // 성별이 없으면 줄 전체가 이름
    if (!entry.name || seen.has(entry.name)) continue;
    seen.add(entry.name);
    out.push(entry);
  }
  return out;
}

// 저장된 명단 → 편집용 텍스트
export function rosterToText(roster: RosterPlayer[]): string {
  return roster
    .map((p) => [p.name, p.gender ? GENDER_LABEL[p.gender] : "", p.years !== undefined ? String(p.years) : ""].filter(Boolean).join(" "))
    .join("\n");
}

// 저장 공간에서 읽은 값 정리: 예전에 저장한 이름만 있는 배열(string[])도 받아들인다
export function normalizeRoster(raw: unknown): RosterPlayer[] {
  if (!Array.isArray(raw)) return [];
  const out: RosterPlayer[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim() });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.name !== "string" || !obj.name.trim()) continue;
    const entry: RosterPlayer = { name: obj.name.trim() };
    if (obj.gender === "M" || obj.gender === "F") entry.gender = obj.gender;
    if (typeof obj.years === "number" && Number.isFinite(obj.years) && obj.years >= 0) entry.years = obj.years;
    out.push(entry);
  }
  return out;
}

// 정렬: 남 → 여 → 성별 미입력. 같은 성별 안에서는 구력 많은 순, 같으면 가나다순
export type RosterGroupKey = Gender | "unknown";
const GROUP_ORDER: Record<RosterGroupKey, number> = { M: 0, F: 1, unknown: 2 };

export function rosterGroupKey(p: RosterPlayer): RosterGroupKey {
  return p.gender ?? "unknown";
}

export function sortRoster(roster: RosterPlayer[]): RosterPlayer[] {
  return [...roster].sort((a, b) => {
    const g = GROUP_ORDER[rosterGroupKey(a)] - GROUP_ORDER[rosterGroupKey(b)];
    if (g !== 0) return g;
    const y = (b.years ?? -1) - (a.years ?? -1);
    if (y !== 0) return y;
    return a.name.localeCompare(b.name, "ko");
  });
}

export type RosterGroup = { key: RosterGroupKey; label: string; players: RosterPlayer[] };

export const GROUP_LABEL: Record<RosterGroupKey, string> = { M: "남", F: "여", unknown: "성별 미입력" };

// 성별별로 묶어서(각 묶음 안은 sortRoster 순서) 돌려준다. 비어 있는 묶음은 뺀다
export function groupRoster(roster: RosterPlayer[]): RosterGroup[] {
  const sorted = sortRoster(roster);
  return (["M", "F", "unknown"] as RosterGroupKey[])
    .map((key) => ({ key, label: GROUP_LABEL[key], players: sorted.filter((p) => rosterGroupKey(p) === key) }))
    .filter((g) => g.players.length > 0);
}

// 화면에 보이는 한 사람: "유태현 3년" (구력 없으면 이름만)
export function rosterEntryLabel(p: RosterPlayer): string {
  return p.years !== undefined ? `${p.name} ${p.years}년` : p.name;
}

// "남 18 · 여 13 · 성별 미입력 1"
export function rosterSummary(roster: RosterPlayer[]): string {
  return groupRoster(roster)
    .map((g) => `${g.label} ${g.players.length}`)
    .join(" · ");
}
