"use client";

import { useRef } from "react";
import styled from "styled-components";
import { MotionConfig, motion, useInView } from "framer-motion";
import { GENDER_COLOR, GENDER_LABEL, type Gender } from "../types";
import type { VoteTally } from "@/services/tennisVotes";

/**
 * 베스트드레서 결과 공개 화면 — 시상대 + 득표 순위 (주인 요청 2026-10-23).
 * 명단 순서 그대로 깔면 수상자가 31명 사이에 흩어져 안 보였다.
 *  · 위: 수상자(최다 득표 winnerCount 명, 동점이면 함께)를 토토 우승팀과 같은 노란 카드로 크게
 *  · 가운데: 표를 받은 나머지를 득표 순으로 막대와 함께 (등수는 1, 2, 2, 4 식)
 *  · 아래: 0표인 사람은 이름만 한 줄로 작게
 * 누가 누구를 골랐는지는 여기서도 보여 주지 않는다 — 득표 수만 (VotePanel 머리말의 규칙).
 */

type Option = { value: string; label: string; gender?: Gender };

type Props = {
  options: Option[];
  tally: VoteTally;
  winnerCount: number;
};

export default function DresserResult({ options, tally, winnerCount }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const votesOf = (value: string) =>
    tally.counts.find((c) => c.choice === value)?.votes ?? 0;
  const rows = options
    .map((o, i) => ({ ...o, order: i, votes: votesOf(o.value) }))
    .sort((a, b) => b.votes - a.votes || a.order - b.order);
  const top = rows[0]?.votes ?? 0;
  const rankOf = (votes: number) =>
    1 + rows.filter((r) => r.votes > votes).length;

  // 수상 기준 = winnerCount 번째 득표. 동점이면 함께 올린다 (VotePanel 의 awarded 와 같은 규칙)
  const cut = tally.counts[winnerCount - 1]?.votes ?? 0;
  const winners = cut > 0 ? rows.filter((r) => r.votes >= cut) : [];
  const others = rows.filter((r) => r.votes > 0 && !winners.includes(r));
  const zero = rows.filter((r) => r.votes === 0);

  return (
    <MotionConfig reducedMotion="user">
      <StWrap ref={ref}>
        {winners.length > 0 ? (
          <StPodium>
            {winners.map((w) => (
              <StWinner
                key={w.value}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <StCrown aria-hidden="true">👑</StCrown>
                <StWinnerBody>
                  <StWinnerTag>베스트드레서</StWinnerTag>
                  <StWinnerName>
                    {w.label}
                    {w.gender ? (
                      <StGender $color={GENDER_COLOR[w.gender]}>
                        {GENDER_LABEL[w.gender]}
                      </StGender>
                    ) : null}
                  </StWinnerName>
                </StWinnerBody>
                <StWinnerVotes>{w.votes}표</StWinnerVotes>
              </StWinner>
            ))}
          </StPodium>
        ) : null}

        {others.length > 0 ? (
          <StList role="list" aria-label="베스트드레서 득표 순위">
            {others.map((r, i) => (
              <StRow key={r.value} role="listitem">
                <StRank>{rankOf(r.votes)}</StRank>
                <StName>
                  {r.label}
                  {r.gender ? (
                    <StGender $color={GENDER_COLOR[r.gender]}>
                      {GENDER_LABEL[r.gender]}
                    </StGender>
                  ) : null}
                </StName>
                <StTrack aria-hidden="true">
                  <StFill
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        inView && top > 0 ? `${(r.votes / top) * 100}%` : 0,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                      delay: inView ? 0.15 + i * 0.04 : 0,
                    }}
                  />
                </StTrack>
                <StVotes>{r.votes}표</StVotes>
              </StRow>
            ))}
          </StList>
        ) : null}

        {zero.length > 0 && tally.total > 0 ? (
          <StZero>
            <b>0표</b> {zero.map((z) => z.label).join(" · ")}
          </StZero>
        ) : null}
      </StWrap>
    </MotionConfig>
  );
}

const StWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

/* 수상자는 나란히 (동점으로 3명 이상이면 줄을 넘긴다) */
const StPodium = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.5rem;
`;

/* 토토 우승팀 칸과 같은 노란 카드 */
const StWinner = styled(motion.div)`
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 1.1rem;
  border-radius: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.amber500};
  background: ${({ theme }) => theme.colors.amber50};
`;

const StCrown = styled.span`
  font-size: 1.9rem;
  line-height: 1;
  text-align: center;
`;

const StWinnerBody = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const StWinnerTag = styled.span`
  align-self: flex-start;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.amber500};
  font-size: 0.68rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.white};
`;

const StWinnerName = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  font-size: 1.25rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  word-break: keep-all;
`;

const StWinnerVotes = styled.span`
  font-size: 1.05rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.amber600};
  font-variant-numeric: tabular-nums;
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

/* 등수 · 이름 · 막대 · 표 — 이름·표 칸이 고정폭이라 막대가 줄마다 같은 자리에서 시작한다 */
const StRow = styled.div`
  display: grid;
  grid-template-columns: 1.6rem 5.2rem minmax(0, 1fr) 2.6rem;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem 0.6rem 0.5rem;
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
`;

const StRank = styled.span`
  text-align: center;
  font-size: 0.9rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray400};
  font-variant-numeric: tabular-nums;
`;

const StName = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
`;

const StGender = styled.span<{ $color: string }>`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const StTrack = styled.span`
  position: relative;
  height: 0.5rem;
  border-radius: 999px;
  /* gray100 은 다크 모드에서 칸 바탕과 같은 색이라 막대 바탕이 사라진다 */
  background: ${({ theme }) => theme.colors.gray200};
  overflow: hidden;
`;

const StFill = styled(motion.span)`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.blue200};
`;

const StVotes = styled.span`
  text-align: right;
  font-size: 0.85rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  font-variant-numeric: tabular-nums;
`;

const StZero = styled.p`
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.gray400};
  word-break: keep-all;

  b {
    margin-right: 0.3rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;
