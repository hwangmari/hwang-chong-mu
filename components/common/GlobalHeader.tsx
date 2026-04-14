/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { EXTRA_MENU, MENU_CATEGORIES } from "@/lib/menuCategories";

const ROUTE_CONFIG = [
  { path: "/", label: "황총무의 실험실", exact: true }, // 메인은 정확히 일치할 때만
  { path: "/schedule", label: "업무 캘린더" },
  { path: "/meeting", label: "약속 잡기" },
  { path: "/place", label: "장소잡기" },
  { path: "/calc", label: "N빵 계산기" },
  { path: "/overtime", label: "야근 계산기" },
  { path: "/account-book", label: "가계부" },
  { path: "/daily", label: "일일 기록" },
  { path: "/habit", label: "습관 관리" },
  { path: "/diet", label: "체중 관리" },
  { path: "/game", label: "황총무 게임방" },
  { path: "/portfolio", label: "포트폴리오" },
  { path: "/blog", label: "블로그" },

  { path: "/ui-kit", label: "UI Kit 모음집" },
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
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");
  const isAccountBookHub =
    pathname === "/account-book" && !searchParams.get("workspaceId");
  const isScheduleHub =
    pathname === "/schedule" && !searchParams.get("workspaceId");
  const shouldHideHeader =
    (pathname.startsWith("/account-book") && !isAccountBookHub) ||
    (pathname.startsWith("/schedule") && !isScheduleHub);

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

    if (pathname.startsWith("/blog/") && pathname !== "/blog") {
      setCurrentTitle("블로그");
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

  if (shouldHideHeader) {
    return null;
  }

  const handleBack = () => {
    // 경로 세그먼트 분리: /a/b/c → ["", "a", "b", "c"]
    const segments = pathname.split("/").filter(Boolean);

    // 1단계 경로 (/schedule, /meeting 등) → 홈으로
    if (segments.length <= 1) {
      router.push("/");
      return;
    }

    // 2단계 이상 → 상위 경로로 (/schedule/123 → /schedule)
    const parentPath = "/" + segments.slice(0, -1).join("/");
    router.push(parentPath);
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
            <Link href="/" passHref>
              <StHomeItem
                $isActive={pathname === "/"}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="icon">🐰</span>
                <span>황총무의 실험실</span>
              </StHomeItem>
            </Link>

            {MENU_CATEGORIES.map((category) => (
              <StCategoryBlock key={category.title}>
                <StCategoryLabel>
                  <span>{category.emoji}</span>
                  {category.title}
                </StCategoryLabel>
                {category.items.map((item) => (
                  <Link key={item.href} href={item.href} passHref>
                    <StMenuItem
                      $isActive={pathname.startsWith(item.href)}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="icon">{item.icon}</span>
                      <span>{item.title}</span>
                    </StMenuItem>
                  </Link>
                ))}
              </StCategoryBlock>
            ))}

            <StCategoryBlock>
              <StCategoryLabel>
                <span>✨</span>그 외
              </StCategoryLabel>
              {EXTRA_MENU.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <StMenuItem
                    $isActive={pathname.startsWith(item.href)}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="icon">{item.icon}</span>
                    <span>{item.title}</span>
                  </StMenuItem>
                </Link>
              ))}
            </StCategoryBlock>
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
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  overflow-y: auto;
  max-height: calc(100dvh - 3.5rem);
  padding: 0.75rem 0 1.25rem;

  .center-box {
    max-width: ${({ theme }) => theme.layout.narrowWidth};
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
`;

const StHomeItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem;
  margin: 0 0.75rem;
  border-radius: 0.85rem;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;

  .icon {
    font-size: 1.1rem;
  }

  ${({ $isActive, theme }) =>
    $isActive
      ? css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue600};
        `
      : css`
          color: ${theme.colors.gray900};
          &:hover {
            background-color: ${theme.colors.gray100};
          }
        `}
`;

const StCategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.25rem 0.25rem;
  margin-top: 0.25rem;
`;

const StCategoryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 1.25rem 0.35rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.gray500};
  text-transform: none;

  span {
    font-size: 0.88rem;
  }
`;

const StMenuItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1.25rem;
  margin: 0 0.75rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;

  .icon {
    font-size: 1.05rem;
    width: 1.4rem;
    display: inline-flex;
    justify-content: center;
    flex-shrink: 0;
  }

  ${({ $isActive, theme }) =>
    $isActive
      ? css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue600};
        `
      : css`
          color: ${theme.colors.gray800};
          &:hover {
            background-color: ${theme.colors.gray100};
            color: ${theme.colors.gray900};
          }
        `}
`;
const StBackdrop = styled.div`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
`;
