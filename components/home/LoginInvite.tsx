"use client";

import Link from "next/link";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";

// 메인의 계정 안내: 로그인 없이도 쓰지만, 로그인하면 여러 서비스를 한 계정으로 이어서 쓸 수 있다는 안내.
// 로그인 전: 로그인/회원가입으로, 로그인 후: 내 서비스 요약으로.
export default function LoginInvite() {
  const { user, loading } = useAuth();
  if (loading) return <StBox aria-busy="true" />; // 높이만 잡아 두어 화면이 튀지 않게

  return (
    <StBox>
      <StText>
        {user ? (
          <>
            <strong>{user.nickname}님, 다시 오셨네요 👋</strong>
            <span>연결해 둔 서비스와 최근 기록을 내 서비스 요약에서 한 번에 볼 수 있어요.</span>
          </>
        ) : (
          <>
            <strong>황총무가 마음에 드신다면, 로그인해서 이어 써 보세요</strong>
            <span>
              모든 도구는 로그인 없이 바로 쓸 수 있어요. 로그인하면 약속 잡기·N빵·가계부·운동 기록 같은 서비스를 한 계정에
              연결해 두고, 폰과 PC 어디서든 이어서 볼 수 있어요.
            </span>
          </>
        )}
      </StText>
      <StActions>
        {user ? (
          <StPrimary href="/my">✨ 내 서비스 요약 보기</StPrimary>
        ) : (
          <>
            <StPrimary href="/login">로그인 / 회원가입</StPrimary>
            <StGhost href="/my">어떻게 연결되나요?</StGhost>
          </>
        )}
      </StActions>
    </StBox>
  );
}

const StBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 6.5rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.blue100};

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.1rem 1.15rem;
  }
`;

const StText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  strong {
    font-size: 1.05rem;
    color: ${({ theme }) => theme.semantic.text};
    word-break: keep-all;
  }
  span {
    font-size: 0.86rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.semantic.subText};
    word-break: keep-all;
  }
`;

const StActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex: none;
  flex-wrap: wrap;
  @media ${({ theme }) => theme.media.mobile} {
    > a {
      flex: 1;
      text-align: center;
    }
  }
`;

const StPrimary = styled(Link)`
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.92rem;
  text-decoration: none;
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StGhost = styled(Link)`
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 700;
  font-size: 0.92rem;
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.blue100};
`;
