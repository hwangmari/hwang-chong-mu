"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TeamEditor from "./TeamEditor";
import TournamentGuide from "./TournamentGuide";
import TournamentMatchCard from "./TournamentMatchCard";
import { countFinishedTournament, placements, resolveBracket, scheduleBlocks, teamPath } from "./resolve";
import type { TeamEntry, TournamentEvent } from "./types";
import { formatDate } from "../format";
import {
  deleteTennisScore,
  fetchTennisScores,
  saveTennisScore,
  startTennisMatch,
  upsertTournament,
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
  StGhostBtn,
  StHeader,
  StMatchGrid,
  StNotice,
  StPage,
  StPlacementRow,
  StQueueList,
  StRank,
  StRoundTime,
  StRoundTitle,
  StRuleBadge,
  StSeedTag,
  StStatBox,
  StStatButton,
  StStatGrid,
  StStatLabel,
  StStatValue,
  StSubtitle,
  StTab,
  StTabRow,
  StTeamName,
  StTitle,
} from "../page.styles";
import type { MatchScore, ScoreMap } from "../types";

type Props = { initialEvent: TournamentEvent };
type Tab = "bracket" | "placements" | "teams";
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

export default function TournamentView({ initialEvent }: Props) {
  const [event, setEvent] = useState<TournamentEvent>(initialEvent);
  const eventId = event.id;
  const [tab, setTab] = useState<Tab>("bracket");
  const [scores, setScores] = useState<ScoreMap>({});
  const [mode, setMode] = useState<StorageMode>("cloud");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showTeams, setShowTeams] = useState(false);
  const [teamsEditOnOpen, setTeamsEditOnOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState(0);

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

  const matches = useMemo(() => resolveBracket(event, scores), [event, scores]);
  const blocks = useMemo(() => scheduleBlocks(event), [event]);
  const ranks = useMemo(() => placements(matches), [matches]);
  const progress = countFinishedTournament(matches);
  const anyStarted = Object.keys(scores).length > 0;
  // 팀 이름이 기본값("N번 시드 팀")이거나 선수가 비어 있으면 입력을 재촉한다
  const teamsIncomplete = event.teams.some(
    (t) => /^\d+번 시드 팀$/.test(t.name.trim()) || t.players.some((p) => !p.name.trim()),
  );

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

  async function startMatch(matchNo: number) {
    const template = matches.find((m) => m.template.no === matchNo)?.template;
    if (!template) return;
    const startedAt = new Date().toISOString();
    const score: MatchScore = { matchNo, scoreA: 0, scoreB: 0, court: template.court, startedAt };
    await persist(
      { ...scores, [matchNo]: score },
      () => startTennisMatch(eventId, matchNo, template.court, startedAt),
      "시작 기록을 저장하지 못했어요.",
    );
  }

  async function saveScore(matchNo: number, scoreA: number, scoreB: number, tiebreak: [number, number] | null) {
    const prev = scores[matchNo];
    const m = matches.find((x) => x.template.no === matchNo);
    const score: MatchScore = {
      matchNo,
      scoreA,
      scoreB,
      court: prev?.court ?? m?.template.court,
      startedAt: prev?.startedAt,
      finishedAt: prev?.finishedAt ?? new Date().toISOString(),
      tiebreakA: tiebreak ? tiebreak[0] : undefined,
      tiebreakB: tiebreak ? tiebreak[1] : undefined,
    };
    await persist({ ...scores, [matchNo]: score }, () => saveTennisScore(eventId, score), "저장하지 못했어요.");
    if (!prev?.finishedAt && m) {
      const winner = scoreA > scoreB ? m.teamA : m.teamB;
      setNotice(`🏁 ${m.template.label} ${matchNo}번 완료 · ${scoreA} : ${scoreB}${tiebreak ? ` (TB ${tiebreak[0]}-${tiebreak[1]})` : ""} · ${winner?.name ?? ""} 승`);
    }
  }

  async function clearScore(matchNo: number) {
    // 뒤 경기에 이미 결과가 있으면 앞 경기를 지우면 대진이 꼬인다 → 막는다
    const dependents = matches.filter(
      (m) =>
        (m.template.a.kind !== "seed" && m.template.a.of === matchNo) ||
        (m.template.b.kind !== "seed" && m.template.b.of === matchNo),
    );
    if (dependents.some((m) => scores[m.template.no])) {
      setError("이 경기 결과로 이미 다음 경기가 진행됐어요. 다음 경기 기록을 먼저 지워 주세요.");
      return;
    }
    const next = { ...scores };
    delete next[matchNo];
    await persist(next, () => deleteTennisScore(eventId, matchNo), "지우지 못했어요.");
  }

  async function saveTeams(teams: TeamEntry[]) {
    setBusy(true);
    setError("");
    try {
      const updated = await upsertTournament({ ...event, teams, builtIn: undefined });
      setEvent(updated);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      throw new Error(
        `저장하지 못했어요. tennis_events 표가 아직 없거나 오래됐다면 supabase/20260903_add_tennis_tournament.sql을 실행해 주세요.${message ? ` (${message})` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  }

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

  const blockTime = (no: number) => blocks.find((b) => b.no === no)?.time ?? "";
  const selected = selectedTeam !== null ? event.teams.find((t) => t.seed === selectedTeam) ?? null : null;

  return (
    <StPage>
      <StHeader>
        <StTitle>🏆 {event.title}</StTitle>
        <StSubtitle>
          {formatDate(event.date)} {event.timeTbd ? "· 시간 미정 (일정표는 13:00 시작 기준)" : `${event.startTime}부터`} · {event.place} · 코트{" "}
          {event.courts}면 · 경기당 {event.minutesPerMatch}분
        </StSubtitle>
        <StChipRow>
          <StRuleBadge $tone="fixed" title="8팀 더블 엘리미네이션: 두 번 지면 탈락">🔒 더블 엘리미네이션</StRuleBadge>
          <StRuleBadge $tone="fixed" title="3-4위전 · 5-6위전 · 7-8위전으로 1~8위를 모두 정해요">🔒 순위결정전</StRuleBadge>
          <StRuleBadge $tone="on">✓ {event.gamesToWin}게임 선취</StRuleBadge>
          <StRuleBadge $tone="on">✓ 5:5 → 7점 타이브레이크</StRuleBadge>
          <StRuleBadge $tone="on" title="1~4게임 페어A(시드2+4) → 5~8 페어B(1+3) → 9~12 페어C(1+2)">✓ 4게임마다 페어 교체 A→B→C</StRuleBadge>
          <StRuleBadge $tone="on" title="패자조 출신이 그랜드 파이널을 이기면 한 번 더">✓ 그랜드 파이널 리셋</StRuleBadge>
        </StChipRow>
        <StActions>
          <StGhostBtn type="button" onClick={copyLink}>
            {copied ? "✅ 복사됐어요" : "🔗 링크 복사"}
          </StGhostBtn>
          <StGhostBtn type="button" onClick={() => setShowTeams((v) => !v)}>
            👥 참가 팀 보기·편집
          </StGhostBtn>
        </StActions>
      </StHeader>

      <StStatGrid>
        <StStatBox>
          <StStatValue>{progress.total}</StStatValue>
          <StStatLabel>총 경기 (리셋 재경기 제외)</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>
            {progress.done}/{progress.total}
          </StStatValue>
          <StStatLabel>끝난 경기</StStatLabel>
        </StStatBox>
        <StStatButton onClick={() => setShowTeams((v) => !v)} aria-expanded={showTeams}>
          <StStatValue>{event.teams.length}</StStatValue>
          <StStatLabel>팀 × 4명 · {showTeams ? "닫기" : "누르면 명단"}</StStatLabel>
        </StStatButton>
      </StStatGrid>

      {teamsIncomplete && !showTeams ? (
        <StNotice $tone="info">
          팀 이름과 선수가 아직 비어 있어요. 기본 이름(&ldquo;1번 시드 팀&rdquo;)은 마음대로 바꿀 수 있어요.{" "}
          <StGhostBtn
            type="button"
            onClick={() => {
              setTeamsEditOnOpen(true);
              setShowTeams(true);
            }}
          >
            ✏️ 참가 팀 입력하기
          </StGhostBtn>
        </StNotice>
      ) : null}

      {showTeams ? (
        <TeamEditor
          key={event.teams.map((t) => `${t.seed}:${t.name}:${t.players.map((p) => p.name).join(",")}`).join("|")}
          teams={event.teams}
          locked={anyStarted}
          busy={busy}
          startEditing={teamsEditOnOpen}
          onSave={saveTeams}
          onClose={() => {
            setShowTeams(false);
            setTeamsEditOnOpen(false);
          }}
        />
      ) : null}

      <TournamentGuide event={event} />

      {mode === "local" ? (
        <StNotice $tone="warn">
          아직 공용 저장 공간(tennis_scores 표)이 준비되지 않아 진행 기록을 이 기기에만 저장하고 있어요.
        </StNotice>
      ) : null}
      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      {notice ? <StNotice $tone="info">{notice}</StNotice> : null}

      <StTabRow>
        <StTab type="button" $active={tab === "bracket"} onClick={() => setTab("bracket")}>
          대진표 · 점수
        </StTab>
        <StTab type="button" $active={tab === "placements"} onClick={() => setTab("placements")}>
          최종 순위
        </StTab>
        <StTab type="button" $active={tab === "teams"} onClick={() => setTab("teams")}>
          팀별 여정
        </StTab>
      </StTabRow>

      {loading ? (
        <StCard>
          <StCardHint>진행 기록을 불러오는 중...</StCardHint>
        </StCard>
      ) : tab === "bracket" ? (
        <StCard>
          <StCardHead>
            <StCardTitle>🗂️ 대진표 · 점수 입력</StCardTitle>
          </StCardHead>
          <StCardHint>
            {event.beforeNote ? `${event.beforeNote} → ` : ""}시간대별로 동시에 진행돼요. 앞 경기 점수가 들어오면 다음 경기에 팀이 자동으로
            채워져요. 이긴 팀 {event.gamesToWin}게임, 5:5면 7점 타이브레이크.
          </StCardHint>
          <StQueueList>
            {blocks.map((block) => {
              const list = matches.filter((m) => m.template.block === block.no && m.status !== "hidden");
              if (list.length === 0) return null;
              return (
                <div key={block.no} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <StBlockHead>
                    <StRoundTitle>
                      {block.no}교시 · {block.title}
                    </StRoundTitle>
                    <StRoundTime>
                      {block.time}
                      {block.note ? ` · ${block.note}` : ""}
                    </StRoundTime>
                  </StBlockHead>
                  <StMatchGrid>
                    {list.map((m) => (
                      <TournamentMatchCard
                        key={m.template.no}
                        match={m}
                        score={scores[m.template.no] ?? null}
                        blockTime={block.time}
                        gamesToWin={event.gamesToWin}
                        clock={clock}
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
      ) : tab === "placements" ? (
        <StCard>
          <StCardHead>
            <StCardTitle>🏅 최종 순위</StCardTitle>
          </StCardHead>
          <StCardHint>결과가 들어오는 대로 채워져요. 1·2위는 그랜드 파이널(리셋이 있으면 리셋 재경기)로 정해요.</StCardHint>
          <StQueueList>
            {ranks.map((r) => (
              <StPlacementRow key={r.rank} $top={r.rank <= 3 && r.team !== null}>
                <StRank>{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `${r.rank}위`}</StRank>
                {r.team ? (
                  <StTeamName>
                    <StSeedTag>#{r.team.seed}</StSeedTag> {r.team.name}
                  </StTeamName>
                ) : (
                  <StTeamName $muted>아직 미정</StTeamName>
                )}
                <StCardHint>{r.how}</StCardHint>
              </StPlacementRow>
            ))}
          </StQueueList>
        </StCard>
      ) : (
        <StCard>
          <StCardHead>
            <StCardTitle>🧭 팀별 여정</StCardTitle>
          </StCardHead>
          <StCardHint>팀을 고르면 몇 교시에 어느 코트에서 누구와 붙는지, 결과가 어땠는지 보여요.</StCardHint>
          <StChipRow>
            {event.teams.map((t) => (
              <StChip key={t.seed} type="button" $active={selectedTeam === t.seed} $color="#1d4ed8" onClick={() => setSelectedTeam(t.seed)}>
                #{t.seed} {t.name}
              </StChip>
            ))}
          </StChipRow>
          {selected ? (
            <StQueueList>
              {teamPath(matches, selected).map(({ match, opponent, outcome }) => (
                <StPlacementRow key={match.template.no} $top={outcome === "win"}>
                  <StRank>{match.template.block}교시</StRank>
                  <span>
                    <b>{match.template.label}</b> · 코트 {match.template.court} · {blockTime(match.template.block)}
                    <br />
                    <span style={{ color: "#64748b" }}>vs {opponent ? `#${opponent.seed} ${opponent.name}` : "상대 미정"}</span>
                  </span>
                  <StCardHint>
                    {outcome === "win" ? `승 ${match.scoreA}:${match.scoreB}` : outcome === "loss" ? `패 ${match.scoreA}:${match.scoreB}` : match.status === "playing" ? "진행 중" : "예정"}
                  </StCardHint>
                </StPlacementRow>
              ))}
              {teamPath(matches, selected).length === 0 ? <StCardHint>아직 정해진 경기가 없어요.</StCardHint> : null}
            </StQueueList>
          ) : (
            <StCardHint>위에서 팀을 골라 주세요.</StCardHint>
          )}
        </StCard>
      )}
    </StPage>
  );
}
