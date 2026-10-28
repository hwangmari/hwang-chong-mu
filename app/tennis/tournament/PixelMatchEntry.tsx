"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import type { ResolvedMatch, TeamEntry } from "./types";
import { PAIR_ROTATION } from "./types";
import type { Court, MatchScore } from "../types";
import { validateGameScore } from "../score";
import { pairNames } from "./TournamentMatchCard";
import { shirtOf } from "./PixelBracket";

/**
 * 픽셀 코트에서 여는 경기 시작·점수 입력 칸 (주인 요청 2026-10-27).
 * 점수 화면 카드(TournamentMatchCard)와 같은 규칙·같은 저장 함수를 쓰고 모양만 픽셀로 그린다.
 *
 * 경기 중 점수는 두 가지로 넣을 수 있다.
 *  · 합계로: 경기가 끝나면 최종 점수만 (기본)
 *  · 페어별로: 페어가 끝날 때 그 페어 점수 — 페어A 1~4게임 → B 5~8 → C 9~12(연장 시), 페어마다 4게임까지.
 *    페어 체인지 때 꼭 넣을 필요는 없다고 해서(주인 2026-10-27) 고르는 방식으로 뒀다
 *  · 어느 쪽이든 저장 공간에는 합계만 넣는다(표 구조 그대로). 페어별 점수는 입력한 폰(localStorage)에만 남는다
 */

type Props = {
  eventId: string;
  match: ResolvedMatch;
  score: MatchScore | null;
  gamesToWin: number;
  /** 지금 시각(분) */
  clock: number;
  courts: Court[];
  occupied: Set<Court>;
  busy: boolean;
  canEdit: boolean;
  /** 시작·점수를 못 넣을 때 이유 */
  lockedHint: string;
  onStart: (matchNo: number, court: Court) => Promise<void>;
  onSave: (matchNo: number, scoreA: number, scoreB: number, tiebreak: [number, number] | null) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
  /** 코트 카드 안에 넣을 때 — 카드에 이미 팀·점수 줄이 있어 위쪽 "1팀 3:1 2팀" 줄을 뺀다 */
  inCard?: boolean;
};

type Seg = [number, number];
const GAMES_PER_PAIR = 4;
const EMPTY: Seg[] = [[0, 0], [0, 0], [0, 0]];

const pairKey = (eventId: string, no: number) => `hcm:tennis:${eventId}:pairs:${no}`;
function loadSegs(eventId: string, no: number): Seg[] {
  try {
    const raw = window.localStorage.getItem(pairKey(eventId, no));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed) && parsed.length === 3) return parsed as Seg[];
  } catch {
    // 저장이 막힌 기기면 빈 칸으로 시작
  }
  return EMPTY;
}
function saveSegs(eventId: string, no: number, segs: Seg[]) {
  try {
    window.localStorage.setItem(pairKey(eventId, no), JSON.stringify(segs));
  } catch {
    // 저장이 막혀도 입력은 이어간다
  }
}

const isoToMinutes = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

function Stepper({
  value,
  label,
  canUp,
  disabled,
  onChange,
}: {
  value: number;
  label: string;
  canUp: boolean;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <StStepper>
      <StStep type="button" aria-label={`${label} 빼기`} disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}>
        −
      </StStep>
      <StNum aria-label={label}>{value}</StNum>
      <StStep type="button" aria-label={`${label} 더하기`} disabled={disabled || !canUp} onClick={() => onChange(value + 1)}>
        +
      </StStep>
    </StStepper>
  );
}

function TeamTag({ team, label }: { team: TeamEntry | null; label: string }) {
  return (
    <StTeamTag>
      {team ? <StSwatch style={{ background: shirtOf(team) }} /> : null}
      {team ? team.name : label}
    </StTeamTag>
  );
}

