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

// ───── 이 폰에서 통과한 사람 기억하기 ─────
// 이름과 비번을 매번 넣으면 번거로워서, 한 번 통과하면 이 폰에 적어 둔다.
// 저장되는 곳은 이 폰 안뿐이고 저장 공간으로 올라가지 않는다.
// "다른 사람" 단추를 누르면 지워진다.
const PIN_KEY = "hwang-tennis-voter-pin";

export function getSavedVoter(): { name: string; pin: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const name = window.localStorage.getItem(NAME_KEY) ?? "";
    const pin = window.localStorage.getItem(PIN_KEY) ?? "";
    return name && pin.length === 4 ? { name, pin } : null;
  } catch {
    return null;
  }
}

export function saveVoter(name: string, pin: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAME_KEY, name);
    window.localStorage.setItem(PIN_KEY, pin);
  } catch {
    // 저장이 막혀 있어도 이번 투표에는 지장이 없다
  }
}

export function clearSavedVoter() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(NAME_KEY);
    window.localStorage.removeItem(PIN_KEY);
  } catch {
    // 지우지 못해도 화면에서는 잠긴 상태로 돌아간다
  }
}
