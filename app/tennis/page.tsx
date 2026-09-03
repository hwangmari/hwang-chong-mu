"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventSetupForm from "./components/EventSetupForm";
import TournamentSetupForm from "./tournament/TournamentSetupForm";
import type { TournamentEvent } from "./tournament/types";
import { EVENTS } from "./data";
import { TOURNAMENTS } from "./tournament/data";
import { formatDate, formatEventDate } from "./format";
import { createTennisEvent, createTournament, type NewTennisEvent } from "@/services/tennis";
import FooterGuide from "@/components/common/FooterGuide";
import { TENNIS_GUIDE_DATA } from "@/data/footerGuides";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StEventLink,
  StTab,
  StTabRow,
  StEventMeta,
  StEventTitle,
  StHeader,
  StNotice,
  StPage,
  StSubtitle,
  StTitle,
} from "./page.styles";

// 이 브라우저에서 만든 교류전 목록 (DB엔 목록 조회 화면이 없으므로 링크를 기억해 둔다)
const MY_EVENTS_KEY = "hcm:tennis:my-events";

type MyEvent = { id: string; title: string; date: string };

function loadMyEvents(): MyEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_EVENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as MyEvent[]) : [];
  } catch {
    return [];
  }
}

function rememberMyEvent(item: MyEvent) {
  if (typeof window === "undefined") return;
  const next = [item, ...loadMyEvents().filter((e) => e.id !== item.id)].slice(0, 20);
  window.localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(next));
}

export default function TennisHomePage() {
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<"exchange" | "tournament">("exchange");

  useEffect(() => {
    // localStorage는 브라우저에서만 읽을 수 있어서 첫 렌더 뒤에 채운다
    const timer = window.setTimeout(() => setMyEvents(loadMyEvents()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function create(input: NewTennisEvent) {
    setError("");
    try {
      const event = await createTennisEvent(input);
      rememberMyEvent({ id: event.id, title: event.title, date: event.date });
      router.push(`/tennis/${event.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(
        `교류전을 저장하지 못했어요. 공용 저장 공간(tennis_events 표)이 아직 없다면 supabase/20260902_create_tennis_events.sql을 실행해 주세요.${message ? ` (${message})` : ""}`,
      );
      throw e;
    }
  }

  async function createT(input: Omit<TournamentEvent, "id" | "builtIn">) {
    setError("");
    try {
      const event = await createTournament(input);
      rememberMyEvent({ id: event.id, title: event.title, date: event.date });
      router.push(`/tennis/${event.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(
        `토너먼트를 저장하지 못했어요. tennis_events 표가 없거나 오래됐다면 supabase/20260902_create_tennis_events.sql 또는 20260903_add_tennis_tournament.sql을 실행해 주세요.${message ? ` (${message})` : ""}`,
      );
      throw e;
    }
  }

  return (
    <StPage>
      <StHeader>
        <StTitle>🎾 테니스 교류전</StTitle>
        <StSubtitle>
          선수 명단만 넣으면 대진표를 자동으로 짜고, 링크 하나로 점수를 모아 승점 순위를 바로 봐요.
        </StSubtitle>
      </StHeader>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      <StCard>
        <StCardHead>
          <StCardTitle>📌 진행 중인 교류전</StCardTitle>
        </StCardHead>
        {TOURNAMENTS.map((t) => (
          <StEventLink key={t.id} as={Link} href={`/tennis/${t.id}`}>
            <StEventTitle>🏆 {t.title}</StEventTitle>
            <StEventMeta>
              {formatDate(t.date)} {t.timeTbd ? "· 시간 미정" : t.startTime} · {t.place} · {t.teams.length}팀 더블 엘리미네이션 · 코트 {t.courts}면
            </StEventMeta>
          </StEventLink>
        ))}
        {EVENTS.map((event) => (
          <StEventLink key={event.id} as={Link} href={`/tennis/${event.id}`}>
            <StEventTitle>🎾 {event.title}</StEventTitle>
            <StEventMeta>
              {formatEventDate(event)} · {event.place} · {event.players.length}명 · {event.matches.length}경기
            </StEventMeta>
          </StEventLink>
        ))}
        {myEvents.map((event) => (
          <StEventLink key={event.id} as={Link} href={`/tennis/${event.id}`}>
            <StEventTitle>{event.title}</StEventTitle>
            <StEventMeta>{event.date} · 이 브라우저에서 만든 교류전</StEventMeta>
          </StEventLink>
        ))}
        <StCardHint>
          다른 기기에서 만든 교류전은 여기 안 보여요. 만들 때 받은 링크로 들어가면 돼요.
        </StCardHint>
      </StCard>

      <StCard>
        <StCardHead>
          <StCardTitle>🆕 새로 만들기 · 어떤 대회인가요?</StCardTitle>
        </StCardHead>
        <StTabRow>
          <StTab type="button" $active={kind === "exchange"} onClick={() => setKind("exchange")}>
            🎾 교류전 (개인 승점 · 짝 바꿔가며)
          </StTab>
          <StTab type="button" $active={kind === "tournament"} onClick={() => setKind("tournament")}>
            🏆 팀 토너먼트 (8팀 더블 엘리미네이션)
          </StTab>
        </StTabRow>
        <StCardHint>
          {kind === "exchange"
            ? "한화 교류전처럼 개인이 짝을 바꿔가며 뛰고 개인 승점으로 순위를 매겨요. 선수 명단만 넣으면 대진표를 자동으로 짜요."
            : "63OPEN처럼 4명이 한 팀이 되어 팀끼리 붙어요. 두 번 지면 탈락, 순위결정전으로 1~8위를 정해요."}
        </StCardHint>
      </StCard>

      {kind === "exchange" ? <EventSetupForm onCreate={create} /> : (
        <StCard>
          <TournamentSetupForm onCreate={createT} />
        </StCard>
      )}

      <FooterGuide
        title={TENNIS_GUIDE_DATA.title}
        story={TENNIS_GUIDE_DATA.story}
        tips={TENNIS_GUIDE_DATA.tips}
        blogGuideId="tennis-double-elimination-guide"
      />
    </StPage>
  );
}