export default function PixelMatchEntry({
  eventId,
  match,
  score,
  gamesToWin,
  clock,
  courts,
  occupied,
  busy,
  canEdit,
  lockedHint,
  onStart,
  onSave,
  onClear,
  inCard = false,
}: Props) {
  const no = match.template.no;
  const done = match.status === "done";
  const playing = match.status === "playing";

  // 페어별 점수 — 이 폰에 남겨 둔 것을 불러온다 (탭을 처음 그릴 때만 읽으니 서버 그림과 어긋나지 않는다)
  const [segs, setSegs] = useState<Seg[]>(() => (typeof window === "undefined" ? EMPTY : loadSegs(eventId, no)));
  const [tb, setTb] = useState<Seg>([0, 0]);
  const [editing, setEditing] = useState(false);
  const [fix, setFix] = useState<Seg>([match.scoreA ?? 0, match.scoreB ?? 0]);
  // 페어별로 적던 기록이 이 폰에 있으면 페어별로, 없으면 합계로 시작
  const [byPair, setByPair] = useState(() => segs.some((sg) => sg[0] + sg[1] > 0));
  const [error, setError] = useState("");

  useEffect(() => {
    if (playing) saveSegs(eventId, no, segs);
  }, [eventId, no, playing, segs]);

  // 손으로 넣은 게임 수
  const raw: Seg = done && !editing
    ? [match.scoreA ?? 0, match.scoreB ?? 0]
    : editing || !byPair
      ? fix
      : [segs[0][0] + segs[1][0] + segs[2][0], segs[0][1] + segs[1][1] + segs[2][1]];
  // 5:5 면 7점 타이브레이크. 타이브레이크를 이긴 팀 게임이 저절로 하나 올라 6:5 가 된다
  // (전에는 6:5 를 손으로 맞춰야 타이브레이크 칸이 떠서 "합계가 안 올라간다"고 느꼈다 — 주인 2026-10-28)
  const at55 = raw[0] === gamesToWin - 1 && raw[1] === gamesToWin - 1;
  const tbWinner = tb[0] !== tb[1] && Math.max(tb[0], tb[1]) >= 7 ? (tb[0] > tb[1] ? 0 : 1) : null;
  const total: Seg =
    at55 && tbWinner !== null
      ? tbWinner === 0
        ? [raw[0] + 1, raw[1]]
        : [raw[0], raw[1] + 1]
      : raw;
  const decided = Math.max(total[0], total[1]) >= gamesToWin;
  const check = validateGameScore({
    a: String(total[0]),
    b: String(total[1]),
    tbA: tb[0] || tb[1] ? String(tb[0]) : "",
    tbB: tb[0] || tb[1] ? String(tb[1]) : "",
    gamesToWin,
  });

  // 지금 뛰는 페어: 4게임을 다 채우지 않은 첫 페어
  const current = segs.findIndex((s) => s[0] + s[1] < GAMES_PER_PAIR);
  const now = current === -1 ? 2 : current;
  const elapsed = playing && score?.startedAt ? Math.max(0, clock - isoToMinutes(score.startedAt)) : null;

  function setSeg(i: number, side: 0 | 1, v: number) {
    setError("");
    setSegs((prev) => prev.map((s, j) => (j === i ? ((side === 0 ? [v, s[1]] : [s[0], v]) as Seg) : s)));
  }

  async function save() {
    setError(check.error);
    if (check.error || check.a === null || check.b === null) return;
    await onSave(no, check.a, check.b, check.tiebreak);
    try {
      window.localStorage.removeItem(pairKey(eventId, no));
    } catch {
      // 지우지 못해도 다음 경기에는 영향 없다
    }
    setEditing(false);
  }

  return (
    <StWrap>
      {inCard ? (
        playing || editing ? (
          <StBig style={{ fontSize: "1.05rem" }}>
            지금 <span>{total[0]}</span>:<span>{total[1]}</span>
          </StBig>
        ) : null
      ) : (
      <StVersus>
        <TeamTag team={match.teamA} label={match.aLabel} />
        <StBig>
          {done || playing || editing ? (
            <>
              <span>{total[0]}</span>:<span>{total[1]}</span>
            </>
          ) : (
            "VS"
          )}
        </StBig>
        <TeamTag team={match.teamB} label={match.bLabel} />
      </StVersus>
      )}
      {done && score?.tiebreakA !== undefined && score?.tiebreakB !== undefined && !editing ? (
        <StNote>
          타이브레이크 {score.tiebreakA} - {score.tiebreakB}
        </StNote>
      ) : null}

      {match.status === "waiting" || match.status === "hidden" ? (
        <StNote>앞 경기 결과가 나오면 두 팀이 정해져요.</StNote>
      ) : null}

      {/* 시작 */}
      {match.status === "ready" ? (
        canEdit ? (
          <StActions>
            {courts.map((court) => {
              const free = !occupied.has(court);
              const planned = court === match.template.court;
              return (
                <StBtn
                  key={court}
                  type="button"
                  $tone={planned && free ? "go" : "plain"}
                  disabled={busy || !free}
                  title={free ? undefined : "이 코트는 경기 중이에요"}
                  onClick={() => void onStart(no, court)}
                >
                  ▶ {court}코트{planned ? "에서 시작" : ""}
                </StBtn>
              );
            })}
          </StActions>
        ) : (
          <StNote>{lockedHint}</StNote>
        )
      ) : null}

      {/* 경기 중: 페어별 점수 */}
      {playing ? (
        <>
          <StBar>
          {elapsed !== null ? <StLive>🔥 {elapsed}분째</StLive> : null}
          {canEdit ? (
            <StModes role="group" aria-label="점수 넣는 방식">
              <StMode type="button" aria-pressed={!byPair} onClick={() => setByPair(false)}>
                합계로
              </StMode>
              <StMode type="button" aria-pressed={byPair} onClick={() => setByPair(true)}>
                페어별로
              </StMode>
            </StModes>
          ) : null}
          </StBar>
          {canEdit && !byPair ? (
            <StPair $now $off={false}>
              <StPairHead>
                <b>
                  최종 점수 <span>경기가 끝나면 합계만 넣어요</span>
                </b>
              </StPairHead>
              <StPairRow>
                <StWho>{match.teamA?.name}</StWho>
                <Stepper value={fix[0]} label="A팀 게임" canUp={fix[0] < gamesToWin} disabled={busy} onChange={(v) => setFix([v, fix[1]])} />
                <StColon>:</StColon>
                <Stepper value={fix[1]} label="B팀 게임" canUp={fix[1] < gamesToWin} disabled={busy} onChange={(v) => setFix([fix[0], v])} />
                <StWho $right>{match.teamB?.name}</StWho>
              </StPairRow>
            </StPair>
          ) : canEdit ? (
            <StPairs>
              {PAIR_ROTATION.map((r, i) => {
                const seg = segs[i];
                const sum = seg[0] + seg[1];
                const before = segs.slice(0, i).every((s) => s[0] + s[1] === GAMES_PER_PAIR);
                const open = before && !decided ? true : sum > 0;
                const full = sum === GAMES_PER_PAIR;
                const room = sum < GAMES_PER_PAIR && !decided;
                return (
                  <StPair key={r.key} $now={i === now && !decided} $off={!before}>
                    <StPairHead>
                      <b>
                        페어{r.key} <span>{r.games}</span>
                      </b>
                      {full && i < 2 && !decided ? <StChange>페어 체인지!</StChange> : null}
                    </StPairHead>
                    <StPairRow>
                      <StWho>{pairNames(match.teamA, r.seeds)}</StWho>
                      <Stepper
                        value={seg[0]}
                        label={`페어${r.key} ${match.teamA?.name ?? "A팀"} 게임`}
                        canUp={room && total[0] < gamesToWin}
                        disabled={busy || !open}
                        onChange={(v) => setSeg(i, 0, v)}
                      />
                      <StColon>:</StColon>
                      <Stepper
                        value={seg[1]}
                        label={`페어${r.key} ${match.teamB?.name ?? "B팀"} 게임`}
                        canUp={room && total[1] < gamesToWin}
                        disabled={busy || !open}
                        onChange={(v) => setSeg(i, 1, v)}
                      />
                      <StWho $right>{pairNames(match.teamB, r.seeds)}</StWho>
                    </StPairRow>
                  </StPair>
                );
              })}
            </StPairs>
          ) : (
            <StNote>{lockedHint}</StNote>
          )}
        </>
      ) : null}

      {/* 끝난 경기 고치기: 합계만 */}
      {done && editing ? (
        <StPair $now $off={false}>
          <StPairHead>
            <b>최종 점수 고치기</b>
          </StPairHead>
          <StPairRow>
            <StWho>{match.teamA?.name}</StWho>
            <Stepper value={fix[0]} label="A팀 게임" canUp={fix[0] < gamesToWin} disabled={busy} onChange={(v) => setFix([v, fix[1]])} />
            <StColon>:</StColon>
            <Stepper value={fix[1]} label="B팀 게임" canUp={fix[1] < gamesToWin} disabled={busy} onChange={(v) => setFix([fix[0], v])} />
            <StWho $right>{match.teamB?.name}</StWho>
          </StPairRow>
        </StPair>
      ) : null}

      {/* 5:5 → 6:5 로 끝나면 타이브레이크 */}
      {(playing || editing) && canEdit && (at55 || check.needsTiebreak) ? (
        <StPair $now $off={false}>
          <StPairHead>
            <b>
              타이브레이크{" "}
              <span>
                {/* 63OPEN 규칙: 2점 차 없이 7점 먼저 (6:6이면 다음 1점) — 운영진 확인 2026-10-28 */}
                {at55
                  ? "5:5 — 7점 먼저 내면 그 팀 게임이 6이 돼요 (6:6이면 다음 1점)"
                  : "7점 먼저 · 모르면 비워 둬도 돼요"}
              </span>
            </b>
          </StPairHead>
          <StPairRow>
            <StWho>{match.teamA?.name}</StWho>
            <Stepper value={tb[0]} label="A팀 타이브레이크" canUp={tb[0] < 7} disabled={busy} onChange={(v) => setTb([v, tb[1]])} />
            <StColon>-</StColon>
            <Stepper value={tb[1]} label="B팀 타이브레이크" canUp={tb[1] < 7} disabled={busy} onChange={(v) => setTb([tb[0], v])} />
            <StWho $right>{match.teamB?.name}</StWho>
          </StPairRow>
        </StPair>
      ) : null}

      {error ? <StError>⚠️ {error}</StError> : null}

      {canEdit && (playing || editing) ? (
        <StActions>
          <StBtn type="button" $tone="go" disabled={busy || !decided} onClick={() => void save()}>
            {editing ? "점수 고치기" : "🏁 경기 끝 · 점수 저장"}
          </StBtn>
          {editing ? (
            <StBtn type="button" $tone="plain" disabled={busy} onClick={() => setEditing(false)}>
              취소
            </StBtn>
          ) : null}
          <StBtn type="button" $tone="plain" disabled={busy} onClick={() => void onClear(no)}>
            {editing ? "기록 지우기" : "시작 취소"}
          </StBtn>
        </StActions>
      ) : null}
      {canEdit && done && !editing ? (
        <StActions>
          <StBtn
            type="button"
            $tone="plain"
            disabled={busy}
            onClick={() => {
              setFix([match.scoreA ?? 0, match.scoreB ?? 0]);
              setTb([score?.tiebreakA ?? 0, score?.tiebreakB ?? 0]);
              setEditing(true);
            }}
          >
            점수 고치기
          </StBtn>
        </StActions>
      ) : null}
      {playing && canEdit ? (
        <StNote>
          {gamesToWin}게임 선취 · 6:5면 타이브레이크{byPair ? " · 페어별 점수는 이 폰에만 남아요" : ""}
        </StNote>
      ) : null}
    </StWrap>
  );
}

