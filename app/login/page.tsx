"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 환경 변수에 설정한 비밀번호와 비교
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === correctPassword) {
      // ✅ 정답! 쿠키에 입장권 발급 (유효기간 1일)
      // (보안을 위해 secure 옵션 등을 추가할 수 있습니다)
      document.cookie = `auth_token=true; path=/; max-age=${60 * 60 * 24}`;

      // 캘린더 페이지로 이동
      router.push("/schedule");
    } else {
      setError("비밀번호가 틀렸습니다. 다시 시도해주세요. 🐰");
    }
  };

  return (
    <StContainer>
      <StCard>
        <StIcon>🔒</StIcon>
        <StTitle>관계자 외 출입금지</StTitle>
        <StDesc>
          황총무의 업무 캘린더에 접근하려면
          <br />
          관리자 비밀번호가 필요합니다.
        </StDesc>

        <StForm onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}

          <button type="submit">입장하기</button>
        </StForm>

        <Link href="/" className="back-home">
          ← 메인으로 돌아가기
        </Link>
      </StCard>
    </StContainer>
  );
}

// --- 스타일 ---
const StContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fafb;
  padding: 1.5rem;
`;

const StCard = styled.div`
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  .back-home {
    display: inline-block;
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: #9ca3af;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
      color: #6b7280;
    }
  }
`;

const StIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const StTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const StDesc = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 2rem;
`;

const StForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  input {
    width: 100%;
    padding: 0.85rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  button {
    width: 100%;
    padding: 0.85rem;
    background-color: #111827;
    color: white;
    font-weight: 700;
    border-radius: 12px;
    font-size: 1rem;
    transition: background 0.2s;
    &:hover {
      background-color: #000;
    }
  }

  .error-msg {
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 500;
    animation: shake 0.3s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }
`;
