"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BracketEditor from "../components/BracketEditor";
import MatchQueue from "../components/MatchQueue";
import PlayerRoster from "../components/PlayerRoster";
import PlayerSchedule from "../components/PlayerSchedule";
import StandingsTable from "../components/StandingsTable";
import { findBuiltInEvent } from "../data";
import { formatEventDate } from "../format";
import { buildStandings, countFinished } from "../standings";
import { buildTimeline, nowMinutesIfEventDay, playedMinutes } from "../timeline";
import {
  deleteTennisScore,
  fetchTennisEvent,
  fetchTennisScores,
  saveTennisScore,
  startTennisMatch,
  updateTennisBracket,
  upsertTennisEvent,
} from "@/services/tennis";
import {
  StActions,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StGhostBtn,
  StHeader,
  StNotice,
  StPage,
  StPrimaryBtn,
  StStatBox,
  StStatButton,
  StStatGrid,
  StStatLabel,
  StStatValue,
  StSubtitle,
  StTab,
  StTabRow,
  StTitle,
} from "../page.styles";
import type { Court, Match, MatchScore, Player, ScoreMap, TennisEvent } from "../types";

type Tab = "bracket" | "standings" | "players";
// cloud: Supabase에 저장(모두가 공유) / local: 이 브라우저에만 저장(표가 아직 없을 때 대비)
type StorageMode = "cloud" | "local";

const POLL_MS = 20_000;

function toMap(list: MatchScore[]): ScoreMap {
  const map: ScoreMap = {};
  for (const score of list) map[score.matchNo] = score;
  return map;
}

function localKey(eventId: string) {
  return `hcm:tennis:${eventId}:scores`;
}

function loadLocal(eventId: string): ScoreMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(localKey(eventId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? toMap(parsed as MatchScore[]) : {};
  } catch {
    return {};
  }
}

function saveLocal(eventId: string, map: ScoreMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localKey(eventId), JSON.stringify(Object.values(map)));
}

