"use client";

import { useCallback, useEffect, useState } from "react";
import { castVote, fetchVoteTallies, type VoteTally } from "@/services/tennisVotes";
import { getSavedVoter, playerVoterKey } from "../voterKey";
import { demoTotoTally } from "./PixelTotoResult";
import type { TournamentEvent } from "./types";

/**
 * 픽셀 코트 전광판에서 우승팀 토토 걸기 (주인 요청 2026-10-28 "픽셀 코트에서 투표도 할 수 있게, 투표 모드로").
 * 투표 탭(VotePanel)과 같은 저장 방식(castVote)·같은 "나"(투표 탭에서 이름·비번으로 들어온 폰)를 쓴다.
 * 이름·비번 확인은 투표 탭에만 있다 — 여기서는 이 폰에 저장된 "나"가 없으면 걸 수 없다고 안내만 한다.
 * 체험 페이지는 저장 공간에 쓰지 않고 이 화면 안에서만 가짜로 건다.
 */

const POLL_MS = 20_000; // 투표 탭과 같은 주기로 표 수를 따라간다

export function usePixelToto(event: TournamentEvent, active: boolean, demo: boolean) {
  const [voter] = useState(() => getSavedVoter());
  const myKey = voter ? playerVoterKey(voter.name) : "";
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (demo) {
      setTally((prev) => prev ?? demoTotoTally(event));
      return;
    }
    try {
      setTally((await fetchVoteTallies(event.id, myKey)).champion);
      setError("");
    } catch {
      setError("토토 표를 불러오지 못했어요.");
    }
  }, [demo, event, myKey]);

  useEffect(() => {
    if (!active) return;
    void load();
    if (demo) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, demo, load]);

  const pick = async (seed: number) => {
    const choice = String(seed);
    if (!tally || busy || tally.mine[0] === choice) return;
    if (demo) {
      // 체험: 내 표를 옮기고 표 수만 다시 센다
      const prev = tally.mine[0];
      const counts = new Map(tally.counts.map((c) => [c.choice, c.votes]));
      if (prev) counts.set(prev, (counts.get(prev) ?? 1) - 1);
      counts.set(choice, (counts.get(choice) ?? 0) + 1);
      setTally({
        ...tally,
        total: tally.total + (prev ? 0 : 1),
        mine: [choice],
        counts: [...counts.entries()].map(([c, votes]) => ({ choice: c, votes })).filter((c) => c.votes > 0),
      });
      return;
    }
    if (!myKey) return;
    setBusy(true);
    try {
      await castVote(event.id, "champion", myKey, [choice]);
      await load();
    } catch {
      setError("표를 넣지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const votesOf = (seed: number) => tally?.counts.find((c) => c.choice === String(seed))?.votes ?? 0;
  // 배당 = 참여 인원 ÷ 그 팀 표 (투표 탭과 같은 계산)
  const oddsOf = (seed: number) => {
    const v = votesOf(seed);
    return tally && v > 0 ? `×${(tally.total / v).toFixed(1)}` : "-";
  };

  return {
    canVote: demo || !!myKey,
    myName: voter?.name ?? "",
    tally,
    mine: tally?.mine[0] ?? "",
    busy,
    error,
    pick,
    votesOf,
    oddsOf,
  };
}
