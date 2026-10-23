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
  DRESSER_PICKS,
  DRESSER_WINNERS,
  fetchVoteSettings,
  fetchVoteTallies,
  saveVoteSettings,
  type VoteKind,
  type VoteSettings,
  type VoteTally,
} from "@/services/tennisVotes";
import { useModal } from "@/components/common/ModalProvider";
import { SkeletonBlock } from "@/components/common/Skeleton";
import VoteRaceBoard from "./VoteRaceBoard";
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
 * 마감은 관리자 한 명(참가자 명단 중)이 직접 누른다 (주인 결정 2026-10-12).
 * 자동 마감은 없다. 관리자는 본인 이름·비번으로 들어왔을 때만 마감 버튼을 본다.
 *  · 토토: 팀별 표 수·배당은 진짜 토토처럼 늘 보여 준다. 누가 어디에 걸었는지는 대회가 끝나야 공개.
 *  · 베스트드레서: 관리자가 마감하는 순간 득표가 공개된다(시상식).
 */
const POLL_MS = 15_000;
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
  const [settings, setSettings] = useState<VoteSettings | null>(null);
  const [adminPick, setAdminPick] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const { openConfirm } = useModal();

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
  // 그랜드 파이널이 끝나면 대회가 끝난 것으로 본다. "모든 경기"로 하면
  // 5-6위전 점수를 깜빡했을 때 시상식인데 결과를 영영 못 본다
  const finalDone = visible.some(
    (m) => m.template.stage === "grand-final" && m.status === "done",
  );
  // 아무도 점수를 안 넣은 경우까지 대비해, 대회 날짜가 지나면 무조건 연다
  const dayPassed = new Date(`${event.date}T23:59:59`) < new Date();
  const phase = settings?.phase ?? "before";
  const over = finalDone || dayPassed || phase === "ended";

  // "마감"과 "공개"는 다른 순간이다.
  //  · 토토는 진행 요원이 대회를 시작하면 마감된다. 표 수·배당은 늘 보이지만
  //    누가 어디에 걸었는지는 대회가 끝나야 보여 준다 — 응원이 한쪽으로 쏠리지 않게.
  //  · 베스트드레서는 관리자가 마감하는 순간 마감과 공개가 같이 일어난다.
  const closed = settings?.closed ?? { champion: false, dresser: false };
  const admins = settings?.admins ?? [];
  const isAdmin = unlocked && admins.includes(myName);
  const locked: Record<VoteKind, boolean> = {
    champion: phase !== "before" || closed.champion,
    dresser: closed.dresser,
  };
  const revealed: Record<VoteKind, boolean> = {
    champion: over,
    dresser: closed.dresser,
  };

  const winner = useMemo(
    () => placements(matches).find((p) => p.rank === 1)?.team ?? null,
    [matches],
  );

  const load = useCallback(async () => {
    try {
      const [nextTallies, nextSettings] = await Promise.all([
        fetchVoteTallies(event.id, myKey),
        fetchVoteSettings(event.id),
      ]);
      setTallies(nextTallies);
      setSettings(nextSettings);
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

  // 현황판이라 열어 둔 동안 표 수·마감 상태를 따라간다 (점수 화면과 같은 방식)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function setClosed(kind: VoteKind, value: boolean) {
    const label = kind === "champion" ? "우승팀 토토" : "베스트드레서";
    const message = value
      ? `${label}를 마감하고 결과를 공개할까요?`
      : `${label}를 다시 열까요? 다시 표를 고칠 수 있게 돼요.`;
    if (!(await openConfirm(message))) return;
    setAdminBusy(true);
    try {
      setSettings(await saveVoteSettings(event.id, { closed: { [kind]: value } }));
      setError("");
    } catch {
      setError("마감 상태를 바꾸지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function assignAdmin(name: string) {
    if (!name) return;
    if (!(await openConfirm(`${name}님을 관리자로 정할까요? 투표 마감과 경기 진행(시작·점수)을 ${name}님만 할 수 있게 돼요.`))) return;
    setAdminBusy(true);
    try {
      setSettings(await saveVoteSettings(event.id, { admins: [name] }));
      setAdminPick("");
      setError("");
    } catch {
      setError("관리자를 정하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setAdminBusy(false);
    }
  }

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
    if (locked[kind] || !myKey || !tallies) return;
    const now = tallies[kind].mine;
    // 토토는 하나만 고른다. 베스트드레서는 눌러서 넣고 다시 눌러 뺀다(최대 세 명)
    let next: string[];
    if (kind === "champion") {
      next = [choice];
    } else if (now.includes(choice)) {
      next = now.filter((c) => c !== choice);
    } else if (now.length >= DRESSER_PICKS) {
      return; // 세 명을 이미 골랐다 — 빼고 다시 고르게 둔다
    } else {
      next = [...now, choice];
    }
    // 화면에서 막아 두지만, 혹시 예전 표가 남아 있어도 본인은 빠지게 한 번 더 거른다
    if (kind === "dresser") next = next.filter((name) => name !== myName);
    setBusy(kind);
    try {
      await castVote(event.id, kind, myKey, next);
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

      {/* 관리자 본인에게만 보이는 마감 버튼 */}
      {isAdmin ? (
        <StAdmin>
          <StAdminTitle>
            🔐 관리자 · 베스트드레서 마감 (토토는 대회 시작과 함께 마감돼요)
          </StAdminTitle>
          <StAdminRow>
            <span>
              베스트드레서 <b>{closed.dresser ? "마감·공개됨" : "받는 중"}</b>
            </span>
            <StGhost
              type="button"
              disabled={adminBusy}
              onClick={() => void setClosed("dresser", !closed.dresser)}
            >
              {closed.dresser ? "다시 열기" : "마감하고 공개"}
            </StGhost>
          </StAdminRow>
        </StAdmin>
      ) : null}

      {/* 관리자가 아직 없는 대회 — 들어온 사람이 한 번 정한다. 정한 뒤에는 그 사람만 바꿀 수 있다 */}
      {settings && admins.length === 0 && unlocked ? (
        <StAdmin>
          <StAdminTitle>🔐 투표 관리자가 아직 없어요</StAdminTitle>
          <StAdminRow>
            <StSelect
              aria-label="투표 관리자"
              value={adminPick}
              onChange={(e) => setAdminPick(e.target.value)}
            >
              <option value="">관리자 고르기</option>
              {byName.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </StSelect>
            <StGoBtn
              type="button"
              disabled={!adminPick || adminBusy}
              onClick={() => void assignAdmin(adminPick)}
            >
              정하기
            </StGoBtn>
          </StAdminRow>
        </StAdmin>
      ) : null}

      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      <Section
        kind="champion"
        title="🏆 우승팀 토토"
        hint={
          revealed.champion
            ? "결과 공개!"
            : locked.champion
              ? "대회가 시작돼 마감됐어요. 맞춘 사람은 대회가 끝나면 공개돼요."
              : "어느 팀이 우승할까요? 대회가 시작되면 마감돼요."
        }
        reveal="팀별 표 수·배당은 실시간으로 보여요. 누가 어디에 걸었는지는 대회가 끝난 뒤 공개돼요."
        live
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
        kind="dresser"
        title="👗 베스트드레서"
        hint={
          revealed.dresser ? "결과 공개!" : "관리자가 마감하면 공개돼요."
        }
        reveal={`${DRESSER_PICKS}명까지 고를 수 있어요(나는 빼고). 최다 득표 ${DRESSER_WINNERS}명이 수상해요. 누가 골랐는지는 공개하지 않아요.`}
        options={event.roster.map((r) => ({
          value: r.name,
          label: r.name,
          gender: r.gender,
        }))}
        tally={tallies.dresser}
        locked={locked.dresser}
        revealed={revealed.dresser}
        busy={busy === "dresser"}
        canVote={unlocked}
        maxPicks={DRESSER_PICKS}
        winnerCount={DRESSER_WINNERS}
        excludeValue={myName}
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
  reveal,
  options,
  tally,
  locked,
  revealed,
  busy,
  canVote,
  showNames = false,
  live = false,
  winnerValue = null,
  maxPicks = 1,
  winnerCount = 1,
  excludeValue = "",
  onPick,
}: {
  kind: VoteKind;
  title: string;
  hint: string;
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
  /** 현황판: 공개 전에도 표 수·비율·배당을 늘 보여 준다 (토토만 참) */
  live?: boolean;
  /** 실제 우승팀 (토토 정답). 아직 안 정해졌으면 null */
  winnerValue?: string | null;
  /** 한 사람이 고를 수 있는 수 */
  maxPicks?: number;
  /** 마감 뒤 수상자로 표시할 인원 (최다 득표 순) */
  winnerCount?: number;
  /** 고를 수 없는 값 — 본인은 본인을 뽑지 못한다 */
  excludeValue?: string;
  onPick: (kind: VoteKind, choice: string) => void;
}) {
  const votesOf = (value: string) =>
    tally.counts.find((c) => c.choice === value)?.votes ?? 0;
  const top = tally.counts[0]?.votes ?? 0;
  // 현황판이면 공개 전에도 숫자를 보여 준다
  const showCounts = revealed || live;
  // 최다 득표 순으로 수상 인원만큼 — 동점이면 함께 올린다
  const cut = tally.counts[winnerCount - 1]?.votes ?? 0;
  const awarded = new Set(
    cut > 0
      ? tally.counts.filter((c) => c.votes >= cut).map((c) => c.choice)
      : [],
  );
  // 하나만 고르는 투표(토토)는 다른 걸 누르면 바뀌어야 하므로 "꽉 참"으로 막지 않는다
  const full = maxPicks > 1 && tally.mine.length >= maxPicks;
  const correct = winnerValue ? (tally.names[winnerValue] ?? []) : [];

  return (
    <StSection>
      <StSectionHead>
        <StSectionTitle>{title}</StSectionTitle>
        <StCount>{tally.total}명 참여</StCount>
      </StSectionHead>
      <StSectionHint>{hint}</StSectionHint>
      <StReveal>{reveal}</StReveal>

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

      {showCounts && tally.total === 0 ? (
        <StEmpty>{live && !revealed ? "아직 건 사람이 없어요." : "표가 하나도 없어요."}</StEmpty>
      ) : null}

      {live ? (
        <VoteRaceBoard
          kind={kind}
          title={title}
          options={options}
          tally={tally}
          locked={locked}
          busy={busy}
          canVote={canVote}
          revealed={revealed}
          winnerValue={winnerValue}
          onPick={onPick}
        />
      ) : (
      <StOptions>
        {options.map((option) => {
          const mine = tally.mine.includes(option.value);
          const isMe = !!excludeValue && option.value === excludeValue;
          const votes = votesOf(option.value);
          const best = revealed && awarded.has(option.value);
          const isWinner =
            showNames && revealed && winnerValue === option.value;
          // 이름은 우승팀 칸에만 보여 준다. 모든 칸에 깔면 눈이 갈 데를 잃는다
          const who = isWinner ? (tally.names[option.value] ?? []) : [];
          return (
            <StOption
              key={option.value}
              type="button"
              disabled={locked || busy || !canVote || isMe || (!mine && full)}
              data-me={isMe}
              $mine={mine}
              $highlight={isWinner || best}
              onClick={() => onPick(kind, option.value)}
              aria-label={`${title} ${option.label}${mine ? " (내가 고른 것)" : ""}`}
            >
              {showCounts && top > 0 ? (
                // 현황판은 전체 중 비율, 결과 공개는 1등 대비 길이
                <StBar
                  style={{
                    width: `${(votes / (live ? tally.total : top)) * 100}%`,
                  }}
                />
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
                  {isMe ? <StMe>나</StMe> : null}
                  {live && mine ? <StMine>내 표</StMine> : null}
                </StOptionName>
                {who.length > 0 ? (
                  <StWho>{who.join(" · ")}</StWho>
                ) : option.sub ? (
                  <StOptionSub>{option.sub}</StOptionSub>
                ) : null}
              </StOptionBody>
              <StOptionRight>
                {live ? (
                  // 배당 = 전체 표 ÷ 이 팀 표. 적게 걸린 팀일수록 높다
                  <StOdds>
                    <StVotes>{votes}표</StVotes>
                    <span>
                      {votes > 0
                        ? `${(tally.total / votes).toFixed(1)}배`
                        : "-"}
                    </span>
                  </StOdds>
                ) : revealed ? (
                  <StVotes>{votes}표</StVotes>
                ) : mine ? (
                  <StMine>내 표</StMine>
                ) : null}
              </StOptionRight>
            </StOption>
          );
        })}
      </StOptions>
      )}
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

  &[data-me="true"] {
    opacity: 0.45;
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

/* 본인 칸 — 고를 수 없다는 걸 글자로 알려 준다 */
const StMe = styled.span`
  padding: 0.05rem 0.3rem;
  border-radius: 0.3rem;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.62rem;
  font-weight: 800;
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

/* 현황판 숫자 — 칸마다 같은 폭으로 오른쪽 정렬해 줄이 맞게 */
const StOdds = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 2.8rem;
  font-variant-numeric: tabular-nums;

  span:last-child {
    font-size: 0.68rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

/* 관리자 칸 — 카드 안이라 테두리 없이 옅은 바탕 띠로 */
const StAdmin = styled.div`
  margin-top: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StAdminTitle = styled.p`
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StAdminRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray900};
  }

  & + & {
    margin-top: 0.4rem;
  }
`;

const StMine = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
`;
