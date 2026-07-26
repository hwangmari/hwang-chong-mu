"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <StPage>
        <StCard>
          <StEmoji>🐾</StEmoji>
          <StTitle>유효하지 않은 접근이에요.</StTitle>
          <StSubtitle>
            재설정 링크가 올바르지 않아요. 다시 요청해 주세요.
          </StSubtitle>
          <StLinkButton type="button" onClick={() => router.push("/login")}>
            로그인으로 돌아가기
          </StLinkButton>
        </StCard>
      </StPage>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!password || !confirm) {
      setError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상으로 입력해 주세요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "요청에 실패했어요.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <StPage>
        <StCard>
          <StEmoji>✅</StEmoji>
          <StTitle>비밀번호가 변경되었어요</StTitle>
          <StSubtitle>새 비밀번호로 다시 로그인해 주세요.</StSubtitle>
          <StLinkButton type="button" onClick={() => router.push("/login")}>
            로그인하러 가기
          </StLinkButton>
        </StCard>
      </StPage>
    );
  }

  return (
    <StPage>
      <StCard>
        <StEmoji>🐾</StEmoji>
        <StTitle>비밀번호 재설정</StTitle>
        <StSubtitle>새로 사용할 비밀번호를 입력해 주세요.</StSubtitle>

        <StForm onSubmit={submit}>
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
              autoFocus
            />
          </StField>
          <StField>
            <label>비밀번호 확인</label>
            <StInput
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              placeholder="한 번 더 입력"
              autoComplete="new-password"
            />
          </StField>
          <StError>{error || " "}</StError>
          <StSubmit type="submit" disabled={submitting}>
            {submitting ? "처리 중..." : "비밀번호 변경하기"}
          </StSubmit>
        </StForm>
      </StCard>
    </StPage>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<StPage />}>
      <ResetContent />
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

const StForm = styled.form`
  display: grid;
  gap: 0.7rem;
  text-align: left;
  margin-top: 1.1rem;
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

const StLinkButton = styled.button`
  margin-top: 1.1rem;
  border: none;
  background: transparent;
  color: #3182f6;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
`;
