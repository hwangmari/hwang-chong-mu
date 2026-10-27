"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import HomeDashboard from "@/components/home/HomeDashboard";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { useMarkChromeHidden } from "@/components/common/useChromeHidden";
import OfficeView, { type OfficeMode } from "@/app/office/OfficeView";

// 보기 모드: 요약(카드) 또는 황총무 오피스(픽셀·동숲). 오피스를 고르면 헤더까지 빠진 전체 화면으로 바뀌고,
// 오피스에서 연 도구의 뒤로 가기(?from=my)가 다시 이 화면 → 기억해 둔 오피스로 돌아온다.
type MyView = "summary" | OfficeMode;
const VIEW_KEY = "my.view";
const VIEWS: { id: MyView; label: string }[] = [
  { id: "summary", label: "📋 요약" },
  { id: "pixel", label: "👾 픽셀 오피스" },
  { id: "animal", label: "🍃 동숲 오피스" },
];

// 내 서비스 요약 전용 페이지 — 홈에서 분리해 PC에서는 넓은 레이아웃으로 관리한다.
export default function MyDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<MyView>("summary");
  const inOffice = view !== "summary";
  useMarkChromeHidden(inOffice);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      // 저장해 둔 보기 모드는 브라우저에만 있어서 화면이 뜬 뒤 한 번 읽는다
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "pixel" || saved === "animal") setView(saved);
    } catch {}
  }, []);
  const chooseView = (v: MyView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  if (inOffice) {
    return (
      <OfficeView
        full
        onFullChange={(f) => !f && chooseView("summary")}
        mode={view}
        onModeChange={chooseView}
        hrefSuffix="?from=my"
      />
    );
  }

  return (
    <StMain>
      <StHeadRow>
        <StIntro>
          <StPageTitle>✨ 내 서비스 요약</StPageTitle>
          {/* 로그인 전에는 바로 아래 미리보기가 같은 말을 더 크게 하므로 설명을 숨긴다 */}
          {user && (
            <StPageDesc>
              서비스를 하나의 계정으로 연동하면, 오늘·이번 주 현황을 한곳에서
              모아 관리할 수 있어요.
            </StPageDesc>
          )}
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
      <StViewRow role="radiogroup" aria-label="보기 모드">
        {VIEWS.map((v) => (
          <StViewOption
            key={v.id}
            type="button"
            role="radio"
            aria-checked={view === v.id}
            $on={view === v.id}
            onClick={() => chooseView(v.id)}
          >
            {v.label}
          </StViewOption>
        ))}
        <StViewHint>오피스를 고르면 화면 전체가 사무실로 바뀌어요</StViewHint>
      </StViewRow>
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

/* 보기 모드 고르기 — 셋 중 하나라 세그먼트 */
const StViewRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: -0.5rem;
`;

const StViewOption = styled.button<{ $on: boolean }>`
  padding: 0.45rem 0.9rem;
  border: 1px solid
    ${({ $on, theme }) => ($on ? theme.semantic.primary : theme.semantic.border)};
  border-radius: 999px;
  background: ${({ $on, theme }) => ($on ? theme.semantic.primaryLight : theme.colors.white)};
  color: ${({ $on, theme }) => ($on ? theme.semantic.primary : theme.semantic.text)};
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
`;

const StViewHint = styled.span`
  margin-left: 0.25rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.semantic.subText};
`;
