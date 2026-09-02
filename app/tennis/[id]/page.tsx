"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ExchangeView from "../components/ExchangeView";
import TournamentView from "../tournament/TournamentView";
import { findBuiltInEvent } from "../data";
import { findBuiltInTournament } from "../tournament/data";
import { fetchTennisEvent, isTournament, type AnyTennisEvent } from "@/services/tennis";
import { StCard, StCardHint, StHeader, StNotice, StPage, StTitle } from "../page.styles";

// 주소 하나로 교류전(개인 승점)과 팀 토너먼트를 모두 연다.
// 저장 공간에 있으면 그걸 쓰고(편집된 버전), 없으면 코드에 든 것을 쓴다.
export default function TennisEventPage() {
  const params = useParams();
  const eventId = String(params.id ?? "");
  // 코드에 든 이벤트면 첫 화면부터 바로 보여주고, 저장 공간 버전이 있으면 그걸로 바꿔 끼운다
  const builtIn = useMemo<AnyTennisEvent | null>(
    () => findBuiltInEvent(eventId) ?? findBuiltInTournament(eventId),
    [eventId],
  );
  const [event, setEvent] = useState<AnyTennisEvent | null>(builtIn);
  const [loading, setLoading] = useState(!builtIn);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchTennisEvent(eventId)
      .then((found) => {
        if (cancelled) return;
        if (found) setEvent(found);
        else if (!builtIn) setError("이 주소의 교류전을 찾지 못했어요. 링크를 다시 확인해 주세요.");
      })
      .catch((e: unknown) => {
        if (cancelled || builtIn) return;
        setError(e instanceof Error ? `불러오지 못했어요. (${e.message})` : "불러오지 못했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, builtIn]);

  if (loading && !event) {
    return (
      <StPage>
        <StCard>
          <StCardHint>불러오는 중...</StCardHint>
        </StCard>
      </StPage>
    );
  }

  if (!event) {
    return (
      <StPage>
        <StHeader>
          <StTitle>🎾 테니스</StTitle>
        </StHeader>
        <StNotice $tone="error">{error || "찾지 못했어요."}</StNotice>
        <StCard>
          <StCardHint>
            <Link href="/tennis">← 목록으로</Link>
          </StCardHint>
        </StCard>
      </StPage>
    );
  }

  // key를 id로 두어 다른 이벤트로 이동하면 상태를 새로 만든다
  return isTournament(event) ? (
    <TournamentView key={event.id} initialEvent={event} />
  ) : (
    <ExchangeView key={event.id} initialEvent={event} />
  );
}
