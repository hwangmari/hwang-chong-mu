// 코드에 든 토너먼트: 63OPEN (2026-10-31, 아식스테니스장). 팀·선수는 화면에서 채운다.
import { DEFAULT_RULES } from "../rules";
import { PLAYERS_PER_TEAM, TEAM_COUNT } from "./template";
import type { TeamEntry, TournamentEvent } from "./types";

export function placeholderTeams(): TeamEntry[] {
  return Array.from({ length: TEAM_COUNT }, (_, i) => ({
    seed: i + 1,
    name: `${i + 1}번 시드 팀`,
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
  // 참가자 31명 (2026-09-02 기준). 8팀 × 4명 = 32자리라 한 자리가 비어 있다
  roster: ["유태현", "조현서", "최윤희", "박동호", "정현석", "정현일", "이준영", "이기범", "장종명", "김성배", "이창하", "차종근", "이도연", "김지혜", "최재호", "신정호", "김종광", "송연호", "김순종", "윤여현", "나희성", "강윤구", "이성훈", "손종일", "전강남", "이필환", "김진환", "권혁", "김대현", "이선민", "황혜경"],
  beforeNote: "12:00~13:00 개회식 · 몸풀기",
  afterNote: "경기 종료 후 시상식 · 폐회식 (리셋 재경기가 있으면 30분 늦어져요)",
  rules: DEFAULT_RULES,
  builtIn: true,
};

export const TOURNAMENTS: TournamentEvent[] = [OPEN_63];

export function findBuiltInTournament(id: string): TournamentEvent | null {
  return TOURNAMENTS.find((t) => t.id === id) ?? null;
}
