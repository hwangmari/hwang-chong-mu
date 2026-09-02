"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BracketEditor from "../components/BracketEditor";
import PlayerRoster from "../components/PlayerRoster";
import PlayerSchedule from "../components/PlayerSchedule";
import RoundList from "../components/RoundList";
import StandingsTable from "../components/StandingsTable";
import { findBuiltInEvent } from "../data";
import { formatEventDate, roundLabel } from "../format";
import { buildStandings, countFinished } from "../standings";
import { buildTimeline, nowMinutesIfEventDay } from "../timeline";
import {
  deleteTennisScore,
  fetchTennisEvent,
  fetchTennisScores,
  saveTennisScore,
  updateTennisBracket,
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
import type { Match, MatchScore, Player, ScoreMap, TennisEvent } from "../types";

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
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // 대진표 수정 모드 (화면에서 만든 교류전만)
  const [editing, setEditing] = useState(false);
  const [draftMatches, setDraftMatches] = useState<Match[]>([]);
  const [copied, setCopied] = useState(false);
  // 선수단 카드 펼침 (위쪽 "선수" 상자를 누르면)
  const [showRoster, setShowRoster] = useState(false);

  // 1) 교류전 불러오기: 코드에 든 것이면 바로, 아니면 DB에서
  useEffect(() => {
    let cancelled = false;
    const builtIn = findBuiltInEvent(eventId);
    if (builtIn) {
      setEvent(builtIn);
      setEventLoading(false);
      return;
    }
    setEventLoading(true);
    fetchTennisEvent(eventId)
      .then((found) => {
        if (cancelled) return;
        setEvent(found);
        if (!found) setEventError("이 주소의 교류전을 찾지 못했어요. 링크를 다시 확인해 주세요.");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setEventError(
          e instanceof Error
            ? `교류전을 불러오지 못했어요. (${e.message})`
            : "교류전을 불러오지 못했어요.",
        );
      })
      .finally(() => {
        if (!cancelled) setEventLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // 2) 점수 불러오기: 클라우드 → 실패하면 이 브라우저 저장으로
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
  const standings = useMemo(
    () => (event ? buildStandings(event, scores) : []),
    [event, scores],
  );
  const finished = event ? countFinished(event, scores) : 0;

  // 행사 당일이면 현재 시각을 30초마다 갱신해 "진행 중/예상 시각"을 다시 계산한다
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!event) return;
    const tick = () => setNow(nowMinutesIfEventDay(event.date));
    const timer = window.setInterval(tick, 30_000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, [event]);
  const timeline = useMemo(
    () => (event ? buildTimeline(event, scores, now) : null),
    [event, scores, now],
  );

  async function saveScore(matchNo: number, scoreA: number, scoreB: number) {
    // 처음 저장할 때의 시각을 "경기 끝난 시각"으로 남긴다. 점수를 고쳐도 그대로
    const finishedAt = scores[matchNo]?.finishedAt ?? new Date().toISOString();
    const score: MatchScore = { matchNo, scoreA, scoreB, finishedAt };
    const next = { ...scores, [matchNo]: score };
    setBusy(true);
    setError("");
    try {
      if (mode === "cloud") await saveTennisScore(eventId, score);
      else saveLocal(eventId, next);
      setScores(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function clearScore(matchNo: number) {
    const next = { ...scores };
    delete next[matchNo];
    setBusy(true);
    setError("");
    try {
      if (mode === "cloud") await deleteTennisScore(eventId, matchNo);
      else saveLocal(eventId, next);
      setScores(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "지우지 못했어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  function pickPlayer(name: string) {
    setSelectedPlayer(name);
    setTab("players");
  }

  function startEdit() {
    if (!event) return;
    setDraftMatches(event.matches);
    setEditing(true);
  }

  async function saveBracket() {
    if (!event) return;
    setBusy(true);
    setError("");
    try {
      const rounds = event.rounds.map((r) => ({
        ...r,
        label: roundLabel(draftMatches.filter((m) => m.round === r.no).map((m) => m.type)),
      }));
      const updated = await updateTennisBracket(event.id, {
        players: event.players,
        rounds,
        matches: draftMatches,
      });
      setEvent(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대진표를 저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRoster(nextPlayers: Player[], nextMatches: Match[]) {
    if (!event) return;
    setBusy(true);
    setError("");
    try {
      const updated = await updateTennisBracket(event.id, {
        players: nextPlayers,
        rounds: event.rounds,
        matches: nextMatches,
      });
      setEvent(updated);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("링크를 복사하지 못했어요. 주소창에서 직접 복사해 주세요.");
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

  if (!event) {
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

  return (
    <StPage>
      <StHeader>
        <StTitle>🎾 {event.title}</StTitle>
        <StSubtitle>
          {formatEventDate(event)}
          {event.place ? ` · ${event.place}` : ""} · 코트 {event.courts}면 · 경기당{" "}
          {event.minutesPerMatch}분
        </StSubtitle>
        <StActions>
          <StGhostBtn type="button" onClick={copyLink}>
            {copied ? "✅ 복사됐어요" : "🔗 링크 복사"}
          </StGhostBtn>
          {!event.builtIn && !editing ? (
            <StGhostBtn type="button" onClick={startEdit}>
              ✏️ 대진표 수정
            </StGhostBtn>
          ) : null}
          <StGhostBtn as={Link} href="/tennis">
            목록
          </StGhostBtn>
        </StActions>
      </StHeader>

      <StStatGrid>
        <StStatBox>
          <StStatValue>{event.rounds.length}</StStatValue>
          <StStatLabel>라운드</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>
            {finished}/{event.matches.length}
          </StStatValue>
          <StStatLabel>점수 들어간 경기</StStatLabel>
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
          key={event.players.map((p) => `${p.name}:${p.gender}:${p.years}`).join("|")}
          players={event.players}
          matches={event.matches}
          editable={!event.builtIn}
          busy={busy}
          onSave={saveRoster}
          onClose={() => setShowRoster(false)}
        />
      ) : null}

      {mode === "local" ? (
        <StNotice $tone="warn">
          아직 공용 저장 공간(tennis_scores 표)이 준비되지 않아 점수를 이 기기에만 저장하고
          있어요. 다른 사람과 같이 쓰려면 supabase/20260902_create_tennis_scores.sql을 실행해
          주세요.
        </StNotice>
      ) : null}
      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      {editing ? (
        <StCard>
          <StCardHead>
            <StCardTitle>✏️ 대진표 수정</StCardTitle>
          </StCardHead>
          <StCardHint>
            선수를 바꾸면 저장 후 모두에게 반영돼요. 이미 넣은 점수는 경기 번호 기준으로 그대로
            남아요.
          </StCardHint>
          <BracketEditor
            players={event.players}
            rounds={event.rounds}
            matches={draftMatches}
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
              대진표 · 점수 입력
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
              <StCardHint>점수를 불러오는 중...</StCardHint>
            </StCard>
          ) : tab === "bracket" ? (
            <RoundList
              event={event}
              players={players}
              scores={scores}
              timeline={timeline!}
              busy={busy}
              onSave={saveScore}
              onClear={clearScore}
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
              timeline={timeline!}
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
