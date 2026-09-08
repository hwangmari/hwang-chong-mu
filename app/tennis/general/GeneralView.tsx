"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GeneralBracket from "./GeneralBracket";
import GeneralMatchCard from "./GeneralMatchCard";
import {
  blockNumbers,
  blockTimeOf,
  buildKnockoutMatches,
  countFinishedGeneral,
  expectedEnd,
  groupsAllFinished,
  groupStandings,
  hasKnockoutScores,
  leagueStandings,
  resolveGeneral,
  teamPath,
} from "./resolve";
import { FORMAT_LABEL, type GeneralEvent, type TeamStanding } from "./types";
import { formatDate } from "../format";
import {
  deleteTennisScore,
  fetchTennisScores,
  saveTennisScore,
  startTennisMatch,
  upsertGeneral,
} from "@/services/tennis";
import {
  StActions,
  StBlockHead,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StCourtBoard,
  StCourtCard,
  StCourtHead,
  StCourtSlot,
  StCourtSlotLabel,
  StCourtSlotMain,
  StCourtTitle,
  StGhostBtn,
  StHeader,
  StMatchGrid,
  StNotice,
  StPage,
  StPlacementRow,
  StPrimaryBtn,
  StQueueList,
  StRank,
  StRoundTime,
  StRoundTitle,
  StRuleBadge,
  StSeedTag,
  StStateBadge,
  StStatBox,
  StStatGrid,
  StStatLabel,
  StStatValue,
  StSubtitle,
  StTab,
  StTabRow,
  StTable,
  StTableWrap,
  StTeamName,
  StTeamSubName,
  StTitle,
} from "../page.styles";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { isFinished, type Court, type MatchScore, type ScoreMap } from "../types";
import { courtLetters } from "../timeline";
import { jumpToMatch } from "../jump";

type Props = { initialEvent: GeneralEvent };
type Tab = "schedule" | "standings" | "bracket" | "teams";
type StorageMode = "cloud" | "local";

const POLL_MS = 20_000;

function toMap(list: MatchScore[]): ScoreMap {
  const map: ScoreMap = {};
  for (const s of list) map[s.matchNo] = s;
  return map;
}
const localKey = (id: string) => `hcm:tennis:${id}:scores`;
function loadLocal(id: string): ScoreMap {
  try {
    const raw = window.localStorage.getItem(localKey(id));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? toMap(parsed as MatchScore[]) : {};
  } catch {
    return {};
  }
}
function saveLocal(id: string, map: ScoreMap) {
  window.localStorage.setItem(localKey(id), JSON.stringify(Object.values(map)));
}

function StandingsTable({ rows }: { rows: TeamStanding[] }) {
  return (
    <StTableWrap>
      <StTable>
        <thead>
          <tr>
            <th>순위</th>
            <th className="name">팀</th>
            <th>경기</th>
            <th>승</th>
            <th>패</th>
            <th>득실</th>
            <th>딴 게임</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team.id} className={row.advancing ? "top" : undefined}>
              <td className="rank">{row.rank}</td>
              <td className="name">
                <StSeedTag>#{row.team.seed}</StSeedTag> {row.team.name}
                {row.team.players.length > 0 ? <StTeamSubName>{row.team.players.join(" · ")}</StTeamSubName> : null}
              </td>
              <td className="muted">
                {row.played}/{row.scheduled}
              </td>
              <td className="points">{row.wins}</td>
              <td className="muted">{row.losses}</td>
              <td>
                {row.diff > 0 ? "+" : ""}
                {row.diff}
              </td>
              <td className="muted">{row.gamesFor}</td>
            </tr>
          ))}
        </tbody>
      </StTable>
    </StTableWrap>
  );
}

