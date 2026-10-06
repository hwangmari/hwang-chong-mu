// 대회 투표에서 "나"를 가리키는 값.
//
// 처음에는 폰마다 임의 문자열을 만들어 익명으로 두려 했는데, 기록을 지우면 또 투표할 수 있어
// 한 사람 한 표가 깨졌다. 그래서 참가자 명단에서 본인 이름을 고르는 방식으로 바꿨다
// (주인 결정 2026-10-06).
//
// 이름이 저장 공간에 남지만, 화면에 누가 누구를 골랐는지 보여 주는 건 우승팀 토토뿐이다.
// 베스트드레서는 득표 수만 보여 준다 — VotePanel 의 showNames 가 그 경계다.
// 저장 공간 규칙이 식별값을 8자 이상으로 받으므로 이름 앞에 "player-"를 붙인다
// (가장 짧은 이름이 2글자라 9자가 된다).
const NAME_KEY = "hwang-tennis-voter-name";

export function playerVoterKey(name: string): string {
  return `player-${name}`;
}

export function playerNameFromKey(key: string): string | null {
  return key.startsWith("player-") ? key.slice("player-".length) : null;
}

/** 이 폰에서 지난번에 고른 이름 (다시 들어와도 다시 안 고르게) */
export function getVoterName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setVoterName(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    // 저장이 막혀 있어도 이번 투표에는 지장이 없다
  }
}