const PIX = "ui-monospace, Menlo, Consolas, monospace";
const INK = "#24343b";
const DIM = "#6b7c80";
const ACCENT = "#e8761c";
const LED = "#ffcf4a";

// 점수 입력 영역은 촘촘하게 (주인 요청 2026-10-27 "좀 줄여져도 좋을 거 같아")
const StWrap = styled.div`
  display: grid;
  gap: 0.45rem;
  color: ${INK};
`;

const StVersus = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.6rem;

  & > :last-child {
    justify-self: end;
  }
`;

const StTeamTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 900;
`;

const StSwatch = styled.i`
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  box-shadow: 2px 2px 0 #0002;
`;

const StBig = styled.div`
  font-family: ${PIX};
  font-size: 1.25rem;
  font-weight: 800;
  color: ${ACCENT};
  font-variant-numeric: tabular-nums;

  span {
    padding-inline: 0.2rem;
  }
`;

const StNote = styled.p`
  font-size: 0.76rem;
  line-height: 1.5;
  color: ${DIM};
`;

const StBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`;

const StLive = styled.div`
  padding: 0.2rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #fff;
  background: #ff6b57;
`;

// 합계로 | 페어별로 — 폼 안 두 갈래라 세그먼트 버튼
const StModes = styled.div`
  display: inline-flex;
  background: #e6f0f4;
  padding: 3px;
  gap: 3px;
