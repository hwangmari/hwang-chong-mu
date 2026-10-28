"use client";

import { useState } from "react";
import styled from "styled-components";
import { checkOrCreatePin } from "@/services/tennisVotes";
import { clearSavedVoter, saveVoter } from "../voterKey";
import type { TournamentEvent } from "./types";

/**
 * 픽셀 코트 전광판의 "내 이름 + 비번 4자리" 칸 (주인 요청 2026-10-28 "투표 탭 이름·비번 정책도 픽셀 코트에").
 * 주인 결정으로 투표 탭(VotePanel) 칸은 그대로 두고 여기 따로 하나 더 둔다.
 * 확인은 투표 탭과 같은 checkOrCreatePin / saveVoter — 처음 넣은 네 자리가 비번, 틀리면 막는다.
 * 한 번 통과하면 이 폰에 저장되어 투표 탭과 픽셀 코트 둘 다 열린다.
 * ⚠️ 투표 탭 관문 문구·규칙을 바꾸면 여기도 같이 바꾼다.
 */

type Props = {
  event: TournamentEvent;
  myName: string;
  onChange: (voter: { name: string; pin: string } | null) => void;
};

export default function PixelVoterGate({ event, myName, onChange }: Props) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");
  const names = [...event.roster].map((r) => r.name).sort((a, b) => a.localeCompare(b, "ko"));

  if (myName) {
    return (
      <StOpen>
        <span>
          <b>{myName}</b>님으로 걸기 중
        </span>
        <StGhost
          type="button"
          onClick={() => {
            clearSavedVoter();
            onChange(null);
          }}
        >
          다른 사람
        </StGhost>
      </StOpen>
    );
  }

  async function unlock() {
    if (!name || pin.length !== 4) return;
    setChecking(true);
    try {
      const result = await checkOrCreatePin(event.id, name, pin);
      if (result === "wrong") {
        setMsg("비번이 달라요. 처음 투표할 때 정한 네 자리를 넣어 주세요.");
        return;
      }
      saveVoter(name, pin);
      onChange({ name, pin });
    } catch {
      setMsg("확인하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <StGate>
      <StRow>
        <select
          aria-label="내 이름"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setMsg("");
          }}
        >
          <option value="">내 이름 고르기</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          aria-label="비번 4자리"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder="비번 4자리"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setMsg("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void unlock();
          }}
        />
        <StGo type="button" disabled={!name || pin.length !== 4 || checking} onClick={() => void unlock()}>
          {checking ? "확인 중…" : "열기"}
        </StGo>
      </StRow>
      <StHint>{msg || "처음 넣은 네 자리가 내 비번이 돼요. 투표 탭과 같은 비번이에요."}</StHint>
    </StGate>
  );
}

const INK = "#24343b";

const StGate = styled.div`
  display: grid;
  gap: 0.35rem;
  width: 100%;
`;

const StRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  select,
  input {
    min-width: 0;
    padding: 0.4rem 0.55rem;
    border: 2px solid ${INK};
    font-size: 0.85rem;
    background: #ffffff;
    color: ${INK};
  }

  select {
    flex: 1 1 8rem;
  }

  input {
    flex: 0 1 7rem;
  }
`;

const StGo = styled.button`
  padding: 0.4rem 0.9rem;
  border: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${INK};
  background: #ffcf4a;
  box-shadow: 3px 3px 0 ${INK};
  cursor: pointer;

  &:disabled {
    color: #9aa6a9;
    box-shadow: 3px 3px 0 #c2cdd0;
    cursor: default;
  }
`;

const StHint = styled.p`
  font-size: 0.76rem;
  font-weight: 600;
  color: #6b7c80;
`;

const StOpen = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7c80;

  b {
    font-weight: 900;
    color: ${INK};
  }
`;

const StGhost = styled.button`
  padding: 0.25rem 0.55rem;
  border: 0;
  font-size: 0.74rem;
  font-weight: 700;
  color: #6b7c80;
  background: #eef3f4;
  cursor: pointer;
`;
