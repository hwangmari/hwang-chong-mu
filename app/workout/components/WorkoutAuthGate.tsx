"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { createWorkoutRoom, joinWorkoutRoom } from "../repository";
import { writeWorkoutSession } from "../storage";
import {
  useWorkoutSession,
  useWorkoutSessionReady,
} from "../useWorkoutSession";
import FooterGuide from "@/components/common/FooterGuide";
import { WORKOUT_GUIDE_DATA } from "@/data/footerGuides";
import { SkeletonBlock, SkeletonList } from "@/components/common/Skeleton";

type Mode = "join" | "create";

type Props = {
  children: ReactNode;
};

export default function WorkoutAuthGate({ children }: Props) {
  const router = useRouter();
  const session = useWorkoutSession();
  const sessionReady = useWorkoutSessionReady();

  const [mode, setMode] = useState<Mode>("join");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 저장된 방 정보를 아직 읽지 못한 찰나엔 입장 폼 대신 뼈대를 보여 준다.
  // (바로 로그인 폼이 번쩍였다가 사라지는 걸 막는다)
  if (!sessionReady) {
    return (
      <StSkeletonPage>
        <StSkeletonContent>
          <SkeletonBlock width="min(100%, 18rem)" height="2.4rem" radius="0.9rem" />
          <SkeletonList count={3} height="7.5rem" lines={2} />
        </StSkeletonContent>
      </StSkeletonPage>
    );
  }

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
          ? await createWorkoutRoom(roomName, password)
          : await joinWorkoutRoom(roomName, password);
      writeWorkoutSession(next);
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
        <StEmoji>🏋️‍♂️</StEmoji>
        <StTitle>운동 기록방</StTitle>
        <StDescription>
          내 러닝·헬스 기록을 모아둘 전용 방을 만들거나 기존 방에 입장하세요.
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
              placeholder="예) 황총무 운동방"
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

      <StGateGuide>
        <FooterGuide
          title={WORKOUT_GUIDE_DATA.title}
          story={WORKOUT_GUIDE_DATA.story}
          tips={WORKOUT_GUIDE_DATA.tips}
          blogGuideId="workout-guide"
        />
      </StGateGuide>
    </StGatePage>
  );
}

// 로그인 후 실제 화면(WorkoutShell)과 같은 폭·여백을 써서 자리가 어긋나지 않게 한다
const StSkeletonPage = styled.div`
  min-height: calc(100vh - 64px);
  background: ${({ theme }) => theme.colors.gray50};
  overflow-x: clip;
`;

const StSkeletonContent = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem 1rem 4rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 540px) {
    padding: 1rem 0 3rem;
  }
`;

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

// 로그인 카드 아래에 안내글을 같은 폭 한도로 놓기 위한 감싸개
const StGateGuide = styled.div`
  width: min(100%, 40rem);
  margin-top: 1.5rem;
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
