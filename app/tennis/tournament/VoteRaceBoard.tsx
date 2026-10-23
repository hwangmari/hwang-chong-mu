"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useInView,
} from "framer-motion";
import type { VoteKind, VoteTally } from "@/services/tennisVotes";

/**
 * 우승팀 토토 현황판 — 경마 중계처럼 표 많은 팀이 위로 (주인 요청 2026-10-22 "좀더 다이나믹하게").
 *
 * 움직임은 "바뀔 때 한 번"만 (CLAUDE.md 모션 규칙):
 *  · 처음 화면에 25% 보이면 막대가 0에서 제 길이로 한 번 자란다.
 *  · 15초 폴링으로 표가 바뀌면 막대가 늘고, 순위가 바뀐 줄은 미끄러지듯 자리를 바꾼다. 늘어난 팀엔 ▲N 이 잠깐 뜬다.
 *  · 내가 팀을 누르면 그 줄에 BET 도장이 한 번 찍히고, 위에 "내 베팅" 티켓이 붙는다.
 *  · 동작 줄이기 설정이면 MotionConfig 가 이동을 끄고 마지막 모습만 보여 준다.
 * 막대 길이는 전체 표 중 비율, 배당 = 전체 표 ÷ 이 팀 표 (VotePanel 과 같은 계산).
 */

export type RaceOption = { value: string; label: string; sub?: string };

type Props = {
  kind: VoteKind;
  title: string;
  options: RaceOption[];
  tally: VoteTally;
  locked: boolean;
  busy: boolean;
  canVote: boolean;
  /** 대회가 끝나 결과가 공개됐는지 */
  revealed: boolean;
  /** 실제 우승팀 (토토 정답). 아직이면 null */
  winnerValue: string | null;
  onPick: (kind: VoteKind, choice: string) => void;
};

const DELTA_MS = 2600;
const SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;

function oddsOf(total: number, votes: number) {
  return votes > 0 ? `×${(total / votes).toFixed(1)}` : "-";
}

