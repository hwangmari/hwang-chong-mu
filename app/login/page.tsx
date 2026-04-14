"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();

    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === correctPassword) {
      document.cookie = `auth_token=true; path=/; max-age=${60 * 60 * 24}`;

      router.push("/schedule");
    } else {
      setError("비밀번호가 틀렸습니다. 다시 시도해주세요. 🐰");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin(e);
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
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}

          <button type="submit">입장하기</button>
        </StForm>

        <Link href="/" className="back-home">
          <span className="back-home-content">
            <ArrowBackIcon fontSize="inherit" />
            메인으로 돌아가기
          </span>
        </Link>
      </StCard>
    </StContainer>
  );
}

const StContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1.5rem;
`;

const StCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  .back-home {
    display: inline-block;
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray400};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
      color: ${({ theme }) => theme.colors.gray500};
    }
  }

  .back-home-content {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const StIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const StTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const StDesc = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
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
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 12px;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;
    &:focus {
      border-color: ${({ theme }) => theme.colors.blue500};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  button {
    width: 100%;
    padding: 0.85rem;
    background-color: ${({ theme }) => theme.colors.gray900};
    color: ${({ theme }) => theme.colors.white};
    font-weight: 700;
    border-radius: 12px;
    font-size: 1rem;
    transition: background 0.2s;
    &:hover {
      background-color: ${({ theme }) => theme.colors.black};
    }
  }

  .error-msg {
    color: ${({ theme }) => theme.colors.rose500};
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
