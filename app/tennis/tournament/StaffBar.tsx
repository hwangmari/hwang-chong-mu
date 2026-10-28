"use client";

import { useState } from "react";
import styled from "styled-components";
import { useModal } from "@/components/common/ModalProvider";
import { verifyPin, type TournamentPhase } from "@/services/tennisVotes";
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
  phase: TournamentPhase;
  /** 우승팀 토토가 마감됐는지 */
  totoClosed: boolean;
  /** 베스트드레서가 마감(=공개)됐는지 */
  dresserClosed: boolean;
  busy: boolean;
  onPhase: (next: TournamentPhase) => Promise<void>;
  onToto: (closed: boolean) => Promise<void>;
  onDresser: (closed: boolean) => Promise<void>;
  onEnter: (name: string) => void;
  onExit: () => void;
};

const PHASE_TEXT: Record<TournamentPhase, string> = {
  before: "대회 시작 전 · 진행 요원이 시작하면 경기를 시작할 수 있어요.",
  live: "대회 진행 중 · 경기 시작·점수는 누구나 넣을 수 있어요.",
  ended: "대회가 끝났어요.",
};

/**
 * 진행 요원(관리자) 모드 띠. (주인 요청 2026-10-13 — "누가 미리 눌러놔서")
 * 진행 요원은 "대회 시작"·"대회 끝"과 "토토 마감"을 누른다. 그 사이 경기 시작·점수는 누구나 한다.
 * 토토 마감은 대회 시작과 따로다 — 첫 경기를 보고 닫아도 된다 (주인 요청 2026-10-27).
 * 대회 끝과 함께 토토도 닫히고 누가 어디에 걸었는지 공개된다.
 * 베스트드레서 마감도 여기서 (주인 요청 2026-10-28) — 투표 탭 관리자 칸의 "마감하고 공개"와 같은 값(closed.dresser).
 * 시상식 뒤에 발표하므로 대회가 끝나도 단추가 남는다.
 */
export default function StaffBar({
  eventId,
  admins,
  staffName,
  phase,
  totoClosed,
  dresserClosed,
  busy,
  onPhase,
  onToto,
  onDresser,
  onEnter,
  onExit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const { openConfirm } = useModal();

  async function go(next: TournamentPhase, message: string) {
    if (await openConfirm(message)) await onPhase(next);
  }

  async function toggleToto() {
    const message = totoClosed
      ? "우승팀 토토를 다시 열까요? 다시 팀을 고르거나 바꿀 수 있게 돼요."
      : "우승팀 토토를 마감할까요? 이제 아무도 팀을 고르거나 바꿀 수 없어요. 누가 어디에 걸었는지는 대회가 끝나면 공개돼요.";
    if (await openConfirm(message)) await onToto(!totoClosed);
  }

  async function toggleDresser() {
    const message = dresserClosed
      ? "베스트드레서를 다시 열까요? 다시 고르거나 바꿀 수 있게 돼요."
      : "베스트드레서를 마감할까요? 이제 아무도 고르거나 바꿀 수 없고, 픽셀 코트·투표 탭에서 결과를 발표할 수 있게 돼요.";
    if (await openConfirm(message)) await onDresser(!dresserClosed);
  }

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
        <StRow>
          <span>
            🔐 진행 요원 · <b>{staffName}</b> · {PHASE_TEXT[phase]}
            {phase !== "ended"
              ? ` 토토 ${totoClosed ? "마감됨" : "받는 중"}.`
              : null}
            {` 베스트드레서 ${dresserClosed ? "마감됨" : "받는 중"}.`}
          </span>
          <StGhostBtn type="button" onClick={onExit}>
            나가기
          </StGhostBtn>
        </StRow>
        <StActionsRow>
          {phase === "before" ? (
            <StPrimaryBtn
              type="button"
              disabled={busy}
              onClick={() =>
                void go(
                  "live",
                  "대회를 시작할까요? 누구나 경기를 시작할 수 있게 돼요. 우승팀 토토는 따로 마감해야 닫혀요.",
                )
              }
            >
              ▶ 대회 시작
            </StPrimaryBtn>
          ) : null}
          {phase === "live" ? (
            <>
              <StPrimaryBtn
                type="button"
                disabled={busy}
                onClick={() =>
                  void go(
                    "ended",
                    "대회를 끝낼까요? 점수 입력이 닫히고 토토에서 누가 어디에 걸었는지 공개돼요.",
                  )
                }
              >
                🏁 대회 끝
              </StPrimaryBtn>
              <StGhostBtn
                type="button"
                disabled={busy}
                onClick={() =>
                  void go(
                    "before",
                    "대회 시작을 취소할까요? 경기 시작이 다시 막혀요. 넣은 점수는 그대로 남아요.",
                  )
                }
              >
                시작 취소
              </StGhostBtn>
            </>
          ) : null}
          {phase === "ended" ? (
            <StGhostBtn
              type="button"
              disabled={busy}
              onClick={() =>
                void go(
                  "live",
                  "대회를 다시 진행 중으로 돌릴까요? 점수를 다시 고칠 수 있게 돼요.",
                )
              }
            >
              다시 진행 중으로
            </StGhostBtn>
          ) : null}
          {phase !== "ended" ? (
            <StGhostBtn
              type="button"
              disabled={busy}
              onClick={() => void toggleToto()}
            >
              {totoClosed ? "🎟️ 토토 다시 열기" : "🎟️ 토토 마감"}
            </StGhostBtn>
          ) : null}
          <StGhostBtn
            type="button"
            disabled={busy}
            onClick={() => void toggleDresser()}
          >
            {dresserClosed ? "👗 베스트드레서 다시 열기" : "👗 베스트드레서 마감"}
          </StGhostBtn>
        </StActionsRow>
      </StBar>
    );
  }

  return (
    <StBar>
      <StRow>
        <span>
          {PHASE_TEXT[phase]} (진행 요원 {admins.join("·")})
        </span>
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
  flex-direction: column;
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

const StActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
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
