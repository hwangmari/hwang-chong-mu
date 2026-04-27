"use client";

// 업무 캘린더 워크스페이스 게이트.
// 기존 AccountBookLockGate의 localStorage 기반 해제 방식을 대체하며,
// 서버 API(/api/schedule/auth/enter)로 세션 쿠키를 발급받아야 통과된다.

import { FormEvent, ReactNode, useEffect, useState } from "react";
import styled from "styled-components";
import { fetchScheduleSessionApi } from "@/services/schedule-auth";

interface Props {
  children: ReactNode;
  workspaceId: string;
  workspaceName: string;
  onEnter: (password: string) => Promise<void>;
  onBack: () => void;
}

type GateState = "checking" | "locked" | "unlocked" | "error";

export default function ScheduleSessionGate({
  children,
  workspaceId,
  workspaceName,
  onEnter,
  onBack,
}: Props) {
  const [state, setState] = useState<GateState>("checking");
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 진입 시 세션 유효성 확인
  useEffect(() => {
    let cancelled = false;
    setState("checking");
    setErrorMessage("");
    fetchScheduleSessionApi()
      .then((res) => {
        if (cancelled) return;
        if (
          res.session &&
          res.session.workspaceId === workspaceId
        ) {
          setState("unlocked");
        } else {
          setState("locked");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState("locked");
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const next = passcode.trim();
    if (!next) {
      setErrorMessage("비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await onEnter(next);
      setPasscode("");
      setErrorMessage("");
      setState("unlocked");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "입장에 실패했습니다.",
      );
      setPasscode("");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "checking") {
    return <StStatus>세션 확인 중...</StStatus>;
  }

  if (state === "unlocked") {
    return <>{children}</>;
  }

  return (
    <StGatePage>
      <StGateCard>
        <StBackButton type="button" onClick={onBack}>
          ← 뒤로
        </StBackButton>
        <StTitle>{workspaceName}</StTitle>
        <StDesc>캘린더에 입장하려면 비밀번호를 입력해 주세요.</StDesc>

        <StForm onSubmit={submit}>
          <StInput
            type="password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setErrorMessage("");
            }}
            placeholder="비밀번호"
            autoFocus
            autoComplete="current-password"
          />
          {errorMessage && <StError>{errorMessage}</StError>}
          <StSubmit type="submit" disabled={submitting}>
            {submitting ? "확인 중..." : "입장"}
          </StSubmit>
        </StForm>
      </StGateCard>
    </StGatePage>
  );
}

const StStatus = styled.div`
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
`;

const StGatePage = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
`;

const StGateCard = styled.section`
  width: 100%;
  max-width: 360px;
  padding: 2rem 1.5rem;
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StBackButton = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.88rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray800};
  }
`;

const StTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StDesc = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const StForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.4rem;
`;

const StInput = styled.input`
  width: 100%;
  min-height: 2.75rem;
  padding: 0 0.85rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 1rem;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.gray700};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
  }
`;

const StError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.85rem;
  font-weight: 600;
`;

const StSubmit = styled.button`
  min-height: 2.75rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray700};
  background: ${({ theme }) => theme.colors.gray700};
  color: ${({ theme }) => theme.colors.gray50};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray600};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
