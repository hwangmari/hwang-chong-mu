"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
// 아이콘 (아이콘이 없다면 텍스트로 대체 가능)
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

// ✅ 경로별 타이틀 매핑
const TITLE_MAP: Record<string, string> = {
  "/": "황총무의 실험실",
  "/calc": "N빵 계산기",
  "/meeting": "약속 잡기",
  "/habit": "습관 관리",
  "/portfolio": "포트폴리오",
};

// ✅ 메뉴 목록
const NAV_ITEMS = [
  { label: "홈으로", href: "/" },
  { label: "N빵 계산기", href: "/calc" },
  { label: "약속 잡기", href: "/meeting" },
  { label: "습관 관리", href: "/habit" },
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");

  // ✅ 경로가 바뀔 때마다 타이틀 자동 설정
  useEffect(() => {
    // 1. 정확히 일치하는 경로 찾기
    if (TITLE_MAP[pathname]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTitle(TITLE_MAP[pathname]);
      return;
    }

    // 2. 하위 경로 처리 (예: /calc/123 -> N빵 계산기)
    if (pathname.startsWith("/calc")) setCurrentTitle(TITLE_MAP["/calc"]);
    else if (pathname.startsWith("/meeting"))
      setCurrentTitle(TITLE_MAP["/meeting"]);
    else if (pathname.startsWith("/habit"))
      setCurrentTitle(TITLE_MAP["/habit"]);
    else setCurrentTitle("황총무의 실험실");
  }, [pathname]);

  // 홈('/')이 아니면 뒤로가기 버튼 노출
  const showBack = pathname !== "/";

  return (
    <>
      <StHeaderWrapper>
        {/* [좌측] 뒤로가기 버튼 */}
        <StLeftArea>
          {showBack && (
            <StIconButton onClick={() => router.back()} aria-label="뒤로 가기">
              <ArrowBackIosNewIcon style={{ fontSize: "1.2rem" }} />
            </StIconButton>
          )}
        </StLeftArea>

        {/* [중앙] 자동 설정된 타이틀 */}
        <StCenterArea>
          <StTitle>{currentTitle}</StTitle>
        </StCenterArea>

        {/* [우측] 햄버거 메뉴 버튼 */}
        <StRightArea>
          <StIconButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴 열기"
          >
            {isMenuOpen ? (
              <CloseIcon style={{ fontSize: "1.5rem" }} />
            ) : (
              <MenuIcon style={{ fontSize: "1.5rem" }} />
            )}
          </StIconButton>
        </StRightArea>
      </StHeaderWrapper>

      {/* [메뉴 드로어] */}
      <StMenuOverlay $isOpen={isMenuOpen}>
        <StMenuContainer>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <StMenuItem
                $isActive={pathname === item.href} // 현재 메뉴 강조
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </StMenuItem>
            </Link>
          ))}
        </StMenuContainer>
        <StBackdrop onClick={() => setIsMenuOpen(false)} />
      </StMenuOverlay>
    </>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const StHeaderWrapper = styled.header`
  position: sticky; /* 상단 고정 */
  top: 0;
  left: 0;
  right: 0;
  height: 3.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
  background-color: ${({ theme }) => theme.colors.white}; /* 배경색 추가 */
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100}; /* 하단 구분선 */
  z-index: 50;
  margin: 0 auto; /* 중앙 정렬 */
`;

const StLeftArea = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-start;
`;

const StCenterArea = styled.div`
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StRightArea = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

const StTitle = styled.h1`
  font-size: 1.125rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
`;

const StIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.gray600};
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray50};
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StMenuOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 3.5rem;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  visibility: ${({ $isOpen }) => ($isOpen ? "visible" : "hidden")};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transition: opacity 0.2s ease-in-out, visibility 0.2s;
  display: flex;
  flex-direction: column;
  max-width: 540px; /* 레이아웃 너비 제한 */
  margin: 0 auto;
`;

const StMenuContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StMenuItem = styled.div<{ $isActive: boolean }>`
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $isActive, theme }) =>
    $isActive
      ? css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue600};
        `
      : css`
          color: ${theme.colors.gray700};
          &:hover {
            background-color: ${theme.colors.gray50};
            color: ${theme.colors.gray900};
          }
        `}
`;

const StBackdrop = styled.div`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
`;
