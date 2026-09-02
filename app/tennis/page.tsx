"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlayerSchedule from "./components/PlayerSchedule";
import RoundList from "./components/RoundList";
import StandingsTable from "./components/StandingsTable";
import { HANWHA_2026_09 } from "./data";
import { buildStandings, countFinished } from "./standings";
import {
  deleteTennisScore,
  fetchTennisScores,
  saveTennisScore,
} from "@/services/tennis";
import {
  StCard,
  StCardHint,
  StHeader,
  StNotice,
  StPage,
  StStatBox,
  StStatGrid,
  StStatLabel,
  StStatValue,
  StSubtitle,
  StTab,
  StTabRow,
  StTitle,
} from "./page.styles";
import type { MatchScore, ScoreMap } from "./types";

type Tab = "bracket" | "standings" | "players";
// cloud: Supabase에 저장(모두가 공유) / local: 이 브라우저에만 저장(표가 아직 없을 때 대비)
type StorageMode = "cloud" | "local";

const EVENT = HANWHA_2026_09;
const LOCAL_KEY = `hcm:tennis:${EVENT.id}:scores`;
const POLL_MS = 20_000;

function toMap(list: MatchScore[]): ScoreMap {
  const map: ScoreMap = {};
  for (const score of list) map[score.matchNo] = score;
  return map;
}

function loadLocal(): ScoreMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? toMap(parsed as MatchScore[]) : {};
  } catch {
    return {};
  }
}

function saveLocal(map: ScoreMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(Object.values(map)));
}

export default function TennisPage() {
  const [tab, setTab] = useState<Tab>("bracket");
  const [scores, setScores] = useState<ScoreMap>({});
  const [mode, setMode] = useState<StorageMode>("cloud");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const players = useMemo(
    () => new Map(EVENT.players.map((player) => [player.name, player])),
    [],
  );
  const standings = useMemo(() => buildStandings(EVENT, scores), [scores]);
  const finished = countFinished(EVENT, scores);

  // 처음엔 클라우드에서 읽고, 표가 없거나 연결이 안 되면 이 브라우저 저장으로 내려간다
  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const list = await fetchTennisScores(EVENT.id);
      setScores(toMap(list));
      setMode("cloud");
      setError("");
    } catch {
      setMode((prev) => {
        if (prev === "cloud") setScores(loadLocal());
        return "local";
      });
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // 클라우드 모드에선 주기적으로 + 탭이 다시 보일 때 새로 읽어 다른 사람 입력을 반영한다
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

  async function saveScore(matchNo: number, scoreA: number, scoreB: number) {
    const score: MatchScore = { matchNo, scoreA, scoreB };
    const next = { ...scores, [matchNo]: score };
    setBusy(true);
    setError("");
    try {
      if (mode === "cloud") await saveTennisScore(EVENT.id, score);
      else saveLocal(next);
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
      if (mode === "cloud") await deleteTennisScore(EVENT.id, matchNo);
      else saveLocal(next);
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

  const men = EVENT.players.filter((p) => p.gender === "M").length;
  const women = EVENT.players.length - men;

  return (
    <StPage>
      <StHeader>
        <StTitle>🎾 {EVENT.title}</StTitle>
        <StSubtitle>
          {EVENT.date} · {EVENT.place} · 코트 {EVENT.courts}면 · 경기당 {EVENT.minutesPerMatch}분
        </StSubtitle>
      </StHeader>

      <StStatGrid>
        <StStatBox>
          <StStatValue>{EVENT.rounds.length}</StStatValue>
          <StStatLabel>라운드</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>
            {finished}/{EVENT.matches.length}
          </StStatValue>
          <StStatLabel>점수 들어간 경기</StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>{EVENT.players.length}</StStatValue>
          <StStatLabel>
            선수 (남 {men} · 여 {women})
          </StStatLabel>
        </StStatBox>
        <StStatBox>
          <StStatValue>{standings[0]?.played ? standings[0].player.name : "-"}</StStatValue>
          <StStatLabel>현재 1위</StStatLabel>
        </StStatBox>
      </StStatGrid>

      {mode === "local" ? (
        <StNotice $tone="warn">
          아직 공용 저장 공간(tennis_scores 표)이 준비되지 않아 점수를 이 기기에만 저장하고
          있어요. 다른 사람과 같이 쓰려면 supabase/20260902_create_tennis_scores.sql을 실행해
          주세요.
        </StNotice>
      ) : null}
      {error ? <StNotice $tone="error">{error}</StNotice> : null}

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
          event={EVENT}
          players={players}
          scores={scores}
          busy={busy}
          onSave={saveScore}
          onClear={clearScore}
        />
      ) : tab === "standings" ? (
        <StandingsTable
          standings={standings}
          finished={finished}
          total={EVENT.matches.length}
          onPickPlayer={pickPlayer}
        />
      ) : (
        <PlayerSchedule
          event={EVENT}
          scores={scores}
          selected={selectedPlayer}
          onSelect={setSelectedPlayer}
        />
      )}

      <StCard>
        <StCardHint>🍽️ {EVENT.afterNote}</StCardHint>
      </StCard>
    </StPage>
  );
}