`;

const StMode = styled.button`
  padding: 0.25rem 0.7rem;
  border: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${DIM};
  background: transparent;
  cursor: pointer;

  &[aria-pressed="true"] {
    color: ${INK};
    background: #fff;
    box-shadow: 2px 2px 0 #2f7a4f33;
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 1px;
  }
`;

const StPairs = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const StPair = styled.div<{ $now: boolean; $off: boolean }>`
  display: grid;
  gap: 0.2rem;
  padding: 0.35rem 0.5rem;
  background: ${({ $now }) => ($now ? "#fff7d6" : "#f3f7f9")};
  box-shadow: ${({ $now }) => ($now ? `inset 0 0 0 2px ${LED}` : "none")};
  opacity: ${({ $off }) => ($off ? 0.5 : 1)};
`;

const StPairHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.76rem;

  b {
    font-weight: 800;
  }

  span {
    font-weight: 600;
    color: ${DIM};
  }
`;

const StChange = styled.span`
  padding: 0.1rem 0.5rem;
  font-family: ${PIX};
  font-size: 0.66rem;
  font-weight: 800;
  color: #fff !important;
  background: #7a5cf0;
`;

// 휴대폰에서도 한 줄: 이름 · 스텝퍼 : 스텝퍼 · 이름
const StPairRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem;
`;

const StWho = styled.span<{ $right?: boolean }>`
  min-width: 0;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.35;
  color: ${DIM};
  text-align: ${({ $right }) => ($right ? "right" : "left")};
  word-break: keep-all;