export default function GeneralView({ initialEvent }: Props) {
  const [event, setEvent] = useState<GeneralEvent>(initialEvent);

  // 저장 공간 버전이 뒤늦게 도착하면 갈아탄다 (TournamentView와 같은 이유)
  useEffect(() => {
    setEvent((prev) => (prev.id === initialEvent.id && prev !== initialEvent ? initialEvent : prev));
  }, [initialEvent]);
  const eventId = event.id;
  const format = event.settings.format;
  const [tab, setTab] = useState<Tab>("schedule");
  const [scores, setScores] = useState<ScoreMap>({});
  const [mode, setMode] = useState<StorageMode>("cloud");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showTeams, setShowTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState(0);
  const autoBuilt = useRef(false); // 결선 자동 생성을 한 번만 시도하기 위한 잠금

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.getHours() * 60 + d.getMinutes());
    };
    const timer = window.setInterval(tick, 30_000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, []);

  const reload = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const list = await fetchTennisScores(eventId);
        setScores(toMap(list));
        setMode("cloud");
        setError("");
      } catch {
        setMode((prev) => {
          if (prev === "cloud") setScores(loadLocal(eventId));
          return "local";
        });
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (mode !== "cloud") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload(true);
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode, reload]);

  const matches = useMemo(() => resolveGeneral(event, scores), [event, scores]);
  const progress = countFinishedGeneral(matches);
  const groupRows = useMemo(() => groupStandings(event, scores), [event, scores]);
  const leagueRows = useMemo(
    () => (format === "league" ? leagueStandings(event, scores) : []),
    [format, event, scores],
  );
  const courts = courtLetters(event.courts);
  const groupProgress = useMemo(() => {
    const list = event.matches.filter((m) => m.stage === "group");
    return { done: list.filter((m) => isFinished(scores[m.no])).length, total: list.length };
  }, [event.matches, scores]);

  // 코트별 현황: 지금 뛰는 경기 (시작했고 아직 점수 없음)
  const playingByCourt = new Map<Court, (typeof matches)[number]>();
  for (const m of matches) {
    const sc = scores[m.match.no];
    if (sc?.startedAt && !isFinished(sc) && sc.court) playingByCourt.set(sc.court, m);
  }
  const occupied = new Set<Court>(playingByCourt.keys());
  const playingTeams = new Set<string>();
  for (const m of playingByCourt.values()) {
    if (m.teamA) playingTeams.add(m.teamA.id);
    if (m.teamB) playingTeams.add(m.teamB.id);
  }
  const readyMatches = matches.filter((m) => m.status === "ready");
  const upNext = [...readyMatches, ...matches.filter((m) => m.status === "waiting")].slice(0, 4);
  const waitingReason = (m: (typeof matches)[number]) => {
    const parts: string[] = [];
    if (!m.teamA) parts.push(m.aLabel);
    if (!m.teamB) parts.push(m.bLabel);
    if (parts.length === 0) {
      const busyTeams = [m.teamA, m.teamB].filter((t) => t && playingTeams.has(t.id)).map((t) => t!.name);
      return busyTeams.length > 0 ? `${busyTeams.join(", ")} 경기 끝나면` : "";
    }
    return `${parts.join(" · ")} 결과 나오면`;
  };

  async function persist(next: ScoreMap, action: () => Promise<void>, failMessage: string) {
    setBusy(true);
    setError("");
    try {
      if (mode === "cloud") await action();
      else saveLocal(eventId, next);
      setScores(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : failMessage);
    } finally {
      setBusy(false);
    }
  }

  // 빈 코트를 골라 시작 (계획 코트는 참고일 뿐)
  async function startMatch(matchNo: number, court: Court) {
    if (occupied.has(court)) {
      setError(`코트 ${court}는 지금 경기 중이에요.`);
      return;
    }
    const startedAt = new Date().toISOString();
    const score: MatchScore = { matchNo, scoreA: 0, scoreB: 0, court, startedAt };
    await persist(
      { ...scores, [matchNo]: score },
      () => startTennisMatch(eventId, matchNo, court, startedAt),
      "시작 기록을 저장하지 못했어요.",
    );
  }

  // 조별 점수를 고치면 "A조 1위"가 가리키는 팀이 바뀌어 이미 들어간 결선 점수가 엉뚱한 팀에 붙는다.
  // 결선 점수가 하나라도 있으면 조별 점수는 손대지 못하게 막는다.
  function groupLocked(matchNo: number): boolean {
    const target = event.matches.find((m) => m.no === matchNo);
    if (!target || target.stage !== "group") return false;
    if (!hasKnockoutScores(event, scores)) return false;
    setError("결선 점수가 이미 있어서 조별 점수는 고칠 수 없어요. 먼저 결선 점수를 지워 주세요.");
    return true;
  }

  async function saveScore(matchNo: number, scoreA: number, scoreB: number, tiebreak: [number, number] | null) {
    if (groupLocked(matchNo)) return;
    const prev = scores[matchNo];
    const m = matches.find((x) => x.match.no === matchNo);
    const score: MatchScore = {
      matchNo,
      scoreA,
      scoreB,
      court: prev?.court,
      startedAt: prev?.startedAt,
      finishedAt: prev?.finishedAt ?? new Date().toISOString(),
      tiebreakA: tiebreak ? tiebreak[0] : undefined,
      tiebreakB: tiebreak ? tiebreak[1] : undefined,
    };
    await persist({ ...scores, [matchNo]: score }, () => saveTennisScore(eventId, score), "저장하지 못했어요.");
    if (!prev?.finishedAt && m) {
      const winner = scoreA > scoreB ? m.teamA : m.teamB;
      setNotice(
        `🏁 ${m.match.label} ${matchNo}번 완료 · ${scoreA} : ${scoreB}${tiebreak ? ` (TB ${tiebreak[0]}-${tiebreak[1]})` : ""} · ${winner?.name ?? ""} 승`,
      );
    }
  }

  async function clearScore(matchNo: number) {
    if (groupLocked(matchNo)) return;
    // 뒤 경기에 이미 결과가 있으면 앞 경기를 지우면 대진이 꼬인다 → 막는다
    const dependents = matches.filter(
      (m) =>
        (m.match.a.kind === "winner" || m.match.a.kind === "loser" ? m.match.a.of === matchNo : false) ||
        (m.match.b.kind === "winner" || m.match.b.kind === "loser" ? m.match.b.of === matchNo : false),
    );
    if (dependents.some((m) => scores[m.match.no])) {
      setError("이 경기 결과로 이미 다음 경기가 진행됐어요. 다음 경기 기록을 먼저 지워 주세요.");
      return;
    }
    const next = { ...scores };
    delete next[matchNo];
    await persist(next, () => deleteTennisScore(eventId, matchNo), "지우지 못했어요.");
  }

  const buildKnockout = useCallback(
    async (again = false) => {
      setBusy(true);
      setError("");
      try {
        const ko = buildKnockoutMatches(event);
        const kept = event.matches.filter((m) => m.stage !== "ko");
        const updated = await upsertGeneral({
          ...event,
          matches: [...kept, ...ko],
          knockoutBuilt: true,
          builtIn: undefined,
        });
        setEvent(updated);
        setNotice(
          again
            ? "🏆 결선 대진을 다시 만들었어요."
            : '🏆 결선 대진을 만들었어요. "일정 · 점수" 탭에서 이어서 진행하세요.',
        );
      } catch (e) {
        // 자동 생성이 실패해도 다시 시도하지 않는다 (같은 오류로 저장을 계속 두드리지 않게).
        // 대신 아래 "🏆 결선 대진 만들기" 버튼이 남아 있어 직접 다시 눌러 볼 수 있다.
        const message = e instanceof Error ? e.message : "";
        setError(
          `결선 대진을 저장하지 못했어요. tennis_events 표가 오래됐다면 supabase/20260908_add_tennis_general.sql을 실행해 주세요.${message ? ` (${message})` : ""}`,
        );
      } finally {
        setBusy(false);
      }
    },
    [event],
  );

  // 조별이 다 끝나면 결선을 한 번 자동으로 만든다 (실패하면 아래 버튼으로 직접)
  const groupsDone = format === "groups" && groupsAllFinished(event, scores);
  useEffect(() => {
    if (format !== "groups" || event.knockoutBuilt || autoBuilt.current) return;
    if (!groupsDone || mode !== "cloud" || busy || loading) return;
    autoBuilt.current = true;
    void buildKnockout();
  }, [format, event.knockoutBuilt, groupsDone, mode, busy, loading, buildKnockout]);

  async function copyLink() {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
      else {
        const box = document.createElement("textarea");
        box.value = url;
        document.body.appendChild(box);
        box.select();
        document.execCommand("copy");
        document.body.removeChild(box);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(`링크를 복사하지 못했어요. 이 주소를 직접 복사해 주세요: ${url}`);
    }
  }

  const blocks = blockNumbers(event.matches);
  const selected = selectedTeam ? event.teams.find((t) => t.id === selectedTeam) ?? null : null;
  const path = selected ? teamPath(matches, selected) : [];
  const showStandings = format !== "knockout";
  const showBracket = format !== "league";
  // 3·4위전은 준결승이 두 경기일 때만 만들어진다 (팀이 적으면 그런 라운드가 없어 빠진다).
  // 대진이 이미 짜인 뒤에는 실제로 들어 있을 때만 배지를 보여 준다.
  const koPlanned = format === "groups" && !event.knockoutBuilt;
  const showThirdPlaceBadge =
    event.settings.thirdPlace &&
    (koPlanned || event.matches.some((m) => m.label === "3-4위전"));

  return (
    <StPage>
      <StHeader>
        <StTitle>🏟️ {event.title}</StTitle>
        <StSubtitle>
          {formatDate(event.date)} {event.settings.timeTbd ? "· 시간 미정" : `${event.startTime}부터`}
          {event.place ? ` · ${event.place}` : ""} · 코트 {event.courts}면 · 경기당 {event.minutesPerMatch}분
        </StSubtitle>
        <StChipRow>
          <StRuleBadge $tone="fixed">🔒 2인 복식 팀</StRuleBadge>
          <StRuleBadge $tone="fixed">🔒 {FORMAT_LABEL[format]}</StRuleBadge>
          {event.groups.length > 0 ? (
            <StRuleBadge $tone="on">
              ✓ {event.groups.length}조 · 조별 {event.settings.advancePerGroup}팀 진출
            </StRuleBadge>
          ) : null}
          <StRuleBadge $tone="on">✓ {event.settings.gamesToWin}게임 선취</StRuleBadge>
          <StRuleBadge $tone="on">✓ 5:5 → 7점 타이브레이크</StRuleBadge>
          {showThirdPlaceBadge ? <StRuleBadge $tone="on">✓ 3·4위전</StRuleBadge> : null}
          {event.settings.shuffled ? <StRuleBadge $tone="on">✓ 팀 순서를 섞어서 대진</StRuleBadge> : null}
        </StChipRow>
        <StActions>
          <StGhostBtn type="button" onClick={copyLink}>
            {copied ? "✅ 복사됐어요" : "🔗 링크 복사"}
          </StGhostBtn>
          <StGhostBtn type="button" onClick={() => setShowTeams((v) => !v)} aria-expanded={showTeams}>
            👥 참가 팀 {showTeams ? "닫기" : "보기"}
          </StGhostBtn>
        </StActions>
      </StHeader>

      <StStatGrid>
        <StStatBox>
          <StStatValue>{event.teams.length}</StStatValue>
          <StStatLabel>참가 팀</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>
            {progress.done}/{progress.total}
          </StStatValue>
          <StStatLabel>끝난 경기</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>{event.settings.timeTbd ? "미정" : expectedEnd(event)}</StStatValue>
          <StStatLabel>예상 종료 · {blocks.length}타임</StStatLabel>
        </StStatBox>
      </StStatGrid>

      {showTeams ? (
        <StCard>
          <StCardHead>
            <StCardTitle>👥 참가 팀 {event.teams.length}팀</StCardTitle>
          </StCardHead>
          <StQueueList>
            {event.teams.map((t) => (
              <StPlacementRow key={t.id} $top={false}>
                <StRank>#{t.seed}</StRank>
                <StTeamName>
                  {t.name}
                  {t.players.length > 0 ? <StTeamSubName>{t.players.join(" · ")}</StTeamSubName> : null}
                </StTeamName>
                <StCardHint>
                  {event.groups.find((g) => g.teamIds.includes(t.id))?.label ?? ""}
                </StCardHint>
              </StPlacementRow>
            ))}
          </StQueueList>
          {event.teams.every((t) => t.players.length === 0) ? (
            <StCardHint>선수 이름이 아직 비어 있어요. 팀 이름만으로도 진행할 수 있어요.</StCardHint>
          ) : null}
        </StCard>
      ) : null}

      {mode === "local" ? (
        <StNotice $tone="warn">
          아직 공용 저장 공간(tennis_scores 표)이 준비되지 않아 진행 기록을 이 기기에만 저장하고 있어요.
        </StNotice>
      ) : null}
      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      {notice ? <StNotice $tone="info">{notice}</StNotice> : null}

      {format === "groups" && !event.knockoutBuilt ? (
        <StNotice $tone="info">
          {groupsDone ? (
            <>
              조별 경기가 다 끝났어요! 결선 대진을 만들 수 있어요.{" "}
              <StPrimaryBtn type="button" disabled={busy} onClick={() => void buildKnockout()}>
                🏆 결선 대진 만들기
              </StPrimaryBtn>
            </>
          ) : (
            `결선은 조별 경기가 모두 끝나면 자동으로 만들어져요. 지금 ${groupProgress.done}/${groupProgress.total}경기 끝났어요.`
          )}
        </StNotice>
      ) : null}
      {format === "groups" && event.knockoutBuilt && !hasKnockoutScores(event, scores) ? (
        <StActions>
          <StGhostBtn type="button" disabled={busy} onClick={() => void buildKnockout(true)}>
            ↺ 결선 다시 만들기
          </StGhostBtn>
        </StActions>
      ) : null}

      <StTabRow>
        <StTab type="button" $active={tab === "schedule"} onClick={() => setTab("schedule")}>
          일정 · 점수
        </StTab>
        {showStandings ? (
          <StTab type="button" $active={tab === "standings"} onClick={() => setTab("standings")}>
            순위
          </StTab>
        ) : null}
        {showBracket ? (
          <StTab type="button" $active={tab === "bracket"} onClick={() => setTab("bracket")}>
            대진 그림
          </StTab>
        ) : null}
        <StTab type="button" $active={tab === "teams"} onClick={() => setTab("teams")}>
          팀별 여정
        </StTab>
      </StTabRow>

      {loading ? (
        <StCard aria-busy="true">
          <SkeletonBlock width="40%" height="1.05rem" radius="0.6rem" />
          <SkeletonBlock height="3.4rem" radius="0.9rem" />
          <SkeletonBlock height="3.4rem" radius="0.9rem" />
          <SkeletonBlock height="3.4rem" radius="0.9rem" />
        </StCard>
      ) : tab === "schedule" ? (
        <StCard>
          <StCardHead>
            <StCardTitle>🏟️ 코트별 진행</StCardTitle>
            <StCardHint>
              시작 가능 {readyMatches.length}경기 · 빈 코트 {courts.length - occupied.size}면
            </StCardHint>
          </StCardHead>
          <StCourtBoard>
            {courts.map((court) => {
              const m = playingByCourt.get(court);
              return (
                <StCourtCard key={court} $live={Boolean(m)}>
                  <StCourtHead>
                    <StCourtTitle>코트 {court}</StCourtTitle>
                    {m ? (
                      <StStateBadge $state="playing">🎾 진행 중</StStateBadge>
                    ) : (
                      <StStateBadge $state="waiting">비어 있음</StStateBadge>
                    )}
                  </StCourtHead>
                  {m ? (
                    <StCourtSlot
                      as="button"
                      type="button"
                      $kind="now"
                      onClick={() => jumpToMatch(m.match.no)}
                      title="이 경기 카드로 이동"
                    >
                      <StCourtSlotLabel $kind="now">지금</StCourtSlotLabel>
                      <StCourtSlotMain>
                        <b>
                          {m.match.no}번 · {m.match.label}
                        </b>
                        <em>
                          {m.teamA?.name ?? m.aLabel} vs {m.teamB?.name ?? m.bLabel}
                        </em>
                      </StCourtSlotMain>
                    </StCourtSlot>
                  ) : (
                    <StCardHint>
                      {readyMatches.length > 0
                        ? "아래 시작 가능한 경기에서 이 코트를 골라 시작하세요."
                        : "시작할 수 있는 경기가 없어요. 앞 경기 결과를 기다려요."}
                    </StCardHint>
                  )}
                </StCourtCard>
              );
            })}
          </StCourtBoard>
          {upNext.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {upNext.map((m) => (
                <StCourtSlot
                  key={m.match.no}
                  as="button"
                  type="button"
                  $kind={m.status === "ready" ? "next" : "later"}
                  onClick={() => jumpToMatch(m.match.no)}
                  title="이 경기 카드로 이동"
                >
                  <StCourtSlotLabel $kind={m.status === "ready" ? "next" : "later"}>
                    {m.status === "ready" ? "준비됨" : "대기"}
                  </StCourtSlotLabel>
                  <StCourtSlotMain>
                    <b>
                      {m.match.no}번 · {m.match.label} · {m.teamA?.name ?? m.aLabel} vs {m.teamB?.name ?? m.bLabel}
                    </b>
                    <em>
                      {m.status === "ready"
                        ? occupied.size < courts.length
                          ? "▶ 빈 코트를 골라 지금 시작할 수 있어요"
                          : "코트가 비면 시작할 수 있어요"
                        : waitingReason(m)}
                    </em>
                  </StCourtSlotMain>
                </StCourtSlot>
              ))}
            </div>
          ) : null}
          <StCardHead>
            <StCardTitle>🗂️ 대진 · 점수 입력</StCardTitle>
          </StCardHead>
          <StCardHint>
            {event.settings.beforeNote ? `${event.settings.beforeNote} → ` : ""}타임은 계획이에요. 두 팀이 정해지면 빈
            코트 아무 데서나 시작할 수 있어요. 이긴 팀 {event.settings.gamesToWin}게임, 5:5면 7점 타이브레이크.
          </StCardHint>
          <StQueueList>
            {blocks.map((block) => {
              const list = matches.filter((m) => m.match.block === block);
              if (list.length === 0) return null;
              const labels = [...new Set(list.map((m) => m.match.label))].join(" · ");
              return (
                <div key={block} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <StBlockHead>
                    <StRoundTitle>
                      {block}타임 · {labels}
                    </StRoundTitle>
                    <StRoundTime>{blockTimeOf(event, block)}</StRoundTime>
                  </StBlockHead>
                  <StMatchGrid>
                    {list.map((m) => (
                      <GeneralMatchCard
                        key={m.match.no}
                        match={m}
                        score={scores[m.match.no] ?? null}
                        blockTime={blockTimeOf(event, block)}
                        gamesToWin={event.settings.gamesToWin}
                        minutesPerMatch={event.minutesPerMatch}
                        clock={clock}
                        courts={courts}
                        occupied={occupied}
                        busy={busy}
                        onStart={startMatch}
                        onSave={saveScore}
                        onClear={clearScore}
                      />
                    ))}
                  </StMatchGrid>
                </div>
              );
            })}
          </StQueueList>
          {event.afterNote ? <StCardHint>🏅 {event.afterNote}</StCardHint> : null}
        </StCard>
      ) : tab === "standings" ? (
        <StCard>
          <StCardHead>
            <StCardTitle>📊 순위</StCardTitle>
          </StCardHead>
          <StCardHint>
            승수 → 맞대결 → 득실(딴 게임 − 내준 게임) → 딴 게임 순으로 정해요. 여기까지 같으면 팀 이름 순(가나다)으로
            정해요. 지금까지 {progress.done}/{progress.total}경기 반영했어요.
          </StCardHint>
          {format === "league" ? (
            <StandingsTable rows={leagueRows} />
          ) : (
            event.groups.map((g) => (
              <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <StCardHead>
                  <StCardTitle>{g.label}</StCardTitle>
                  <StCardHint>파란 줄이 결선에 올라가는 상위 {event.settings.advancePerGroup}팀이에요.</StCardHint>
                </StCardHead>
                <StandingsTable rows={groupRows.get(g.id) ?? []} />
              </div>
            ))
          )}
        </StCard>
      ) : tab === "bracket" ? (
        <StCard>
          <StCardHead>
            <StCardTitle>🧩 대진 그림</StCardTitle>
          </StCardHead>
          <StCardHint>왼쪽에서 오른쪽으로 갈수록 결승에 가까워요. 이긴 팀이 다음 칸에 올라가요.</StCardHint>
          <GeneralBracket matches={matches} />
        </StCard>
      ) : (
        <StCard>
          <StCardHead>
            <StCardTitle>🧭 팀별 여정</StCardTitle>
          </StCardHead>
          <StCardHint>팀을 고르면 몇 타임에 어느 코트에서 누구와 붙는지, 결과가 어땠는지 보여요.</StCardHint>
          <StChipRow>
            {event.teams.map((t) => (
              <StChip
                key={t.id}
                type="button"
                $active={selectedTeam === t.id}
                $color="#1d4ed8"
                onClick={() => setSelectedTeam(t.id)}
              >
                #{t.seed} {t.name}
              </StChip>
            ))}
          </StChipRow>
          {selected ? (
            <StQueueList>
              {path.map(({ match, opponent, outcome }) => (
                <StPlacementRow key={match.match.no} $top={outcome === "win"}>
                  <StRank>{match.match.block}타임</StRank>
                  <span>
                    <b>{match.match.label}</b> ·{" "}
                    {scores[match.match.no]?.court
                      ? `코트 ${scores[match.match.no]?.court}`
                      : `계획 코트 ${match.match.court}`}{" "}
                    · {blockTimeOf(event, match.match.block)}
                    <br />
                    <span style={{ color: "#64748b" }}>vs {opponent ? opponent.name : "상대 미정"}</span>
                  </span>
                  <StCardHint>
                    {outcome === "win"
                      ? `승 ${match.scoreA}:${match.scoreB}`
                      : outcome === "loss"
                        ? `패 ${match.scoreA}:${match.scoreB}`
                        : match.status === "playing"
                          ? "진행 중"
                          : "예정"}
                  </StCardHint>
                </StPlacementRow>
              ))}
              {path.length === 0 ? <StCardHint>아직 정해진 경기가 없어요.</StCardHint> : null}
            </StQueueList>
          ) : (
            <StCardHint>위에서 팀을 골라 주세요.</StCardHint>
          )}
        </StCard>
      )}
    </StPage>
  );
}
