"use client";

import { useState } from "react";
import styled from "styled-components";
import { verifyPin } from "@/services/tennisVotes";
import { saveStaff } from "../voterKey";
import {
  StGhostBtn,
  StInput,
  StPrimaryBtn,
  StSelect,
} from "../page.styles";

type Props = {
  eventId: string;
  admins: string[];
  /** 지금 이 폰에서 들어온 관리자 이름. 없으면 빈 문자열 */
  staffName: string;
  onEnter: (name: string) => void;
  onExit: () => void;
};

/**
 * 진행 요원(관리자) 모드 띠. (주인 요청 2026-10-13 — "누가 미리 눌러놔서")
 * 관리자로 정한 사람만 투표 때 정한 이름·비번으로 들어와 경기 시작·점수·팀 편집을 한다.
 * 다른 사람에게는 누가 진행하는지만 보여 준다.
 */
export default function StaffBar({
  eventId,
  admins,
  staffName,
  onEnter,
  onExit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);

  async function enter() {
    if (!name || pin.length !== 4) return;
    setChecking(true);
    try {
      const result = await verifyPin(eventId, name, pin);
      if (result === "ok") {
        saveStaff(eventId, name, pin);
        onEnter(name);
        setOpen(false);
        setPin("");
        setMsg("");
      } else if (result === "none") {
        setMsg(
          `${name}님은 아직 비번이 없어요. 투표 탭에서 이름을 고르고 비번을 먼저 정해 주세요.`,
        );
      } else {
        setMsg("비번이 달라요. 투표할 때 정한 네 자리를 넣어 주세요.");
      }
    } catch {
      setMsg("확인하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
    } finally {
      setChecking(false);
    }
  }

  if (staffName) {
    return (
      <StBar $on>
        <span>
          🔐 진행 요원 모드 · <b>{staffName}</b>
        </span>
        <StGhostBtn type="button" onClick={onExit}>
          나가기
        </StGhostBtn>
      </StBar>
    );
  }

  return (
    <StBar>
      <StRow>
        <span>경기 시작·점수는 진행 요원({admins.join("·")})만 넣어요.</span>
        <StGhostBtn
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "닫기" : "🔐 진행 요원"}
        </StGhostBtn>
      </StRow>
      {open ? (
        <StForm>
          <StSelect
            aria-label="진행 요원 이름"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMsg("");
            }}
          >
            <option value="">이름 고르기</option>
            {admins.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </StSelect>
          <StInput
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
              if (e.key === "Enter") void enter();
            }}
          />
          <StPrimaryBtn
            type="button"
            disabled={!name || pin.length !== 4 || checking}
            onClick={() => void enter()}
          >
            {checking ? "확인 중…" : "들어가기"}
          </StPrimaryBtn>
        </StForm>
      ) : null}
      {msg ? <StMsg>{msg}</StMsg> : null}
    </StBar>
  );
}

const StBar = styled.div<{ $on?: boolean }>`
  display: flex;
  flex-direction: ${({ $on }) => ($on ? "row" : "column")};
  align-items: ${({ $on }) => ($on ? "center" : "stretch")};
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme, $on }) =>
    $on ? theme.colors.blue50 : theme.semantic.bg};
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.5;
  color: ${({ theme, $on }) =>
    $on ? theme.colors.blue600 : theme.semantic.subText};
  word-break: keep-all;

  b {
    font-weight: 800;
  }
`;

const StRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StForm = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.4rem;
  align-items: center;

  & > * {
    min-height: 2.5rem;
  }
`;

const StMsg = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.danger};
`;
