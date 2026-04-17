"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { createInBodyRoom, joinInBodyRoom } from "../repository";
import { writeInBodySession } from "../storage";
import { useInBodySession } from "../useInBodySession";

type Mode = "join" | "create";

type Props = {
  children: ReactNode;
};

export default function InBodyAuthGate({ children }: Props) {
  const router = useRouter();
  const session = useInBodySession();

  const [mode, setMode] = useState<Mode>("join");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (session) {
    return <>{children}</>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const next =
        mode === "create"
          ? await createInBodyRoom(roomName, password)
          : await joinInBodyRoom(roomName, password);
      writeInBodySession(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StGatePage>
      <StGateCard>
        <StBackButton type="button" onClick={() => router.push("/")}>
          ← 홈으로
        </StBackButton>
        <StEmoji>🧬</StEmoji>
        <StTitle>인바디 기록방</StTitle>
        <StDescription>
          내 인바디 측정값을 모아둘 전용 방을 만들거나 기존 방에 입장하세요.
        </StDescription>

        <StTabs>
          <StTab $active={mode === "join"} onClick={() => setMode("join")}>
            입장하기
          </StTab>
          <StTab $active={mode === "create"} onClick={() => setMode("create")}>
            방 만들기
          </StTab>
        </StTabs>

        <StForm onSubmit={submit}>
          <StLabel>
            방 이름
            <StInput
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예) 황총무 인바디방"
              autoComplete="off"
            />
          </StLabel>
          <StLabel>
            비밀번호
            <StInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete={mode === "create" ? "new-password" : "current-password"}
            />
          </StLabel>

          <StError>{error || " "}</StError>

          <StSubmit type="submit" disabled={busy}>
            {busy ? "잠시만요..." : mode === "create" ? "방 만들고 들어가기" : "입장"}
          </StSubmit>
        </StForm>

        <StHint>
          {mode === "create"
            ? "방 이름과 비밀번호로 내 기록을 보호해요. 잊지 않게 메모해 두세요."
            : "전에 만들었던 방 이름과 비밀번호를 입력해 주세요."}
        </StHint>
      </StGateCard>
    </StGatePage>
  );
}

const StGatePage = styled.main`
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  padding: 2rem 1.25rem;
  background: radial-gradient(
      circle at top,
      rgba(109, 135, 239, 0.16),
      transparent 32%
    ),
    linear-gradient(180deg, ${({ theme }) => theme.colors.gray100} 0%, #eef3f9 100%);
`;

const StGateCard = styled.section`
  width: min(100%, 26rem);
  padding: 1.75rem 1.5rem;
  border-radius: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 22px 60px rgba(41, 58, 92, 0.14);
`;

const StBackButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
`;

const StEmoji = styled.div`
  margin-top: 0.75rem;
  font-size: 2rem;
`;

const StTitle = styled.h1`
  margin-top: 0.5rem;
  font-size: 1.45rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StDescription = styled.p`
  margin-top: 0.4rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.92rem;
  line-height: 1.55;
`;

const StTabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1.2rem;
  padding: 0.3rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
`;

const StTab = styled.button<{ $active: boolean }>`
  border: none;
  padding: 0.7rem 0;
  border-radius: 0.7rem;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.white : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  box-shadow: ${({ $active }) =>
    $active ? "0 2px 8px rgba(41, 58, 92, 0.08)" : "none"};
`;

const StForm = styled.form`
  display: grid;
  gap: 0.8rem;
  margin-top: 1.2rem;
`;

const StLabel = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StInput = styled.input`
  min-height: 3.1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 1rem;
  font-weight: 600;
  padding: 0 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 4px rgba(79, 124, 255, 0.12);
  }
`;

const StError = styled.p`
  min-height: 1.15rem;
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0;
`;

const StSubmit = styled.button`
  min-height: 3.2rem;
  border: none;
  border-radius: 0.9rem;
  background: linear-gradient(135deg, #607de0, #4b69c8);
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StHint = styled.p`
  margin-top: 0.9rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.5;
`;