export default function VoteRaceBoard({
  kind,
  title,
  options,
  tally,
  locked,
  busy,
  canVote,
  revealed,
  winnerValue,
  onPick,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boardRef, { once: true, amount: 0.25 });

  const votesOf = (value: string) =>
    tally.counts.find((c) => c.choice === value)?.votes ?? 0;

  // 표 많은 순, 같으면 원래 순서(팀 번호) — 같은 표끼리 자리가 흔들리지 않게
  const rows = options
    .map((o, i) => ({ ...o, order: i, votes: votesOf(o.value) }))
    .sort((a, b) => b.votes - a.votes || a.order - b.order);

  // 직전 폴링보다 늘어난 표 — ▲N 으로 잠깐 보여 준다. 첫 불러오기는 비교 대상이 없어 건너뛴다.
  // 숫자가 바뀐 그 렌더에서 바로 비교한다 (폴링마다 새 객체가 와도 숫자가 같으면 무시)
  const countsKey = tally.counts.map((c) => `${c.choice}:${c.votes}`).join(",");
  const [seen, setSeen] = useState({
    key: countsKey,
    deltas: {} as Record<string, number>,
  });
  if (seen.key !== countsKey) {
    const before = new Map(
      seen.key
        ? seen.key
            .split(",")
            .map((s) => [s.split(":")[0], Number(s.split(":")[1])])
        : [],
    );
    const deltas: Record<string, number> = {};
    for (const c of tally.counts) {
      const diff = c.votes - (before.get(c.choice) ?? 0);
      if (diff > 0) deltas[c.choice] = diff;
    }
    setSeen({ key: countsKey, deltas });
  }
  const deltas = seen.deltas;
  useEffect(() => {
    if (Object.keys(seen.deltas).length === 0) return;
    const t = window.setTimeout(
      () => setSeen((s) => ({ ...s, deltas: {} })),
      DELTA_MS,
    );
    return () => window.clearTimeout(t);
  }, [seen.deltas]);

  // 내가 방금 누른 팀 — 그 줄에만 도장을 한 번 찍는다.
  // "내 표"가 바뀐 것만 보면 안 된다: 다시 들어온 사람은 이름 확인 전(빈 표) → 확인 후(내 표)로
  // 한 번 바뀌어 누르지도 않았는데 도장이 찍혔다 (2026-10-23 수정). 그래서 누른 팀을 기억해 두고
  // 저장이 끝나 그 팀이 내 표로 돌아왔을 때만 찍는다
  const myPick = tally.mine[0] ?? null;
  const [pickSeen, setPickSeen] = useState({
    pending: null as string | null,
    stamped: null as string | null,
  });
  if (pickSeen.pending && pickSeen.pending === myPick) {
    setPickSeen({ pending: null, stamped: myPick });
  }
  const stamped = pickSeen.stamped;
  useEffect(() => {
    if (!pickSeen.stamped) return;
    const t = window.setTimeout(
      () => setPickSeen((s) => ({ ...s, stamped: null })),
      1400,
    );
    return () => window.clearTimeout(t);
  }, [pickSeen.stamped]);

  // 순위는 스포츠 순위표처럼: 표가 같으면 같은 순위(공동), 다음 팀은 그만큼 건너뛴다 (1, 2, 2, 4).
  // 0표 팀은 순위를 매기지 않는다 — 아무도 안 건 팀끼리 5·6·7위로 나누는 건 의미가 없다 (주인 질문 2026-10-22)
  const rankOf = (votes: number) => {
    if (votes === 0) return null;
    return {
      rank: 1 + rows.filter((r) => r.votes > votes).length,
      tied: rows.filter((r) => r.votes === votes).length > 1,
    };
  };
  const rankLabel = (votes: number) => {
    const r = rankOf(votes);
    return r ? `${r.tied ? "공동 " : ""}${r.rank}위` : "아직 0표";
  };

  // 표 수가 같은 팀끼리 한 묶음 (rows 가 이미 표 많은 순이라 이웃끼리만 비교하면 된다)
  const groups: (typeof rows)[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && row.votes > 0 && last[0].votes === row.votes) last.push(row);
    else groups.push([row]);
  }

  const myRow = myPick ? rows.find((r) => r.value === myPick) : undefined;
  const correct = revealed && winnerValue !== null && myPick === winnerValue;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false}>
        {myRow ? (
          <StTicket
            key="ticket"
            $win={correct}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <StTicketLabel>🎟️ 내 베팅</StTicketLabel>
            <StTicketTeam>{myRow.label}</StTicketTeam>
            <StTicketMeta>
              {correct
                ? "적중!"
                : `현재 ${rankLabel(myRow.votes)} · ${oddsOf(tally.total, myRow.votes)}`}
            </StTicketMeta>
          </StTicket>
        ) : null}
      </AnimatePresence>

      <LayoutGroup>
        <StBoard ref={boardRef} role="list" aria-label={`${title} 현황`}>
          {groups.map((group) => {
            const place = rankOf(group[0].votes);
            const groupWon =
              revealed && group.some((r) => r.value === winnerValue);
            return (
              <StGroup
                // 공동 등수는 한 줄에 나란히 (주인 결정 2026-10-22). 0표 팀은 등수 없이 한 줄씩
                key={place ? `rank-${place.rank}` : group[0].value}
                role="listitem"
                layout="position"
                transition={SPRING}
              >
                <StRank $lead={place?.rank === 1}>
                  {groupWon ? "🏆" : place ? place.rank : "–"}
                  {place && group.length > 1 ? <small>공동</small> : null}
                </StRank>
                <StCells $count={group.length}>
                  {group.map((row) => {
                    const i = rows.indexOf(row);
                    const mine = row.value === myPick;
                    const isWinner = revealed && winnerValue === row.value;
                    const share = tally.total > 0 ? row.votes / tally.total : 0;
                    const delta = deltas[row.value];
                    const who = isWinner ? (tally.names[row.value] ?? []) : [];
                    return (
                      <StCell
                        key={row.value}
                        layoutId={`race-${row.value}`}
                        transition={SPRING}
                        type="button"
                        disabled={locked || busy || !canVote}
                        $mine={mine}
                        $winner={isWinner}
                        $multi={group.length > 1}
                        onClick={() => {
                          setPickSeen((s) => ({ ...s, pending: row.value }));
                          onPick(kind, row.value);
                        }}
                        aria-label={`${title} ${row.label} ${row.votes}표 ${rankLabel(row.votes)}${mine ? " (내가 건 팀)" : ""}`}
                      >
                        <StName>
                          <b>{row.label}</b>
                          {who.length > 0 ? (
                            <StWho>{who.join(" · ")}</StWho>
                          ) : row.sub ? (
                            <StSub>{row.sub}</StSub>
                          ) : null}
                        </StName>
                        <StVotes>
                          <AnimatePresence>
                            {delta ? (
                              <StDelta
                                key={`d-${row.value}`}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                ▲{delta}
                              </StDelta>
                            ) : null}
                          </AnimatePresence>
                          {row.votes}표
                        </StVotes>
                        <StOdds>{oddsOf(tally.total, row.votes)}</StOdds>
                        <StTrack aria-hidden="true">
                          <StFill
                            $mine={mine}
                            initial={{ width: 0 }}
                            animate={{ width: inView ? `${share * 100}%` : 0 }}
                            transition={{
                              duration: 0.7,
                              ease: [0.22, 1, 0.36, 1],
                              delay: inView ? i * 0.04 : 0,
                            }}
                          />
                        </StTrack>

                        <AnimatePresence>
                          {stamped === row.value ? (
                            <StStamp
                              key="stamp"
                              initial={{ opacity: 0, scale: 1.8, rotate: -18 }}
                              animate={{ opacity: 1, scale: 1, rotate: -12 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 520,
                                damping: 22,
                              }}
                            >
                              BET ✓
                            </StStamp>
                          ) : null}
                        </AnimatePresence>
                      </StCell>
                    );
                  })}
                </StCells>
              </StGroup>
            );
          })}
        </StBoard>
      </LayoutGroup>
    </MotionConfig>
  );
}

