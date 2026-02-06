/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const ROUTE_CONFIG = [
  { path: "/", label: "황총무의 실험실", exact: true }, // 메인은 정확히 일치할 때만
  { path: "/schedule", label: "업무 캘린더" },
  { path: "/meeting", label: "약속 잡기" },
  { path: "/calc", label: "N빵 계산기" },
  { path: "/habit", label: "습관 관리" },
  { path: "/diet", label: "체중 관리" },
  { path: "/game", label: "황총무 게임방" },
  { path: "/portfolio", label: "포트폴리오" },
];

const GAME_NAMES: Record<string, string> = {
  ladder: "사다리 타기",
  wheel: "돌림판",
  clicker: "광클 대전",
  telepathy: "텔레파시",
};

const EXPERIENCE_NAMES: Record<string, string> = {
  hanwha: "한화생명",
  "kakao-ent": "카카오 엔터프라이즈",
  musinsa: "29CM(무신사)",
  douzone: "더존 비즈온",
  hivelab: "하이브랩",
};

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);

    if (pathname.startsWith("/game/")) {
      const parts = pathname.split("/");
      if (parts[2] === "quick" && parts[3]) {
        const gameName = GAME_NAMES[parts[3]];
        setCurrentTitle(gameName || "빠른 게임");
        return;
      }
      const isRoomId = !isNaN(Number(parts[2]));
      setCurrentTitle(isRoomId ? "게임 대기실" : "황총무 게임방");
      return;
    }

    if (pathname.startsWith("/portfolio/")) {
      if (pathname.startsWith("/portfolio/experience")) {
        const parts = pathname.split("/");
        if (parts.length > 3) {
          const id = parts[3];
          const companyName = EXPERIENCE_NAMES[id] || decodeURIComponent(id);
          setCurrentTitle(companyName);
          return;
        }
        setCurrentTitle("경력 기술서");
        return;
      }
      if (pathname.startsWith("/portfolio/campaigns")) {
        setCurrentTitle("캠페인");
        return;
      }
    }

    const matchedRoute = ROUTE_CONFIG.find((route) =>
      route.exact ? pathname === route.path : pathname.startsWith(route.path),
    );

    if (matchedRoute) {
      setCurrentTitle(matchedRoute.label);
    } else {
      setCurrentTitle("황총무의 실험실"); // 기본값
    }
  }, [pathname]);

  const showBack = pathname !== "/";

  const handleBack = () => {
    if (pathname.startsWith("/game/") && pathname.split("/").length > 2) {
      if (pathname.includes("/quick")) {
        router.back();
        return;
      }
    }

    if (pathname === "/schedule") {
      router.push("/");
      return;
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
            {/* ✨ ROUTE_CONFIG를 기반으로 메뉴 자동 생성 */}
            {ROUTE_CONFIG.map((item) => (
              <Link key={item.path} href={item.path} passHref>
                <StMenuItem
                  $isActive={
                    item.exact
                      ? pathname === item.path
                      : pathname.startsWith(item.path)
                  }
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
  border: none;
  background: none;
  cursor: pointer;
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
  transition:
    opacity 0.2s,
    visibility 0.2s;
  display: flex;
  flex-direction: column;
`;
const StMenuContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  .center-box {
    max-width: ${({ theme }) => theme.layout.maxWidth};
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }
`;
const StMenuItem = styled.div<{ $isActive: boolean }>`
  padding: 1rem 1.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray50};

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

  &:last-child {
    border-bottom: none;
  }
`;
const StBackdrop = styled.div`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
`;
