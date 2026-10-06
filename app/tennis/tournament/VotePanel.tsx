"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { ResolvedMatch, TournamentEvent } from "./types";
import { placements } from "./resolve";
import { GENDER_COLOR, GENDER_LABEL, type Gender } from "../types";
import { getVoterName, playerVoterKey, setVoterName } from "../voterKey";
import {
  castVote,
  fetchVoteTallies,
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
 * 대회 투표 — 우승팀 토토와 베스트드레서(남성부·여성부). (주인 요청 2026-10-06)
 *
 * 누가 찍었는지에 대한 규칙이 둘로 나뉜다.
 *  · 들어올 때는 참가자 명단에서 본인 이름을 고른다. 그래야 한 사람 한 표가 확실해진다.
 *  · 우승팀 토토는 맞춘 사람에게 상을 줘야 해서 마감 뒤 누가 어느 팀에 걸었는지 보여 준다.
 *  · 베스트드레서는 득표 수만 보여 주고 누가 누구를 골랐는지는 화면에 절대 띄우지 않는다.
 *
 * 마감은 전부 경기 진행에서 자동으로 나온다. 버튼을 두면 링크를 아는 누구나 누를 수 있다.
 *  · 토토: 첫 경기가 시작되면. 공이 구른 뒤에 거는 건 공평하지 않다.
 *  · 베스트드레서: 그랜드 파이널이 끝나면. 그 뒤가 시상식이다.
 */
export default function VotePanel({ event, matches }: Props) {
  const [myName, setMyName] = useState("");
  const [tallies, setTallies] = useState<Record<VoteKind, VoteTally> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<VoteKind | null>(null);

  useEffect(() => {
    setMyName(getVoterName());
  }, []);

  const myKey = myName ? playerVoterKey(myName) : "";

  const visible = matches.filter((m) => m.status !== "hidden");
  const started = visible.some(
    (m) => m.status === "playing" || m.status === "done",
  );
  // 그랜드 파이널이 끝나면 연다. "모든 경기"로 하면 5-6위전 점수를 깜빡했을 때 영영 못 본다
  const finalDone = visible.some(
    (m) => m.template.stage === "grand-final" && m.status === "done",
  );
  // 아무도 점수를 안 넣은 경우까지 대비해, 대회 날짜가 지나면 무조건 연다
  const dayPassed = new Date(`${event.date}T23:59:59`) < new Date();
  const closed: Record<VoteKind, boolean> = {
    champion: started || dayPassed,
    dresser_m: finalDone || dayPassed,
    dresser_f: finalDone || dayPassed,
  };

  const winner = useMemo(
    () => placements(matches).find((p) => p.rank === 1)?.team ?? null,
    [matches],
  );

  const load = useCallback(async () => {
    try {
      setTallies(await fetchVoteTallies(event.id, myKey));
      setError("");
    } catch {
      setError("투표를 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.");
    } finally {
      setLoaded(true);
    }
  }, [event.id, myKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function chooseName(name: string) {
    setMyName(name);
    setVoterName(name);
  }

  async function pick(kind: VoteKind, choice: string) {
    if (closed[kind] || !myKey) return;
    setBusy(kind);
    try {
      await castVote(event.id, kind, myKey, choice);
      await load();
      setError("");
    } catch {
      setError("표를 넣지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setBusy(null);
    }
  }

  const byName = [...event.roster].sort((a, b) =>
    a.name.localeCompare(b.name, "ko"),
  );
  const men = event.roster.filter((r) => r.gender === "M").map((r) => r.name);
  const women = event.roster.filter((r) => r.gender === "F").map((r) => r.name);
  const genderOf = (name: string): Gender | undefined =>
    event.roster.find((r) => r.name === name)?.gender;

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
        한 사람 한 표예요. 마감 전에는 몇 번이든 고칠 수 있어요.
      </StCardHint>

      {/* 누구인지 먼저 고른다 — 한 사람 한 표를 지키려면 이름이 필요하다 */}
      <StMeBox>
        <StMeLabel htmlFor="vote-me">내 이름</StMeLabel>
        <StSelect
          id="vote-me"
          value={myName}
          onChange={(e) => chooseName(e.target.value)}
        >
          <option value="">고르기</option>
          {byName.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </StSelect>
        <StMeHint>
          {myName
            ? "이 폰에 기억해 둬서 다음에 올 때 다시 안 골라도 돼요."
            : "이름을 골라야 투표할 수 있어요."}
        </StMeHint>
      </StMeBox>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      <Section
        kind="champion"
        title="🏆 우승팀 토토"
        hint={
          closed.champion
            ? "경기가 시작돼 마감됐어요."
            : "어느 팀이 우승할까요? 첫 경기가 시작되면 마감돼요."
        }
        warn={
          closed.champion
            ? ""
            : "첫 경기가 시작되면 더는 고칠 수 없어요. 신중하게 고르세요."
        }
        reveal="누가 어느 팀에 걸었는지 마감 뒤에 공개돼요. 맞춘 사람을 가려야 하니까요."
        options={event.teams.map((t) => ({
          value: String(t.seed),
          label: `${t.seed}팀`,
          sub: t.players.map((p) => p.name).join(" · "),
        }))}
        tally={tallies.champion}
        closed={closed.champion}
        busy={busy === "champion"}
        canVote={!!myName}
        showNames
        winnerValue={winner ? String(winner.seed) : null}
        onPick={pick}
      />

      <Section
        kind="dresser_m"
        title="👔 베스트드레서 남성부"
        hint={
          closed.dresser_m
            ? "대회가 끝나 결과를 공개해요."
            : "그랜드 파이널이 끝나면 공개돼요."
        }
        reveal="누가 누구를 골랐는지는 끝까지 보여 주지 않아요. 표 수만 나와요."
        options={men.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_m}
        closed={closed.dresser_m}
        busy={busy === "dresser_m"}
        canVote={!!myName}
        onPick={pick}
      />

      <Section
        kind="dresser_f"
        title="👗 베스트드레서 여성부"
        hint={
          closed.dresser_f
            ? "대회가 끝나 결과를 공개해요."
            : "그랜드 파이널이 끝나면 공개돼요."
        }
        reveal="누가 누구를 골랐는지는 끝까지 보여 주지 않아요. 표 수만 나와요."
        options={women.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_f}
        closed={closed.dresser_f}
        busy={busy === "dresser_f"}
        canVote={!!myName}
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
  warn,
  reveal,
  options,
  tally,
  closed,
  busy,
  canVote,
  showNames = false,
  winnerValue = null,
  onPick,
}: {
  kind: VoteKind;
  title: string;
  hint: string;
  /** 되돌릴 수 없다는 경고. 빈 문자열이면 안 보인다 */
  warn?: string;
  /** 누가 골랐는지를 공개하는지 숨기는지 한 줄로 */
  reveal: string;
  options: Option[];
  tally: VoteTally;
  closed: boolean;
  busy: boolean;
  canVote: boolean;
  /** 마감 뒤 "누가 골랐는지"를 보여 줄지 (토토만 참) */
  showNames?: boolean;
  /** 실제 우승팀 (토토 정답). 아직 안 정해졌으면 null */
  winnerValue?: string | null;
  onPick: (kind: VoteKind, choice: string) => void;
}) {
  const votesOf = (value: string) =>
    tally.counts.find((c) => c.choice === value)?.votes ?? 0;
  const top = tally.counts[0]?.votes ?? 0;
  const correct = winnerValue ? (tally.names[winnerValue] ?? []) : [];

  return (
    <StSection>
      <StSectionHead>
        <StSectionTitle>{title}</StSectionTitle>
        <StCount>{tally.total}명 참여</StCount>
      </StSectionHead>
      <StSectionHint>{hint}</StSectionHint>
      <StReveal>{reveal}</StReveal>
      {warn ? (
        <StWarn>
          <span aria-hidden="true">⚠️</span>
          <span>{warn}</span>
        </StWarn>
      ) : null}

      {/* 토토 정답 발표 — 우승팀이 정해진 뒤에만 */}
      {showNames && closed && winnerValue ? (
        <StResult>
          <b>우승은 {winnerValue}팀!</b>{" "}
          {correct.length > 0 ? (
            <>
              맞춘 사람 {correct.length}명 — {correct.join(" · ")}
            </>
          ) : (
            <>맞춘 사람이 없어요.</>
          )}
        </StResult>
      ) : null}

      {closed && tally.total === 0 ? (
        <StEmpty>표가 하나도 없어요.</StEmpty>
      ) : null}

      <StOptions>
        {options.map((option) => {
          const mine = tally.mine === option.value;
          const votes = votesOf(option.value);
          const best = closed && votes > 0 && votes === top;
          const isWinner = showNames && closed && winnerValue === option.value;
          const who =
            showNames && closed ? (tally.names[option.value] ?? []) : [];
          return (
            <StOption
              key={option.value}
              type="button"
              disabled={closed || busy || !canVote}
              $mine={mine}
              $highlight={isWinner || best}
              onClick={() => onPick(kind, option.value)}
              aria-label={`${title} ${option.label}${mine ? " (내가 고른 것)" : ""}`}
            >
              {closed && top > 0 ? (
                <StBar style={{ width: `${(votes / top) * 100}%` }} />
              ) : null}
              <StOptionBody>
                <StOptionName>
                  {isWinner ? <span aria-hidden="true">🏆</span> : null}
                  {option.label}
                  {option.gender ? (
                    <StGender $color={GENDER_COLOR[option.gender]}>
                      {GENDER_LABEL[option.gender]}
                    </StGender>
                  ) : null}
                </StOptionName>
                {who.length > 0 ? (
                  <StWho>{who.join(" · ")}</StWho>
                ) : option.sub ? (
                  <StOptionSub>{option.sub}</StOptionSub>
                ) : null}
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

/* 이름 고르는 칸 — 입력 도구라 테두리를 가진다 */
const StMeBox = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 12rem);
  align-items: center;
  gap: 0.4rem 0.6rem;
  margin-top: 0.8rem;
`;

const StMeLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StSelect = styled.select`
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StMeHint = styled.p`
  grid-column: 1 / -1;
  font-size: 0.74rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray400};
  word-break: keep-all;
`;

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
  margin: 0.25rem 0 0.2rem;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray500};
  word-break: keep-all;
`;

const StReveal = styled.p`
  margin-bottom: 0.65rem;
  font-size: 0.73rem;
  font-weight: 600;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray400};
  word-break: keep-all;
`;

/* 되돌릴 수 없다는 경고 */
const StWarn = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0 0 0.7rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.amber50 ?? "#fffbeb"};
  color: ${({ theme }) => theme.colors.amber600 ?? "#b45309"};
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.5;
  word-break: keep-all;
`;

const StResult = styled.p`
  margin: 0 0 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.gray700};
  word-break: keep-all;

  b {
    color: ${({ theme }) => theme.semantic.primary};
    font-weight: 900;
  }
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

const StOption = styled.button<{ $mine: boolean; $highlight: boolean }>`
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
    ${({ theme, $mine, $highlight }) =>
      $highlight || $mine ? theme.semantic.primary : theme.colors.gray100};
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

const StWho = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  word-break: keep-all;
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
