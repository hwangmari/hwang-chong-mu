"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { ResolvedMatch, TournamentEvent } from "./types";
import { placements } from "./resolve";
import { GENDER_COLOR, GENDER_LABEL, type Gender } from "../types";
import {
  clearSavedVoter,
  getSavedVoter,
  playerVoterKey,
  saveVoter,
} from "../voterKey";
import {
  castVote,
  checkOrCreatePin,
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
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateMsg, setGateMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const [tallies, setTallies] = useState<Record<VoteKind, VoteTally> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<VoteKind | null>(null);

  // 이 폰에서 지난번에 통과한 이름·비번이 있으면 바로 연다
  useEffect(() => {
    const saved = getSavedVoter();
    if (!saved) return;
    setMyName(saved.name);
    setPin(saved.pin);
    setUnlocked(true);
  }, []);

  const myKey = unlocked && myName ? playerVoterKey(myName) : "";

  const visible = matches.filter((m) => m.status !== "hidden");
  const started = visible.some(
    (m) => m.status === "playing" || m.status === "done",
  );
  // 그랜드 파이널이 끝나면 대회가 끝난 것으로 본다. "모든 경기"로 하면
  // 5-6위전 점수를 깜빡했을 때 시상식인데 결과를 영영 못 본다
  const finalDone = visible.some(
    (m) => m.template.stage === "grand-final" && m.status === "done",
  );
  // 아무도 점수를 안 넣은 경우까지 대비해, 대회 날짜가 지나면 무조건 연다
  const dayPassed = new Date(`${event.date}T23:59:59`) < new Date();
  const over = finalDone || dayPassed;

  // "마감"과 "공개"는 다른 순간이다.
  //  · 토토는 첫 경기가 시작되면 더 못 고치지만, 결과는 대회가 끝나야 보여 준다.
  //    경기 중에 누가 어디에 걸었는지 보이면 응원이 한쪽으로 쏠린다.
  //  · 베스트드레서는 대회가 끝나는 순간 마감과 공개가 같이 일어난다.
  const locked: Record<VoteKind, boolean> = {
    champion: started || dayPassed,
    dresser_m: over,
    dresser_f: over,
  };
  const revealed: Record<VoteKind, boolean> = {
    champion: over,
    dresser_m: over,
    dresser_f: over,
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

  async function unlock() {
    if (!myName || pin.length !== 4) return;
    setChecking(true);
    try {
      const result = await checkOrCreatePin(event.id, myName, pin);
      if (result === "wrong") {
        setGateMsg("비번이 달라요. 처음 투표할 때 정한 네 자리를 넣어 주세요.");
        setUnlocked(false);
        return;
      }
      saveVoter(myName, pin);
      setUnlocked(true);
      setGateMsg(
        result === "created"
          ? `${myName}님의 비번을 정했어요. 다음에도 이 번호예요.`
          : "",
      );
    } catch {
      setGateMsg("확인하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setChecking(false);
    }
  }

  function relock() {
    clearSavedVoter();
    setUnlocked(false);
    setMyName("");
    setPin("");
    setGateMsg("");
  }

  async function pick(kind: VoteKind, choice: string) {
    if (locked[kind] || !myKey) return;
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
              저장 공간에 투표 칸이 아직 없을 수 있어요. 관리자는 supabase
              폴더의 20261006_create_tennis_votes.sql 과
              20261006_add_tennis_vote_pins.sql 을 Supabase SQL Editor 에서
              실행해 주세요.
            </StCardHint>
          </>
        ) : (
          <>
            <SkeletonBlock width="min(100%, 20rem)" height="0.9rem" />
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
        한 사람 한 표. 마감 전에는 몇 번이든 고칠 수 있어요.
      </StCardHint>

      {/* 이름과 비번을 통과해야 연다 — 비번이 없으면 남의 이름을 골라 그 사람 표를 볼 수 있다 */}
      <StGate>
        {unlocked ? (
          <StGateOpen>
            <span>
              <b>{myName}</b>님으로 투표 중
            </span>
            <StGhost type="button" onClick={relock}>
              다른 사람
            </StGhost>
          </StGateOpen>
        ) : (
          <>
            <StGateRow>
              <StGateLabel htmlFor="vote-me">내 이름</StGateLabel>
              <StSelect
                id="vote-me"
                value={myName}
                onChange={(e) => {
                  setMyName(e.target.value);
                  setGateMsg("");
                }}
              >
                <option value="">고르기</option>
                {byName.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </StSelect>
            </StGateRow>
            <StGateRow>
              <StGateLabel htmlFor="vote-pin">비번 4자리</StGateLabel>
              <StPin
                id="vote-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="0000"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setGateMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void unlock();
                }}
              />
              <StGoBtn
                type="button"
                onClick={() => void unlock()}
                disabled={!myName || pin.length !== 4 || checking}
              >
                {checking ? "확인 중…" : "열기"}
              </StGoBtn>
            </StGateRow>
            <StGateHint>처음 넣은 네 자리가 내 비번이 돼요.</StGateHint>
          </>
        )}
        {gateMsg ? <StGateMsg>{gateMsg}</StGateMsg> : null}
      </StGate>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      <Section
        kind="champion"
        title="🏆 우승팀 토토"
        hint={
          revealed.champion
            ? "결과 공개!"
            : locked.champion
              ? "마감됐어요. 결과는 대회가 끝나면 공개돼요."
              : "어느 팀이 우승할까요?"
        }
        warn={locked.champion ? "" : "첫 경기가 시작되면 못 고쳐요."}
        reveal="맞춘 사람은 대회가 끝난 뒤 공개돼요."
        options={event.teams.map((t) => ({
          value: String(t.seed),
          label: `${t.seed}팀`,
          sub: t.players.map((p) => p.name).join(" · "),
        }))}
        tally={tallies.champion}
        locked={locked.champion}
        revealed={revealed.champion}
        busy={busy === "champion"}
        canVote={unlocked}
        showNames
        winnerValue={winner ? String(winner.seed) : null}
        onPick={pick}
      />

      <Section
        kind="dresser_m"
        title="👔 베스트드레서 남성부"
        hint={revealed.dresser_m ? "결과 공개!" : "대회가 끝나면 공개돼요."}
        reveal="누가 골랐는지는 공개하지 않아요. 표 수만 나와요."
        options={men.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_m}
        locked={locked.dresser_m}
        revealed={revealed.dresser_m}
        busy={busy === "dresser_m"}
        canVote={unlocked}
        onPick={pick}
      />

      <Section
        kind="dresser_f"
        title="👗 베스트드레서 여성부"
        hint={revealed.dresser_f ? "결과 공개!" : "대회가 끝나면 공개돼요."}
        reveal="누가 골랐는지는 공개하지 않아요. 표 수만 나와요."
        options={women.map((name) => ({
          value: name,
          label: name,
          gender: genderOf(name),
        }))}
        tally={tallies.dresser_f}
        locked={locked.dresser_f}
        revealed={revealed.dresser_f}
        busy={busy === "dresser_f"}
        canVote={unlocked}
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
  locked,
  revealed,
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
  /** 더 못 고치는 상태 */
  locked: boolean;
  /** 결과(득표·이름)를 보여 주는 상태 */
  revealed: boolean;
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
      {showNames && revealed && winnerValue ? (
        <StResult>
          <b>🏆 {winnerValue}팀 우승</b>
          {correct.length > 0 ? (
            <> · 맞춘 사람 {correct.length}명</>
          ) : (
            <> · 맞춘 사람 없음</>
          )}
        </StResult>
      ) : null}

      {revealed && tally.total === 0 ? (
        <StEmpty>표가 하나도 없어요.</StEmpty>
      ) : null}

      <StOptions>
        {options.map((option) => {
          const mine = tally.mine === option.value;
          const votes = votesOf(option.value);
          const best = revealed && votes > 0 && votes === top;
          const isWinner =
            showNames && revealed && winnerValue === option.value;
          // 이름은 우승팀 칸에만 보여 준다. 모든 칸에 깔면 눈이 갈 데를 잃는다
          const who = isWinner ? (tally.names[option.value] ?? []) : [];
          return (
            <StOption
              key={option.value}
              type="button"
              disabled={locked || busy || !canVote}
              $mine={mine}
              $highlight={isWinner || best}
              onClick={() => onPick(kind, option.value)}
              aria-label={`${title} ${option.label}${mine ? " (내가 고른 것)" : ""}`}
            >
              {revealed && top > 0 ? (
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
                {revealed ? (
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

/* 이름·비번 관문 — 입력 도구라 테두리를 가진다 */
const StGate = styled.div`
  margin-top: 0.8rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StGateOpen = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StGhost = styled.button`
  flex-shrink: 0;
  padding: 0.3rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  cursor: pointer;
`;

const StGateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  & + & {
    margin-top: 0.4rem;
  }
`;

const StGateLabel = styled.label`
  width: 4.4rem;
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StSelect = styled.select`
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StPin = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StGoBtn = styled.button`
  flex-shrink: 0;
  padding: 0.45rem 0.8rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray400};
    cursor: default;
  }
`;

const StGateHint = styled.p`
  margin-top: 0.45rem;
  font-size: 0.74rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray400};
  word-break: keep-all;
`;

const StGateMsg = styled.p`
  margin-top: 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.primary};
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
