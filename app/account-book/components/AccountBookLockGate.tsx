"use client";

import { FormEvent, ReactNode, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

type Props = {
  children: ReactNode;
  password?: string;
  accessKey?: string;
  storageType?: "local" | "session";
  rememberDays?: number;
  title?: string;
  description?: string;
  backToHome?: boolean;
  onBack?: () => void;
  overlay?: boolean;
};

const ACCESS_FLAG = "true";

function getLocalUnlockExpiry(rememberDays: number) {
  return Date.now() + rememberDays * 24 * 60 * 60 * 1000;
}

function readStoredAccess(
  accessKey: string,
  storageType: "local" | "session",
) {
  if (typeof window === "undefined") return false;

  if (storageType === "session") {
    return window.sessionStorage.getItem(accessKey) === ACCESS_FLAG;
  }

  const raw = window.localStorage.getItem(accessKey);
  if (!raw) {
    return window.sessionStorage.getItem(accessKey) === ACCESS_FLAG;
  }

  if (raw === ACCESS_FLAG) {
    return true;
  }

  try {
    const parsed = JSON.parse(raw) as { unlocked?: boolean; expiresAt?: number };
    if (parsed.unlocked && typeof parsed.expiresAt === "number") {
      if (parsed.expiresAt > Date.now()) {
        return true;
      }
      window.localStorage.removeItem(accessKey);
    }
  } catch {
    window.localStorage.removeItem(accessKey);
  }

  return false;
}

function persistStoredAccess(
  accessKey: string,
  storageType: "local" | "session",
  rememberDays: number,
) {
  if (typeof window === "undefined") return;

  if (storageType === "session") {
    window.sessionStorage.setItem(accessKey, ACCESS_FLAG);
    return;
  }

  window.localStorage.setItem(
    accessKey,
    JSON.stringify({
      unlocked: true,
      expiresAt: getLocalUnlockExpiry(rememberDays),
    }),
  );
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

export default function AccountBookLockGate({
  children,
  password = "6155",
  accessKey = "hwang-account-book-access-granted",
  storageType = "local",
  rememberDays = 30,
  title = "가계부 비밀번호",
  description = "숫자 4자리를 눌러서 가계부에 들어가세요.",
  backToHome = true,
  onBack,
  overlay = false,
}: Props) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isUnlocked = useSyncExternalStore(
    subscribeAccountBookAccess,
    () => readStoredAccess(accessKey, storageType),
    () => false,
  );

  const submitPasscode = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const nextValue = passcode.trim();

    if (!nextValue || nextValue !== password) {
      setPasscode("");
      setErrorMessage("비밀번호가 맞지 않아요.");
      return;
    }

    persistStoredAccess(accessKey, storageType, rememberDays);
    window.dispatchEvent(new Event("account-book-access-change"));
    setErrorMessage("");
    setPasscode(nextValue);
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <StGatePage $overlay={overlay}>
      <StGateCard>
        <StBackButton
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
              return;
            }
            if (backToHome) {
              router.push("/");
            }
          }}
        >
          {backToHome ? "홈으로" : "뒤로"}
        </StBackButton>
        <StEmoji>🔐</StEmoji>
        <StGateTitle>{title}</StGateTitle>
        <StGateDescription>{description}</StGateDescription>
        <StErrorMessage>{errorMessage || " "}</StErrorMessage>
        <StForm onSubmit={submitPasscode}>
          <StPasswordInput
            type="password"
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value);
              setErrorMessage("");
            }}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            autoFocus
          />
          <StSubmitButton type="submit">들어가기</StSubmitButton>
        </StForm>
      </StGateCard>
    </StGatePage>
  );
}

const StGatePage = styled.main<{ $overlay: boolean }>`
  min-height: ${({ $overlay }) => ($overlay ? "0" : "100vh")};
  position: ${({ $overlay }) => ($overlay ? "fixed" : "relative")};
  inset: ${({ $overlay }) => ($overlay ? "0" : "auto")};
  z-index: ${({ $overlay }) => ($overlay ? "80" : "auto")};
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: ${({ $overlay }) =>
    $overlay
      ? "rgba(15, 23, 42, 0.34)"
      : "radial-gradient(circle at top, rgba(109, 135, 239, 0.16), transparent 32%), linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%)"};
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
  color: ${({ theme }) => theme.colors.gray800};
`;

const StGateDescription = styled.p`
  margin-top: 0.35rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.92rem;
  line-height: 1.5;
`;

const StErrorMessage = styled.p`
  min-height: 1.35rem;
  margin-top: 1rem;
  color: #d04a73;
  font-size: 0.82rem;
  font-weight: 700;
`;

const StForm = styled.form`
  display: grid;
  gap: 0.75rem;
`;

const StPasswordInput = styled.input`
  min-height: 3.4rem;
  border: 1px solid #d9e2ee;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray800};
  font-size: 1rem;
  font-weight: 700;
  padding: 0 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);

  &:focus {
    outline: none;
    border-color: #9db6ff;
    box-shadow: 0 0 0 4px rgba(79, 124, 255, 0.12);
  }

  &::placeholder {
    color: #9aa7ba;
  }
`;

const StSubmitButton = styled.button`
  min-height: 3.4rem;
  border: none;
  border-radius: 1rem;
  background: linear-gradient(135deg, #607de0, #4b69c8);
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.95rem;
  font-weight: 800;
`;
