"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { broadcastAuthChange } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "reset";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setResetSent(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nick = nickname.trim();

    // 비밀번호 찾기(메일 발송 없음): 닉네임+가입 이메일이 맞으면 즉시 새 비번으로 교체
    if (mode === "reset") {
      const mail = email.trim();
      if (!nick || !mail || !password) {
        setError("닉네임·이메일·새 비밀번호를 입력해 주세요.");
        return;
      }
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/auth/reset/direct", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nickname: nick, email: mail, password }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error || "요청에 실패했어요.");
          setSubmitting(false);
          return;
        }
        setResetSent(true);
        setSubmitting(false);
      } catch {
        setError("네트워크 오류가 발생했어요.");
        setSubmitting(false);
      }
      return;
    }

    // 로그인 / 회원가입
    if (!nick || !password) {
      setError("닉네임과 비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body: { nickname: string; password: string; email?: string } = {
        nickname: nick,
        password,
      };
      if (mode === "signup" && email.trim()) body.email = email.trim();
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "요청에 실패했어요.");
        setSubmitting(false);
        return;
      }
      broadcastAuthChange();
      router.replace(nextPath);
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <StPage>
      <StCard>
        <StEmoji>🐾</StEmoji>
        <StTitle>
          {mode === "login"
            ? "로그인"
            : mode === "signup"
              ? "회원가입"
              : "비밀번호 찾기"}
        </StTitle>
        <StSubtitle>
          {mode === "reset"
            ? "닉네임과 가입 이메일이 맞으면 새 비밀번호로 바로 바꿔드려요."
            : "닉네임 하나로 황총무의 여러 서비스를 한 계정으로 이어보세요."}
        </StSubtitle>

        {mode !== "reset" && (
          <StTabs>
            <StTab
              type="button"
              $active={mode === "login"}
              onClick={() => switchMode("login")}
            >
              로그인
            </StTab>
            <StTab
              type="button"
              $active={mode === "signup"}
              onClick={() => switchMode("signup")}
            >
              회원가입
            </StTab>
          </StTabs>
        )}

        {mode === "reset" && resetSent ? (
          <StNotice>
            <p>비밀번호가 변경됐어요. 새 비밀번호로 로그인해 주세요.</p>
            <StTextButton type="button" onClick={() => switchMode("login")}>
              로그인하러 가기
            </StTextButton>
          </StNotice>
        ) : (
          <StForm onSubmit={submit}>
            <StField>
              <label>닉네임</label>
              <StInput
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError("");
                }}
                placeholder="2~20자"
                autoComplete="username"
                autoFocus
              />
            </StField>

            {mode === "reset" ? (
              <>
                <StField>
                  <label>가입 이메일</label>
                  <StInput
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="가입 때 입력한 이메일"
                    autoComplete="email"
                  />
                </StField>
                <StField>
                  <label>새 비밀번호</label>
                  <StInput
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="4자 이상"
                    autoComplete="new-password"
                  />
                </StField>
              </>
            ) : (
              <StField>
                <label>비밀번호</label>
                <StInput
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="4자 이상"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </StField>
            )}

            {mode === "signup" && (
              <StField>
                <label>이메일 (선택 · 비밀번호 찾기용)</label>
                <StInput
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="비번 찾을 때만 사용해요"
                  autoComplete="email"
                />
              </StField>
            )}

            <StError>{error || " "}</StError>
            <StSubmit type="submit" disabled={submitting}>
              {submitting
                ? "처리 중..."
                : mode === "login"
                  ? "로그인"
                  : mode === "signup"
                    ? "가입하고 시작하기"
                    : "비밀번호 변경"}
            </StSubmit>

            {mode === "login" && (
              <StTextButton type="button" onClick={() => switchMode("reset")}>
                비밀번호를 잊으셨나요?
              </StTextButton>
            )}
            {mode === "reset" && (
              <StTextButton type="button" onClick={() => switchMode("login")}>
                로그인으로 돌아가기
              </StTextButton>
            )}
          </StForm>
        )}
      </StCard>
    </StPage>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<StPage />}>
      <LoginContent />
    </Suspense>
  );
}

const StPage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: #f6f6f6;
`;

const StCard = styled.section`
  width: min(100%, 24rem);
  padding: 1.6rem 1.4rem;
  border-radius: 1.5rem;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(56, 58, 61, 0.12);
  text-align: center;
`;

const StEmoji = styled.div`
  font-size: 2rem;
`;

const StTitle = styled.h1`
  margin-top: 0.5rem;
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StSubtitle = styled.p`
  margin-top: 0.35rem;
  font-size: 0.86rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StTabs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem;
  margin: 1.1rem 0 0.9rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: #f1f2f3;
`;

const StTab = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "#ffffff" : "transparent")};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.gray900 : "#8a8e95"};
  box-shadow: ${({ $active }) =>
    $active ? "0 2px 8px rgba(0,0,0,0.06)" : "none"};
`;

const StForm = styled.form`
  display: grid;
  gap: 0.7rem;
  text-align: left;
`;

const StField = styled.div`
  display: grid;
  gap: 0.3rem;

  label {
    font-size: 0.78rem;
    font-weight: 800;
    color: #6a6f78;
  }
`;

const StInput = styled.input`
  min-height: 3rem;
  border: 1px solid #e2e3e5;
  border-radius: 0.9rem;
  padding: 0 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray800};

  &:focus {
    outline: none;
    border-color: #a9c0f5;
    box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.1);
  }
`;

const StError = styled.p`
  min-height: 1.1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #d04a73;
`;

const StSubmit = styled.button`
  min-height: 3rem;
  border: none;
  border-radius: 0.9rem;
  background: #3182f6;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    background: #cdd2d9;
    cursor: default;
  }
`;

const StTextButton = styled.button`
  margin-top: 0.3rem;
  border: none;
  background: transparent;
  color: #3182f6;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  justify-self: center;
`;

const StNotice = styled.div`
  display: grid;
  gap: 0.9rem;
  margin-top: 1.1rem;
  text-align: center;

  p {
    font-size: 0.9rem;
    line-height: 1.6;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
  }
`;
