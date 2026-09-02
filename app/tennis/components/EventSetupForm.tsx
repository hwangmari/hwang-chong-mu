"use client";

import { useMemo, useState } from "react";
import BracketEditor from "./BracketEditor";
import { generateBracket, suggestSplit, type Generated } from "../generate";
import { parsePlayersText } from "../parsePlayers";
import { formatDate, roundLabel, roundTime } from "../format";
import {
  StActions,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StFieldName,
  StInput,
  StLabel,
  StNotice,
  StPrimaryBtn,
  StRow,
  StTextarea,
} from "../page.styles";
import type { EventDraft, Match, Player, Round } from "../types";
import type { NewTennisEvent } from "@/services/tennis";
import { formatDateKey } from "@/utils/date";

type Props = {
  onCreate: (event: NewTennisEvent) => Promise<void>;
};

const PLAYERS_PLACEHOLDER = `한 줄에 한 명씩: 이름 성별 구력(년) 소속(선택)
박종연 남 10 한화시스템
서지수 여 4 한화시스템
차종근 남 1 한화생명
이선민 여        ← 구력·소속을 모르면 비워도 돼요`;

export default function EventSetupForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(formatDateKey(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [place, setPlace] = useState("");
  const [courts, setCourts] = useState(2);
  const [rounds, setRounds] = useState(8);
  const [minutesPerMatch, setMinutesPerMatch] = useState(45);
  const [afterNote, setAfterNote] = useState("");
  const [playersText, setPlayersText] = useState("");

  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => parsePlayersText(playersText), [playersText]);
  const players = useMemo(
    () => lines.map((l) => l.player).filter((p): p is Player => p !== null),
    [lines],
  );
  const badLines = lines.filter((l) => l.error);
  const men = players.filter((p) => p.gender === "M").length;
  const women = players.length - men;

  // 남복/여복/혼복 구성은 인원·코트·라운드로 자동 결정 (사람이 계산하지 않는다)
  const split = useMemo(
    () => suggestSplit(players, courts, rounds),
    [players, courts, rounds],
  );
  const totalMatches = courts * rounds;
  const splitOk =
    split.menMatches + split.womenMatches + split.mixedMatches === totalMatches;

  const menApps = men ? (4 * split.menMatches + 2 * split.mixedMatches) / men : 0;
  const womenApps = women ? (4 * split.womenMatches + 2 * split.mixedMatches) / women : 0;

  function draft(): EventDraft {
    return {
      title: title.trim(),
      date,
      startTime,
      place: place.trim(),
      courts,
      rounds,
      minutesPerMatch,
      afterNote: afterNote.trim(),
      players,
      ...split,
    };
  }

  function generate() {
    setError("");
    if (players.length < 4) {
      setError("선수를 최소 4명 넣어 주세요.");
      return;
    }
    if (!splitOk) {
      setError("이 인원으로는 경기를 다 채울 수 없어요. 라운드나 코트 수를 줄여 보세요.");
      return;
    }
    const result = generateBracket(draft());
    if ("error" in result) {
      setError(result.error);
      setGenerated(null);
      return;
    }
    setGenerated(result);
  }

  function updateMatches(matches: Match[]) {
    if (!generated) return;
    // 손으로 고치면 라운드 제목(종목 구성)은 그대로 두고 경기만 바꾼다
    setGenerated({ ...generated, matches });
  }

  async function create() {
    if (!generated) return;
    if (!title.trim()) {
      setError("교류전 이름을 넣어 주세요.");
      return;
    }
    if (!date) {
      setError("날짜를 넣어 주세요.");
      return;
    }
    const hasError = generated.warnings.some((w) => w.level === "error");
    if (hasError) {
      setError("빨간 경고가 남아 있어요. 대진표를 고치거나 다시 짜 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const roundsOut: Round[] = generated.rounds.map((r, i) => ({
        ...r,
        label: roundLabel(generated.matches.filter((m) => m.round === r.no).map((m) => m.type)),
        time: roundTime(startTime, minutesPerMatch, i),
      }));
      await onCreate({
        title: title.trim(),
        date,
        startTime,
        place: place.trim(),
        courts,
        minutesPerMatch,
        afterNote: afterNote.trim(),
        players,
        rounds: roundsOut,
        matches: generated.matches,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "만들지 못했어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🆕 새 교류전 만들기</StCardTitle>
      </StCardHead>
      <StCardHint>
        기본 정보와 선수 명단을 넣고 &ldquo;대진표 자동으로 짜기&rdquo;를 누르면 전원 고르게 출전하고
        같은 짝이 겹치지 않는 대진표를 만들어요. 마음에 안 들면 다시 짜거나 선수만 바꿔 넣을 수
        있어요.
      </StCardHint>

      <StRow>
        <StLabel>
          <StFieldName>교류전 이름</StFieldName>
          <StInput
            type="text"
            placeholder="예) 한화시스템 × 한화생명 테니스 교류전"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
          />
        </StLabel>
        <StLabel>
          <StFieldName>장소</StFieldName>
          <StInput
            type="text"
            placeholder="예) 상천체육문화연수원"
            value={place}
            maxLength={60}
            onChange={(e) => setPlace(e.target.value)}
          />
        </StLabel>
      </StRow>

      <StRow>
        <StLabel>
          <StFieldName>날짜</StFieldName>
          <StInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>첫 경기 시작</StFieldName>
          <StInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>경기당 시간(분)</StFieldName>
          <StInput
            type="number"
            min={10}
            max={180}
            value={minutesPerMatch}
            onChange={(e) => setMinutesPerMatch(Math.max(10, Math.min(180, Number(e.target.value) || 45)))}
          />
        </StLabel>
      </StRow>

      <StRow>
        <StLabel>
          <StFieldName>코트 수 (최대 2면)</StFieldName>
          <StInput
            type="number"
            min={1}
            max={2}
            value={courts}
            onChange={(e) => setCourts(Math.max(1, Math.min(2, Number(e.target.value) || 1)))}
          />
        </StLabel>
        <StLabel>
          <StFieldName>라운드 수</StFieldName>
          <StInput
            type="number"
            min={1}
            max={20}
            value={rounds}
            onChange={(e) => setRounds(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </StLabel>
        <StLabel>
          <StFieldName>경기 후 일정 (선택)</StFieldName>
          <StInput
            type="text"
            placeholder="예) 16:00 종료 후 저녁 식사"
            value={afterNote}
            maxLength={80}
            onChange={(e) => setAfterNote(e.target.value)}
          />
        </StLabel>
      </StRow>

      <StLabel>
        <StFieldName>
          선수 명단 — {players.length}명 (남 {men} · 여 {women})
          {badLines.length > 0 ? ` · 못 읽은 줄 ${badLines.length}개` : ""}
        </StFieldName>
        <StTextarea
          placeholder={PLAYERS_PLACEHOLDER}
          value={playersText}
          onChange={(e) => {
            setPlayersText(e.target.value);
            setGenerated(null);
          }}
        />
      </StLabel>
      {badLines.length > 0 ? (
        <StNotice $tone="warn">
          {badLines.map((l) => `"${l.raw}" → ${l.error}`).join(" / ")}
        </StNotice>
      ) : null}

      <StCardHint>
        총 {totalMatches}경기 ({rounds}라운드 × {courts}코트).
        {players.length >= 4 && splitOk
          ? ` 인원에 맞춰 남자 복식 ${split.menMatches} · 여자 복식 ${split.womenMatches} · 혼합 복식 ${split.mixedMatches}경기로 짜요. 남자는 1인당 약 ${menApps.toFixed(1)}회, 여자는 약 ${womenApps.toFixed(1)}회 출전해요.`
          : players.length >= 4
            ? " 이 인원으로는 경기를 다 채울 수 없어요. 라운드나 코트 수를 줄여 보세요."
            : " 선수 명단을 넣으면 종목 구성을 자동으로 정해 드려요."}
      </StCardHint>

      <StActions>
        <StPrimaryBtn type="button" onClick={generate} disabled={players.length < 4}>
          {generated ? "🔁 대진표 다시 짜기" : "🎲 대진표 자동으로 짜기"}
        </StPrimaryBtn>
      </StActions>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}

      {generated ? (
        <>
          <StCardHead>
            <StCardTitle>
              📋 대진표 미리보기 · {formatDate(date)} {startTime}부터
            </StCardTitle>
          </StCardHead>
          <StCardHint>
            선수 이름을 눌러 바꿀 수 있어요. 빨간 경고는 고쳐야 만들 수 있고, 주황 경고는 참고만
            하면 돼요.
          </StCardHint>
          <BracketEditor
            players={players}
            rounds={generated.rounds}
            matches={generated.matches}
            onChange={updateMatches}
          />
          <StActions>
            <StPrimaryBtn type="button" onClick={create} disabled={busy}>
              {busy ? "만드는 중..." : "✅ 이 대진표로 교류전 만들기"}
            </StPrimaryBtn>
          </StActions>
        </>
      ) : null}
    </StCard>
  );
}