`;

const StStepper = styled.div`
  display: inline-grid;
  grid-template-columns: 1.8rem 2rem 1.8rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1.6rem 1.7rem 1.6rem;
  }
  align-items: center;
  background: #fff;
  box-shadow: 3px 3px 0 #2f7a4f33;
`;

const StStep = styled.button`
  height: 2rem;
  border: 0;
  font-family: ${PIX};
  font-size: 1rem;
  font-weight: 800;
  color: ${INK};
  background: #e6f0f4;
  cursor: pointer;

  &:disabled {
    color: #b9c6c9;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 1px;
  }
`;

const StNum = styled.span`
  text-align: center;
  font-family: ${PIX};
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
`;

const StColon = styled.span`
  font-family: ${PIX};
  font-size: 1.1rem;
  font-weight: 800;
  color: ${DIM};
`;

const StActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StBtn = styled.button<{ $tone: "go" | "plain" }>`
  padding: 0.45rem 0.8rem;
  border: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${INK};
  background: ${({ $tone }) => ($tone === "go" ? LED : "#fff")};
  box-shadow: 3px 3px 0 ${INK};
  cursor: pointer;

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 ${INK};
  }

  &:disabled {
    color: #9aa6a9;
    box-shadow: 3px 3px 0 #c2cdd0;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 2px;
  }
`;

const StError = styled.p`
  font-size: 0.82rem;
  font-weight: 800;
  color: #e5484d;
`;
