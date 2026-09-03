// 코드에 든 토너먼트: 63OPEN (2026-10-31, 아식스테니스장). 팀·선수는 화면에서 채운다.
import { DEFAULT_RULES } from "../rules";
import { PLAYERS_PER_TEAM, TEAM_COUNT } from "./template";
import type { TeamEntry, TournamentEvent } from "./types";

export function placeholderTeams(): TeamEntry[] {
  return Array.from({ length: TEAM_COUNT }, (_, i) => ({
    seed: i + 1,
    name: `${i + 1}팀`,
    players: Array.from({ length: PLAYERS_PER_TEAM }, (_, j) => ({
      name: "",
      seed: (j + 1) as 1 | 2 | 3 | 4,
    })),
  }));
}

export const OPEN_63: TournamentEvent = {
  id: "63open-2026-10-31",
  kind: "tournament",
  title: "63OPEN 테니스 대회",
  date: "2026-10-31",
  startTime: "13:00", // 스펙 일정표 기준. 실제 시간은 미정이라 timeTbd로 표시
  timeTbd: true,
  place: "아식스테니스장",
  minutesPerMatch: 30,
  gamesToWin: 6,
  courts: 4,
  teams: placeholderTeams(),
  // 참가자 32명 (2026-09-03 기준, 남희수 추가). 8팀 × 4명 = 32자리가 꽉 찼다
  // 성별은 2026-09-03 황혜경 확인(여자 9명). 구력은 화면의 팀 편집에서 채운다 (예: "유태현 남 3")
  roster: [
    { name: "유태현", gender: "M" },
    { name: "조현서", gender: "M" },
    { name: "최윤희", gender: "F" },
    { name: "박동호", gender: "M" },
    { name: "정현석", gender: "M" },
    { name: "정현일", gender: "M" },
    { name: "이준영", gender: "F" },
    { name: "이기범", gender: "M" },
    { name: "장종명", gender: "M" },
    { name: "김성배", gender: "M" },
    { name: "이창하", gender: "F" },
    { name: "차종근", gender: "M" },
    { name: "이도연", gender: "F" },
    { name: "김지혜", gender: "F" },
    { name: "최재호", gender: "M" },
    { name: "신정호", gender: "M" },
    { name: "김종광", gender: "M" },
    { name: "송연호", gender: "M" },
    { name: "김순종", gender: "F" },
    { name: "윤여현", gender: "M" },
    { name: "나희성", gender: "M" },
    { name: "강윤구", gender: "M" },
    { name: "이성훈", gender: "M" },
    { name: "손종일", gender: "M" },
    { name: "전강남", gender: "M" },
    { name: "이필환", gender: "M" },
    { name: "김진환", gender: "M" },
    { name: "권혁", gender: "M" },
    { name: "김대현", gender: "M" },
    { name: "이선민", gender: "F" },
    { name: "황혜경", gender: "F" },
    { name: "남희수", gender: "F" },
  ],
  beforeNote: "12:00~13:00 개회식 · 몸풀기",
  afterNote: "경기 종료 후 시상식 · 폐회식 (리셋 재경기가 있으면 30분 늦어져요)",
  rules: DEFAULT_RULES,
  builtIn: true,
};

export const TOURNAMENTS: TournamentEvent[] = [OPEN_63];

export function findBuiltInTournament(id: string): TournamentEvent | null {
  return TOURNAMENTS.find((t) => t.id === id) ?? null;
}
