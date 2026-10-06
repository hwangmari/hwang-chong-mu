"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { ResolvedMatch, TournamentEvent } from "./types";
import { GENDER_LABEL, GENDER_COLOR, type Gender } from "../types";
import { getVoterKey } from "../voterKey";
import {
  castVote,
  fetchVoteTallies,
  VOTE_LABEL,
  type VoteKind,
  type VoteTally,
} from "@/services/tennisVotes";
import { SkeletonBlock } from "@/components/common/Skeleton";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StNotice,
} from "../page.styles";

type Props = { event: TournamentEvent; matches: ResolvedMatch[] };

/**
 * 대회 익명 투표 — 베스트드레서(남성부·여성부)와 우승팀 토토. (주인 요청 2026-10-06)
 *
 * 규칙은 두 가지뿐이고 둘 다 자동이라 따로 마감 버튼이 없다.
 *  · 우승팀 토토: 첫 경기가 시작되면 마감한다. 공이 구른 뒤에 거는 건 공평하지 않다.
 *  · 베스트드레서: 마지막 경기가 끝나면 마감한다. 그 뒤가 시상식이다.
 * 결과는 마감 전에는 "몇 명 참여"만 보여 준다. 남 따라 찍는 걸 막으려는 것.
 */
export default function VotePanel({ event, matches }: Props) {
  const voterKey = useMemo(() => getVoterKey(), []);
  const [tallies, setTallies] = useState<Record<VoteKind, VoteTally> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<VoteKind | null>(null);

  const visible = matches.filter((m) => m.status !== "hidden");
  const started = visible.some(
    (m) => m.status === "playing" || m.status === "done",
  );
  const allDone =
    visible.length > 0 && visible.every((m) => m.status === "done");

  // 토토는 첫 경기가 시작되면, 베스트드레서는 모든 경기가 끝나면 닫힌다
  const closed: Record<VoteKind, boolean> = {
    champion: started,
    dresser_m: allDone,
    dresser_f: allDone,
  };

  const load = useCallback(async () => {
    try {
      setTallies(await fetchVoteTallies(event.id, voterKey));
      setError("");
    } catch {
      setError("투표를 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.");
    } finally {
      setLoaded(true);
    }
  }, [event.id, voterKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pick(kind: VoteKind, choice: string) {
    if (closed[kind] || !voterKey) return;
    setBusy(kind);
    try {
      await castVote(event.id, kind, voterKey, choice);
      await load();
      setError("");
    } catch {
      setError("표를 넣지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setBusy(null);
    }
  }

  const genderOf = (name: string): Gender | undefined =>
    event.roster.find((r) => r.name === name)?.gender;
  const men = event.roster.filter((r) => r.gender === "M").map((r) => r.name);
  const women = event.roster.filter((r) => r.gender === "F").map((r) => r.name);

  if (!voterKey) {
    return (
      <StCard>
        <StCardHead>
          <StCardTitle>🗳️ 대회 투표</StCardTitle>
        </StCardHead>
        <StNotice $tone="error">
          이 브라우저는 저장이 막혀 있어 투표할 수 없어요. 시크릿 모드가 아닌
          창에서 열어 주세요.
        </StNotice>
      </StCard>
    );
  }

  if (!tallies) {
    return (
      <StCard>
        <StCardHead>
          <StCardTitle>🗳️ 대회 투표</StCardTitle>
        </StCardHead>
        {loaded ? (
          <>
            <StNotice $tone="error">
              {error || "투표를 불러오지 못했어요."}
            </StNotice>
            <StCardHint>
              저장 공간에 투표 칸이 아직 없을 수 있어요. 관리자는
              supabase/20261006_create_tennis_votes.sql 을 Supabase SQL Editor
              에서 한 번 실행해 주세요.
            </StCardHint>
          </>
        ) : (
          <>
            <SkeletonBlock width="min(100%, 20rem)" height="0.9rem" />
            <SkeletonBlock width="100%" height="7rem" radius="0.8rem" />
            <SkeletonBlock width="100%" height="7rem" radius="0.8rem" />
          </>
        )}
      </StCard>
    );
  }

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🗳️ 대회 투표</StCardTitle>
      </StCardHead>
      <StCardHint>
        이름을 받지 않는 익명 투표예요. 한 폰에 한 표씩이고, 마감 전에는 몇
        번이든 고칠 수 있어요.
      </StCardHint>
      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      <Section
        kind="champion"
        title="🏆 우승팀 토토"
        hint={
          closed.champion
            ? "첫 경기가 시작돼서 마감됐어요."
            : "어느 팀이 우승할까요? 첫 경기가 시작되면 마감돼요."
        }
        options={event.teams.map((t) => ({
          value: String(t.seed),
          label: `${t.seed}팀`,
          sub: t.players.map((p) => p.name).join(" · "),
        }))}
        tally={tallies.champion}
        closed={closed.champion}
        busy={busy === "champion"}
        onPick={pick}
      />

      <Section
        kind="dresser_m"
        title="👔 베스트드레서 남성부"
        hint={
          closed.dresser_m
            ? "경기가 모두 끝나 결과를 공개해요."
            : "마지막 경기가 끝나면 공개돼요."
        }
        options={men.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_m}
        closed={closed.dresser_m}
        busy={busy === "dresser_m"}
        onPick={pick}
      />

      <Section
        kind="dresser_f"
        title="👗 베스트드레서 여성부"
        hint={
          closed.dresser_f
            ? "경기가 모두 끝나 결과를 공개해요."
            : "마지막 경기가 끝나면 공개돼요."
        }
        options={women.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_f}
        closed={closed.dresser_f}
        busy={busy === "dresser_f"}
        onPick={pick}
      />
    </StCard>
  );
}

type Option = { value: string; label: string; sub?: string; gender?: Gender };

function Section({
  kind,
  title,
  hint,
  options,
  tally,
  closed,
  busy,
  onPick,
}: {
  kind: VoteKind;
  title: string;
  hint: string;
  options: Option[];
  tally: VoteTally;
  closed: boolean;
  busy: boolean;
  onPick: (kind: VoteKind, choice: string) => void;
}) {
  const votesOf = (value: string) =>
    tally.counts.find((c) => c.choice === value)?.votes ?? 0;
  const top = tally.counts[0]?.votes ?? 0;

  return (
    <StSection>
      <StSectionHead>
        <StSectionTitle>{title}</StSectionTitle>
        <StCount>{tally.total}명 참여</StCount>
      </StSectionHead>
      <StSectionHint>{hint}</StSectionHint>

      {closed && tally.total === 0 ? (
        <StEmpty>표가 하나도 없어요.</StEmpty>
      ) : null}

      <StOptions>
        {options.map((option) => {
          const mine = tally.mine === option.value;
          const votes = votesOf(option.value);
          const winner = closed && votes > 0 && votes === top;
          return (
            <StOption
              key={option.value}
              type="button"
              disabled={closed || busy}
              $mine={mine}
              $winner={winner}
              onClick={() => onPick(kind, option.value)}
              aria-label={`${VOTE_LABEL[kind]} ${option.label}${mine ? " (내가 고른 것)" : ""}`}
            >
              {/* 마감 뒤에만 득표율 막대를 칠한다 */}
              {closed && top > 0 ? (
                <StBar style={{ width: `${(votes / top) * 100}%` }} />
              ) : null}
              <StOptionBody>
                <StOptionName>
                  {option.label}
                  {option.gender ? (
                    <StGender $color={GENDER_COLOR[option.gender]}>
                      {GENDER_LABEL[option.gender]}
                    </StGender>
                  ) : null}
                </StOptionName>
                {option.sub ? <StOptionSub>{option.sub}</StOptionSub> : null}
              </StOptionBody>
              <StOptionRight>
                {closed ? (
                  <StVotes>{votes}표</StVotes>
                ) : mine ? (
                  <StMine>내 표</StMine>
                ) : null}
              </StOptionRight>
            </StOption>
          );
        })}
      </StOptions>
    </StSection>
  );
}

/* 카드 안이라 테두리를 더하지 않고 옅은 바탕 띠로만 묶는다 */
const StSection = styled.section`
  margin-top: 0.9rem;
  padding: 0.85rem 0.9rem 0.95rem;
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StSectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
`;

const StSectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StCount = styled.span`
  flex-shrink: 0;
  font-size: 0.76rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
  font-variant-numeric: tabular-nums;
`;

const StSectionHint = styled.p`
  margin: 0.25rem 0 0.7rem;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray500};
  word-break: keep-all;
`;

const StEmpty = styled.p`
  margin-bottom: 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  gap: 0.4rem;
`;

const StOption = styled.button<{ $mine: boolean; $winner: boolean }>`
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border-radius: 0.6rem;
  text-align: left;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid
    ${({ theme, $mine, $winner }) =>
      $winner
        ? theme.semantic.primary
        : $mine
          ? theme.semantic.primary
          : theme.colors.gray100};
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

/* 득표율 막대는 글자 뒤에 깔린다 */
const StBar = styled.span`
  position: absolute;
  inset: 0 auto 0 0;
  background: ${({ theme }) => theme.colors.blue50 ?? "#eff6ff"};
`;

const StOptionBody = styled.span`
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const StOptionName = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  word-break: keep-all;
`;

const StOptionSub = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StGender = styled.span<{ $color: string }>`
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const StOptionRight = styled.span`
  position: relative;
  flex-shrink: 0;
`;

const StVotes = styled.span`
  font-size: 0.78rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.primary};
  font-variant-numeric: tabular-nums;
`;

const StMine = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
`;
