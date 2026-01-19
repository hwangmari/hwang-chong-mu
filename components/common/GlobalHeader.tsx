/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

/** 기본 경로별 타이틀 */
const TITLE_MAP: Record<string, string> = {
  "/": "황총무의 실험실",
  "/meeting": "약속 잡기",
  "/habit": "습관 관리",
  "/diet": "체중 관리",
  "/calc": "N빵 계산기",
  "/game": "황총무 게임방",
  "/portfolio": "포트폴리오",
};

/** 게임 ID 매핑 */
const GAME_NAMES: Record<string, string> = {
  ladder: "사다리 타기",
  wheel: "돌림판",
  clicker: "광클 대전",
  telepathy: "텔레파시",
};

/** 경력(회사) ID별 회사명 매핑 */
const EXPERIENCE_NAMES: Record<string, string> = {
  hanwha: "한화생명",
  "kakao-ent": "카카오 엔터프라이즈",
  musinsa: "29CM(무신사)",
  douzone: "더존 비즈온",
  hivelab: "하이브랩",
};

const NAV_ITEMS = [
  { label: "홈으로", href: "/" },
  { label: "약속 잡기", href: "/meeting" },
  { label: "습관 관리", href: "/habit" },
  { label: "체중 관리", href: "/diet" },
  { label: "N빵 계산기", href: "/calc" },
  { label: "황총무 게임방", href: "/game" },
  { label: "포트폴리오", href: "/portfolio" },
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);

    /** 1. 정확히 일치하는 경로 (예: /portfolio 메인) */
    if (TITLE_MAP[pathname]) {
      setCurrentTitle(TITLE_MAP[pathname]);
      return;
    }

    /** 2. 게임 하위 경로 처리 */
    if (pathname.startsWith("/game")) {
      const parts = pathname.split("/");
      if (parts[2] === "quick" && parts[3]) {
        const gameName = GAME_NAMES[parts[3]];
        setCurrentTitle(gameName ? `${gameName}` : "빠른 게임");
      } else if (parts.length > 2) {
        const isRoomId = !isNaN(Number(parts[2]));
        setCurrentTitle(isRoomId ? "게임 대기실" : "황총무 게임방");
      } else {
        setCurrentTitle("황총무 게임방");
      }
    } // 4. 포트폴리오 관련 경로 (경력 기술서 & 캠페인)
    else if (pathname.startsWith("/portfolio")) {
      // 4-1. 경력 기술서 상세 (/portfolio/experience/...)
      if (pathname.startsWith("/portfolio/experience")) {
        const parts = pathname.split("/");
        if (parts.length > 3) {
          const id = parts[3];
          // EXPERIENCE_NAMES는 상단에 정의되어 있다고 가정
          const companyName = EXPERIENCE_NAMES[id] || decodeURIComponent(id);
          setCurrentTitle(companyName);
        } else {
          setCurrentTitle("경력 기술서");
        }
      }
      // ✅ 4-2. [추가] 캠페인 (/portfolio/campaigns)
      else if (pathname.startsWith("/portfolio/campaigns")) {
        setCurrentTitle("캠페인");
      }
      // 4-3. 그 외 포트폴리오 메인
      else {
        setCurrentTitle("포트폴리오");
      }
    } else if (pathname.startsWith("/calc")) setCurrentTitle("N빵 계산기");
    /** 4. 나머지 경로 처리 */ else if (pathname.startsWith("/meeting"))
      setCurrentTitle("약속 잡기");
    else if (pathname.startsWith("/habit")) setCurrentTitle("습관 관리");
    else if (pathname.startsWith("/diet")) setCurrentTitle("체중 관리");
    else setCurrentTitle("황총무의 실험실");
  }, [pathname]);

  const showBack = pathname !== "/";

  const handleBack = () => {
    if (pathname.startsWith("/game/") && pathname.split("/").length > 2) {
      if (pathname.includes("/quick")) {
        router.back();
        return;
      }
    }
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <StHeaderWrapper>
        <div className="center-box">
          <StLeftArea>
            {showBack && (
              <StIconButton onClick={handleBack} aria-label="뒤로 가기">
                <ArrowBackIosNewIcon style={{ fontSize: "1.2rem" }} />
              </StIconButton>
            )}
          </StLeftArea>
          <StCenterArea>
            <StTitle>{currentTitle}</StTitle>
          </StCenterArea>
          <StRightArea>
            <StIconButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </StIconButton>
          </StRightArea>
        </div>
      </StHeaderWrapper>

      <StMenuOverlay $isOpen={isMenuOpen}>
        <StMenuContainer>
          <div className="center-box">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <StMenuItem
                  $isActive={pathname === item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </StMenuItem>
              </Link>
            ))}
          </div>
        </StMenuContainer>
        <StBackdrop onClick={() => setIsMenuOpen(false)} />
      </StMenuOverlay>
    </>
  );
}

// ... 스타일 컴포넌트 기존 유지 ...
const StHeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;

  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  z-index: 50;
  margin: 0 auto;
  .center-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: ${({ theme }) => theme.layout.maxWidth};
    height: 3.5rem;
    margin: 0 auto;
    padding: 0 0.5rem;
  }
`;
// (나머지 스타일 생략 - 기존과 동일)
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
  transition: opacity 0.2s, visibility 0.2s;
  display: flex;
  flex-direction: column;
`;
const StMenuContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.white};
  .center-box {
    max-width: ${({ theme }) => theme.layout.narrowWidth};
    margin: 0 auto;
  }
`;
const StMenuItem = styled.div<{ $isActive: boolean }>`
  padding: 1rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
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