export default function TennisEventPage() {
  const params = useParams();
  const eventId = String(params.id ?? "");

  const [event, setEvent] = useState<TennisEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  const [tab, setTab] = useState<Tab>("bracket");
  const [scores, setScores] = useState<ScoreMap>({});
  const [mode, setMode] = useState<StorageMode>("cloud");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); // 경기 완료 등 잠깐 보여주는 안내
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // 대진표(선수 교체) 수정 모드 — 화면에서 만든 교류전만
  const [editing, setEditing] = useState(false);
  const [draftMatches, setDraftMatches] = useState<Match[]>([]);
  const [copied, setCopied] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  // 1) 교류전 불러오기: 저장 공간에 있으면 그걸 쓰고(편집된 버전), 없으면 코드에 든 것을 쓴다
  useEffect(() => {
    let cancelled = false;
    const builtIn = findBuiltInEvent(eventId);
    if (builtIn) setEvent(builtIn); // 일단 코드 버전을 먼저 보여주고
    setEventLoading(!builtIn);
    fetchTennisEvent(eventId)
      .then((found) => {
        if (cancelled) return;
        if (found) setEvent(found);
        else if (!builtIn) setEventError("이 주소의 교류전을 찾지 못했어요. 링크를 다시 확인해 주세요.");
      })
      .catch((e: unknown) => {
        if (cancelled || builtIn) return; // 코드 버전이 있으면 저장 공간 오류는 조용히 넘긴다
        setEventError(
          e instanceof Error ? `교류전을 불러오지 못했어요. (${e.message})` : "교류전을 불러오지 못했어요.",
        );
      })
      .finally(() => {
        if (!cancelled) setEventLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // 2) 진행 기록 불러오기: 클라우드 → 실패하면 이 브라우저 저장으로
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
    if (!event) return;
    void reload();
  }, [event, reload]);

  useEffect(() => {
    if (mode !== "cloud" || !event) return;
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
  }, [mode, event, reload]);

  const players = useMemo(
    () => new Map((event?.players ?? []).map((player) => [player.name, player])),
    [event],
  );
  const standings = useMemo(() => (event ? buildStandings(event, scores) : []), [event, scores]);
  const finished = event ? countFinished(event, scores) : 0;

  // 행사 당일이면 현재 시각을 30초마다 갱신해 "진행 중/시작 가능/예상 시각"을 다시 계산한다
  const [now, setNow] = useState<number | null>(null);
  const [clock, setClock] = useState<number>(0);
  useEffect(() => {
    if (!event) return;
    const tick = () => {
      setNow(nowMinutesIfEventDay(event.date));
      const d = new Date();
      setClock(d.getHours() * 60 + d.getMinutes());
    };
    const timer = window.setInterval(tick, 30_000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, [event]);
  const timeline = useMemo(
    () => (event ? buildTimeline(event, scores, now, clock) : null),
    [event, scores, now, clock],
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

  // "지금 시작": 코트와 시작 시각만 기록 (진행 중)
  async function startMatch(matchNo: number, court: Court) {
    const startedAt = new Date().toISOString();
    const score: MatchScore = { matchNo, scoreA: 0, scoreB: 0, court, startedAt };
    await persist(
      { ...scores, [matchNo]: score },
      () => startTennisMatch(eventId, matchNo, court, startedAt),
      "시작 기록을 저장하지 못했어요.",
    );
  }

  // 점수 저장(완료). 처음 저장한 시각을 "경기 끝난 시각"으로 남기고, 고쳐도 유지
  async function saveScore(matchNo: number, scoreA: number, scoreB: number) {
    const prev = scores[matchNo];
    const score: MatchScore = {
      matchNo,
      scoreA,
      scoreB,
      court: prev?.court,
      startedAt: prev?.startedAt,
      finishedAt: prev?.finishedAt ?? new Date().toISOString(),
    };
    await persist(
      { ...scores, [matchNo]: score },
      () => saveTennisScore(eventId, score),
      "저장하지 못했어요. 다시 눌러 주세요.",
    );
    // 처음 완료될 때만 "얼마나 플레이했는지" 알려준다 (점수 수정 때는 조용히)
    if (!prev?.finishedAt && event) {
      const position = event.matches.findIndex((m) => m.no === matchNo) + 1;
      const mins = playedMinutes(score);
      setNotice(
        `🏁 ${position}번 경기 완료 · ${scoreA} : ${scoreB}${mins !== null ? ` · ${mins}분 플레이` : " · 플레이 시간은 시작 버튼을 누른 경기만 기록돼요"}`,
      );
    }
  }

  async function clearScore(matchNo: number) {
    const next = { ...scores };
    delete next[matchNo];
    await persist(next, () => deleteTennisScore(eventId, matchNo), "지우지 못했어요. 다시 눌러 주세요.");
  }

  function pickPlayer(name: string) {
    setSelectedPlayer(name);
    setTab("players");
  }

  // 코드에 든 교류전을 처음 고치면 같은 id로 저장 공간에 통째로 옮겨 담고, 그 뒤로는 저장 공간 버전을 쓴다
  async function saveBracketParts(parts: Partial<Pick<TennisEvent, "players" | "matches">>) {
    if (!event) return;
    setBusy(true);
    setError("");
    try {
      const next = {
        ...event,
        players: parts.players ?? event.players,
        matches: parts.matches ?? event.matches,
      };
      const updated = event.builtIn
        ? await upsertTennisEvent({ ...next, builtIn: undefined })
        : await updateTennisBracket(event.id, { players: next.players, rounds: next.rounds, matches: next.matches });
      setEvent(updated);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      throw new Error(
        `저장하지 못했어요. tennis_events 표가 아직 없다면 supabase/20260902_create_tennis_events.sql을 실행해 주세요.${message ? ` (${message})` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveBracket() {
    try {
      await saveBracketParts({ matches: draftMatches });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대진표를 저장하지 못했어요.");
    }
  }

  async function saveOrder(matches: Match[]) {
    try {
      await saveBracketParts({ matches });
    } catch (e) {
      setError(e instanceof Error ? e.message : "순서를 저장하지 못했어요.");
      throw e;
    }
  }

  async function saveRoster(nextPlayers: Player[], nextMatches: Match[]) {
    await saveBracketParts({ players: nextPlayers, matches: nextMatches });
  }

  // 클립보드 API는 https·localhost에서만 되므로(폰에서 IP로 열면 막힘), 안 되면 옛 방식으로 한 번 더 시도
  async function copyLink() {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const box = document.createElement("textarea");
        box.value = url;
        box.setAttribute("readonly", "");
        box.style.position = "fixed";
        box.style.opacity = "0";
        document.body.appendChild(box);
        box.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(box);
        if (!ok) throw new Error("copy failed");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(`링크를 복사하지 못했어요. 이 주소를 직접 복사해 주세요: ${url}`);
    }
  }

  if (eventLoading) {
    return (
      <StPage>
        <StCard>
          <StCardHint>교류전을 불러오는 중...</StCardHint>
        </StCard>
      </StPage>
    );
  }

  if (!event || !timeline) {
    return (
      <StPage>
        <StHeader>
          <StTitle>🎾 테니스 교류전</StTitle>
        </StHeader>
        <StNotice $tone="error">{eventError || "교류전을 찾지 못했어요."}</StNotice>
        <StCard>
          <StCardHint>
            <Link href="/tennis">← 교류전 목록으로</Link>
          </StCardHint>
        </StCard>
      </StPage>
    );
  }

  const men = event.players.filter((p) => p.gender === "M").length;
  const women = event.players.length - men;
  const editable = true; // 코드에 든 교류전도 처음 고칠 때 저장 공간으로 옮겨 담으므로 항상 편집 가능

  return (
    <StPage>
      <StHeader>
        <StTitle>🎾 {event.title}</StTitle>
        <StSubtitle>
          {formatEventDate(event)}
          {event.place ? ` · ${event.place}` : ""} · 코트 {event.courts}면 · 경기당 {event.minutesPerMatch}분
        </StSubtitle>
        <StActions>
          <StGhostBtn type="button" onClick={copyLink}>
            {copied ? "✅ 복사됐어요" : "🔗 링크 복사"}
          </StGhostBtn>
          <StGhostBtn type="button" onClick={() => setShowRoster((v) => !v)}>
            👥 선수단 {editable ? "보기·편집" : "보기"}
          </StGhostBtn>
          {editable && !editing ? (
            <StGhostBtn
              type="button"
              onClick={() => {
                setDraftMatches(event.matches);
                setEditing(true);
              }}
            >
              ✏️ 선수 교체
            </StGhostBtn>
          ) : null}
        </StActions>
      </StHeader>

      <StStatGrid>
        <StStatBox>
          <StStatValue>{event.matches.length}</StStatValue>
          <StStatLabel>총 경기 · 코트 {event.courts}면</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>
            {finished}/{event.matches.length}
          </StStatValue>
          <StStatLabel>끝난 경기</StStatLabel>
        </StStatBox>
        <StStatButton onClick={() => setShowRoster((v) => !v)} aria-expanded={showRoster}>
          <StStatValue>{event.players.length}</StStatValue>
          <StStatLabel>
            선수 (남 {men} · 여 {women}) · {showRoster ? "명단 닫기" : "누르면 명단"}
          </StStatLabel>
        </StStatButton>
      </StStatGrid>

      {showRoster ? (
        <PlayerRoster
          key={event.players.map((p) => `${p.name}:${p.gender}:${p.years}:${p.team ?? ""}`).join("|")}
          players={event.players}
          matches={event.matches}
          editable={editable}
          busy={busy}
          onSave={saveRoster}
          onClose={() => setShowRoster(false)}
        />
      ) : null}

      {mode === "local" ? (
        <StNotice $tone="warn">
          아직 공용 저장 공간(tennis_scores 표)이 준비되지 않아 진행 기록을 이 기기에만 저장하고
          있어요. 다른 사람과 같이 쓰려면 supabase/20260902_create_tennis_scores.sql을 실행해
          주세요.
        </StNotice>
      ) : null}
      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      {notice ? <StNotice $tone="info">{notice}</StNotice> : null}

      {editing ? (
        <StCard>
          <StCardHead>
            <StCardTitle>✏️ 선수 교체</StCardTitle>
          </StCardHead>
          <StCardHint>
            경기마다 선수를 바꿀 수 있어요. 저장하면 모두에게 반영돼요. 순서를 바꾸는 건 경기 목록의
            &ldquo;순서 바꾸기&rdquo;에서 해요.
          </StCardHint>
          <BracketEditor
            players={event.players}
            matches={draftMatches}
            courts={event.courts}
            onChange={setDraftMatches}
          />
          <StActions>
            <StPrimaryBtn type="button" onClick={saveBracket} disabled={busy}>
              {busy ? "저장 중..." : "저장"}
            </StPrimaryBtn>
            <StGhostBtn type="button" onClick={() => setEditing(false)} disabled={busy}>
              취소
            </StGhostBtn>
          </StActions>
        </StCard>
      ) : (
        <>
          <StTabRow>
            <StTab type="button" $active={tab === "bracket"} onClick={() => setTab("bracket")}>
              경기 진행 · 점수
            </StTab>
            <StTab type="button" $active={tab === "standings"} onClick={() => setTab("standings")}>
              승점 순위
            </StTab>
            <StTab type="button" $active={tab === "players"} onClick={() => setTab("players")}>
              선수별 일정
            </StTab>
          </StTabRow>

          {loading ? (
            <StCard>
              <StCardHint>진행 기록을 불러오는 중...</StCardHint>
            </StCard>
          ) : tab === "bracket" ? (
            <MatchQueue
              event={event}
              players={players}
              scores={scores}
              timeline={timeline}
              busy={busy}
              canReorder={editable}
              onStart={startMatch}
              onSave={saveScore}
              onClear={clearScore}
              onReorder={saveOrder}
            />
          ) : tab === "standings" ? (
            <StandingsTable
              standings={standings}
              finished={finished}
              total={event.matches.length}
              onPickPlayer={pickPlayer}
            />
          ) : (
            <PlayerSchedule
              event={event}
              scores={scores}
              timeline={timeline}
              selected={selectedPlayer}
              onSelect={setSelectedPlayer}
            />
          )}
        </>
      )}

      {event.afterNote ? (
        <StCard>
          <StCardHint>🍽️ {event.afterNote}</StCardHint>
        </StCard>
      ) : null}
    </StPage>
  );
}
