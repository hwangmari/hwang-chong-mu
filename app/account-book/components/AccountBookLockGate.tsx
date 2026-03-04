"use client";

import { ReactNode, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const ACCOUNT_BOOK_PASSWORD = "6155";
const ACCOUNT_BOOK_ACCESS_KEY = "hwang-account-book-access-granted";
const KEYPAD_VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type Props = {
  children: ReactNode;
};

function isAccountBookUnlocked() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ACCOUNT_BOOK_ACCESS_KEY) === "true";
}

function subscribeAccountBookAccess(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener("account-book-access-change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("account-book-access-change", handleChange);
  };
}

export default function AccountBookLockGate({ children }: Props) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isUnlocked = useSyncExternalStore(
    subscribeAccountBookAccess,
    isAccountBookUnlocked,
    () => false,
  );

  const submitPasscode = (nextValue: string) => {
    if (nextValue !== ACCOUNT_BOOK_PASSWORD) {
      setPasscode("");
      setErrorMessage("비밀번호가 맞지 않아요.");
      return;
    }

    window.sessionStorage.setItem(ACCOUNT_BOOK_ACCESS_KEY, "true");
    window.dispatchEvent(new Event("account-book-access-change"));
    setErrorMessage("");
    setPasscode(nextValue);
  };

  const handleDigitClick = (digit: string) => {
    if (passcode.length >= ACCOUNT_BOOK_PASSWORD.length) return;
    const nextValue = `${passcode}${digit}`;
    setPasscode(nextValue);
    setErrorMessage("");

    if (nextValue.length === ACCOUNT_BOOK_PASSWORD.length) {
      submitPasscode(nextValue);
    }
  };

  const handleClear = () => {
    setPasscode("");
    setErrorMessage("");
  };

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <StGatePage>
      <StGateCard>
        <StBackButton type="button" onClick={() => router.push("/")}>
          홈으로
        </StBackButton>
        <StEmoji>🔐</StEmoji>
        <StGateTitle>가계부 비밀번호</StGateTitle>
        <StGateDescription>
          숫자 4자리를 눌러서 가계부에 들어가세요.
        </StGateDescription>

        <StPasscodeDots aria-label="비밀번호 입력 상태">
          {Array.from({ length: ACCOUNT_BOOK_PASSWORD.length }, (_, index) => (
            <StPasscodeDot key={index} $filled={index < passcode.length} />
          ))}
        </StPasscodeDots>

        <StErrorMessage>{errorMessage || " "}</StErrorMessage>

        <StKeypad>
          {KEYPAD_VALUES.map((value) => (
            <StKeyButton
              key={value}
              type="button"
              onClick={() => handleDigitClick(value)}
            >
              {value}
            </StKeyButton>
          ))}
          <StSubButton type="button" onClick={handleClear}>
            전체삭제
          </StSubButton>
          <StKeyButton type="button" onClick={() => handleDigitClick("0")}>
            0
          </StKeyButton>
          <StSubButton type="button" onClick={handleDelete}>
            지우기
          </StSubButton>
        </StKeypad>
      </StGateCard>
    </StGatePage>
  );
}

const StGatePage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top, rgba(109, 135, 239, 0.16), transparent 32%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
`;

const StGateCard = styled.section`
  width: min(100%, 24rem);
  padding: 1.35rem;
  border-radius: 1.5rem;
  border: 1px solid #dbe4ef;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 60px rgba(41, 58, 92, 0.14);
`;

const StBackButton = styled.button`
  border: none;
  background: transparent;
  color: #5d6c82;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0;
`;

const StEmoji = styled.div`
  font-size: 2rem;
  margin-top: 0.4rem;
`;

const StGateTitle = styled.h1`
  margin-top: 0.65rem;
  font-size: 1.4rem;
  font-weight: 900;
  color: #1f2937;
`;

const StGateDescription = styled.p`
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const StPasscodeDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 1.25rem;
`;

const StPasscodeDot = styled.span<{ $filled: boolean }>`
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  border: 2px solid ${({ $filled }) => ($filled ? "#4f69d2" : "#c7d2e1")};
  background: ${({ $filled }) => ($filled ? "#4f69d2" : "transparent")};
  transition: all 0.16s ease;
`;

const StErrorMessage = styled.p`
  min-height: 1.35rem;
  margin-top: 0.85rem;
  text-align: center;
  color: #d04a73;
  font-size: 0.82rem;
  font-weight: 700;
`;

const StKeypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.45rem;
`;

const StKeyButton = styled.button`
  min-height: 4rem;
  border: 1px solid #d9e2ee;
  border-radius: 1.1rem;
  background: #fff;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(80, 102, 145, 0.08);

  &:active {
    transform: translateY(1px);
  }
`;

const StSubButton = styled.button`
  min-height: 4rem;
  border: 1px solid #d9e2ee;
  border-radius: 1.1rem;
  background: #f7f9fc;
  color: #5d6c82;
  font-size: 0.88rem;
  font-weight: 800;
`;
