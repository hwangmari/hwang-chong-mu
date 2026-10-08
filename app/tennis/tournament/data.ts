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
  startTime: "13:00", // 12~18시 대관. 12~13시 개회식·몸풀기, 13시 첫 경기
  timeTbd: false,
  place: "아식스 테니스 아카데미",
  minutesPerMatch: 40,
  gamesToWin: 6,
  courts: 4,
  // 최종 팀 배정 (주인이 보낸 배정표, 2026-10-01 확정).
  // 6팀은 4명, 7·8팀은 3명 — 3명 팀은 3번 시드가 4번 자리도 맡는다.
  teams: [
    {
      seed: 1,
      name: "1팀",
      players: [
        { name: "김진환", seed: 1 },
        { name: "김성배", seed: 2 },
        { name: "이준영", seed: 3 },
        { name: "김대현", seed: 4 },
      ],
    },
    {
      seed: 2,
      name: "2팀",
      players: [
        { name: "이기범", seed: 1 },
        { name: "남희수", seed: 2 },
        { name: "김원주", seed: 3 },
        { name: "유태현", seed: 4 },
      ],
    },
    {
      seed: 3,
      name: "3팀",
      players: [
        { name: "나희성", seed: 1 },
        { name: "권혁", seed: 2 },
        { name: "전강남", seed: 3 },
        { name: "최윤희", seed: 4 },
      ],
    },
    {
      seed: 4,
      name: "4팀",
      players: [
        { name: "손종일", seed: 1 },
        { name: "김지혜", seed: 2 },
        { name: "박동호", seed: 3 },
        { name: "신정호", seed: 4 },
      ],
    },
    {
      seed: 5,
      name: "5팀",
      players: [
        { name: "김종광", seed: 1 },
        { name: "이필환", seed: 2 },
        { name: "이선민", seed: 3 },
        { name: "김순종", seed: 4 },
      ],
    },
    {
      seed: 6,
      name: "6팀",
      players: [
        { name: "윤여현", seed: 1 },
        { name: "조현서", seed: 2 },
        { name: "황혜경", seed: 3 },
        { name: "최재호", seed: 4 },
      ],
    },
    {
      seed: 7,
      name: "7팀", // 3명 팀 — 3번 시드가 4번 자리까지 맡는다 (주인 확인 2026-10-01)
      players: [
        { name: "장종명", seed: 1 },
        { name: "이창하", seed: 2 },
        { name: "정현석", seed: 3 },
      ],
    },
    {
      seed: 8,
      name: "8팀", // 3명 팀 — 3번 시드가 4번 자리까지 맡는다 (주인 확인 2026-10-01)
      players: [
        { name: "정현일", seed: 1 },
        { name: "차종근", seed: 2 },
        { name: "이도연", seed: 3 },
      ],
    },
  ],
  // 최종 명단 30명 (2026-10-01). 김원주 합류, 송연호·강윤구·이성훈 불참으로 제외.
  // 6팀은 4명, 7·8팀은 3명 — 배정표가 최종본이다 (주인 확인)
  // 성별은 2026-09-03 황혜경 확인(여자 9명). 구력은 화면의 팀 편집에서 채운다 (예: "유태현 남 3")
  roster: [
    { name: "유태현", gender: "M" },
    { name: "조현서", gender: "F" },
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
    { name: "김순종", gender: "F" },
    { name: "윤여현", gender: "M" },
    { name: "나희성", gender: "M" },
    { name: "손종일", gender: "M" },
    { name: "전강남", gender: "M" },
    { name: "이필환", gender: "M" },
    { name: "김진환", gender: "M" },
    { name: "권혁", gender: "M" },
    { name: "김대현", gender: "M" },
    { name: "이선민", gender: "F" },
    { name: "황혜경", gender: "F" },
    { name: "남희수", gender: "F" },
    // 2026-10-01 새로 합류
    { name: "김원주", gender: "M" },
  ],
  beforeNote: "12:00~13:00 개회식 · 몸풀기",
  afterNote: "경기 종료 후 시상식 · 폐회식",
  rules: DEFAULT_RULES,
  builtIn: true,
};

export const TOURNAMENTS: TournamentEvent[] = [OPEN_63];

export function findBuiltInTournament(id: string): TournamentEvent | null {
  return TOURNAMENTS.find((t) => t.id === id) ?? null;
}