/* 내 베팅 티켓 — 옅은 파란 띠, 왼쪽은 티켓 절취선 느낌의 점선 */
const StTicket = styled(motion.div)<{ $win: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.55rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.blue50};

  & > span:last-child {
    color: ${({ theme, $win }) => ($win ? theme.semantic.success : theme.semantic.primary)};
  }
`;

const StTicketLabel = styled.span`
  font-size: 0.74rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StTicketTeam = styled.span`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StTicketMeta = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
  font-variant-numeric: tabular-nums;
`;

const StBoard = styled.div`
  display: flex;
  flex-direction: column;
  /* 등수와 등수 사이는 넓게, 같은 등수 안(StCells)은 촘촘하게 — 묶음이 한눈에 보이게 */
  gap: 0.8rem;
`;

/* 등수 칸은 고정폭, 오른쪽은 그 등수의 팀들 (공동이면 나란히) */
const StGroup = styled(motion.div)`
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr);
  align-items: center;
  column-gap: 0.45rem;
`;

const StCells = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: 0.35rem;

  /* 데스크톱(1024px)보다 좁으면 한 줄에 2개까지 — 945 창에서 4팀 공동이면 이름이 잘린다 (주인 요청 2026-10-22). 홀수면 마지막 칸이 한 줄을 채운다 */
  @media not all and ${({ theme }) => theme.media.desktop} {
    grid-template-columns: repeat(
      ${({ $count }) => Math.min($count, 2)},
      minmax(0, 1fr)
    );

    & > button:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }
`;

/* 팀(선수) · 표 · 배당 칸은 고정폭이라 줄마다 같은 자리에서 끝난다. 막대는 둘째 줄 전체.
   공동으로 나란히 놓인 칸은 좁아서 표·배당을 글자 폭만큼만 잡는다 */
const StCell = styled(motion.button)<{
  $mine: boolean;
  $winner: boolean;
  $multi: boolean;
}>`
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: ${({ $multi }) =>
    $multi ? "minmax(0, 1fr) auto auto" : "minmax(0, 1fr) 3.6rem 2.8rem"};
  grid-template-areas:
    "name votes odds"
    "track track track";
  /* 이름이 여러 줄이 돼도 표·배당은 팀 이름 줄에, 막대는 맨 아래에 (같은 줄 칸끼리 높이가 같아진다) */
  align-items: baseline;
  align-content: space-between;
  column-gap: 0.55rem;
  row-gap: 0.55rem;
  padding: 0.85rem 0.85rem 0.9rem;
  border-radius: 0.6rem;
  text-align: left;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid
    ${({ theme, $mine, $winner }) =>
      $winner
        ? theme.semantic.warning
        : $mine
          ? theme.semantic.primary
          : "transparent"};
  cursor: pointer;
  overflow: hidden;

  &:disabled {
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${({ theme }) => theme.colors.gray50};
  }

  /* 폰에서 나란히 놓이면 칸이 좁아 간격만 줄인다 — 선수 이름은 줄바꿈으로 다 보여 준다 (주인 요청 2026-10-22) */
  @media ${({ theme }) => theme.media.mobile} {
    ${({ $multi }) =>
      $multi
        ? `
      column-gap: 0.35rem;
      padding: 0.85rem 0.85rem 0.9rem 0.6rem;
    `
        : ""}
  }
`;

const StRank = styled.span<{ $lead: boolean }>`
  align-self: center;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: ${({ theme, $lead }) => ($lead ? theme.semantic.primary : theme.colors.gray400)};

  /* 공동 순위 표시 — 숫자 아래 작게 */
  small {
    display: block;
    font-size: 0.56rem;
    font-weight: 800;
  }
`;

const StName = styled.span`
  grid-area: name;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.15rem 0.45rem;

  b {
    flex-shrink: 0;
    font-size: 0.9rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StSub = styled.span`
  min-width: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.5;
  /* 말줄임 없이 이름 단위로 줄바꿈 (주인 요청 2026-10-22) */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const StWho = styled(StSub)`
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 700;
`;

const StVotes = styled.span`
  grid-area: votes;
  display: inline-flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.82rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  font-variant-numeric: tabular-nums;
`;

const StDelta = styled(motion.span)`
  font-size: 0.66rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.success};
`;

const StOdds = styled.span`
  grid-area: odds;
  text-align: right;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  font-variant-numeric: tabular-nums;
`;

const StTrack = styled.span`
  grid-area: track;
  position: relative;
  height: 0.5rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;

const StFill = styled(motion.span)<{ $mine: boolean }>`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: ${({ theme, $mine }) => ($mine ? theme.semantic.primary : theme.colors.blue200)};
`;

const StStamp = styled(motion.span)`
  position: absolute;
  /* 막대 위 가운데에 찍는다 — 표·배당 숫자를 가리지 않게 */
  top: 50%;
  left: 50%;
  translate: -50% 0;
  margin-top: -0.85rem;
  padding: 0.15rem 0.5rem;
  border: 2px solid ${({ theme }) => theme.semantic.primary};
  border-radius: 0.35rem;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.colors.white};
  pointer-events: none;
`;
