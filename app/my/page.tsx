"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import HomeDashboard from "@/components/home/HomeDashboard";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBlock } from "@/components/common/Skeleton";

// 내 서비스 요약 전용 페이지 — 홈에서 분리해 PC에서는 넓은 레이아웃으로 관리한다.
export default function MyDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <StMain>
      <StHeadRow>
        <StIntro>
          <StPageTitle>✨ 내 서비스 요약</StPageTitle>
          <StPageDesc>
            서비스를 하나의 계정으로 연동하면, 오늘·이번 주 현황을 한곳에서
            모아 관리할 수 있어요.
          </StPageDesc>
        </StIntro>
        {!loading ? (
          user ? (
            <StAuthBox>
              <StNickname>👤 {user.nickname}</StNickname>
              <StAuthButton type="button" onClick={() => void logout()}>
                로그아웃
              </StAuthButton>
            </StAuthBox>
          ) : (
            <StAuthButton
              type="button"
              $primary
              onClick={() => router.push("/login")}
            >
              로그인 / 회원가입
            </StAuthButton>
          )
        ) : (
          // 로그인 여부를 확인하는 동안에도 버튼 자리를 남겨 둔다
          <SkeletonBlock width="8.5rem" height="2.1rem" radius="999px" />
        )}
      </StHeadRow>
      <HomeDashboard wide />
    </StMain>
  );
}

const StMain = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StHeadRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0 0.25rem;
`;

const StAuthBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};
`;

const StNickname = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StAuthButton = styled.button<{ $primary?: boolean }>`
  flex-shrink: 0;
  border: 1px solid
    ${({ $primary, theme }) =>
      $primary ? theme.semantic.primary : theme.colors.gray200};
  background: ${({ $primary, theme }) =>
    $primary ? theme.semantic.primary : theme.colors.white};
  color: ${({ $primary, theme }) =>
    $primary ? theme.colors.white : theme.colors.gray600};
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

const StPageTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.text};
`;

const StPageDesc = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.semantic.subText};
`;
