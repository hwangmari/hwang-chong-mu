/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useChromeHidden } from "./useChromeHidden";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { EXTRA_MENU, MENU_CATEGORIES } from "@/lib/menuCategories";
import { useAuth } from "@/hooks/useAuth";

const ROUTE_CONFIG = [
  { path: "/", label: "황총무의 실험실", exact: true }, // 메인은 정확히 일치할 때만
  { path: "/my", label: "내 서비스 요약" },
  { path: "/schedule", label: "업무 캘린더" },
  { path: "/meeting", label: "약속 잡기" },
  { path: "/place", label: "장소잡기" },
  { path: "/calc", label: "여행 경비 계산기" },
  { path: "/overtime", label: "야근 계산기" },
  { path: "/account-book", label: "가계부" },
  { path: "/daily", label: "일일 기록" },
  { path: "/habit", label: "습관 관리" },
  { path: "/diet", label: "체중 관리" },
  { path: "/inbody", label: "인바디 기록" },
  { path: "/gift-log", label: "경조사비 장부" },
  { path: "/game", label: "황총무 게임방" },
  { path: "/tennis", label: "테니스 교류전" },
  { path: "/portfolio", label: "포트폴리오" },
  { path: "/blog", label: "블로그" },
  { path: "/login", label: "로그인" },
  { path: "/account", label: "내 계정" },

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");
  const { user, logout } = useAuth();
  // 숨김 판단은 useChromeHidden 한 곳에서 (GlobalFooter와 동일 기준). 주소의 물음표 값은 렌더 중에 읽지 않는다.
  const shouldHideHeader = useChromeHidden();

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
    // /my(내 서비스 요약)에서 넘어온 페이지는 백키로 다시 /my로 돌아간다
    // 클릭 순간에만 주소를 읽는다 (렌더와 무관하므로 Suspense가 필요 없다)
    if (new URLSearchParams(window.location.search).get("from") === "my") {
      router.push("/my");
      return;
    }

    // 경로 세그먼트 분리: /a/b/c → ["", "a", "b", "c"]
    const segments = pathname.split("/").filter(Boolean);

    // 1단계 경로 (/schedule, /meeting 등) → 홈으로
    if (segments.length <= 1) {
      router.push("/");
      return;
    }

    // /portfolio/experience/:id → /portfolio (experience 목록 페이지가 없음)
    if (segments[0] === "portfolio" && segments[1] === "experience") {
      router.push("/portfolio");
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
            <StMenuTop>
            <Link href="/" passHref>
              <StHomeItem
                $isActive={pathname === "/"}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="icon">🐰</span>
                <span>황총무의 실험실</span>
              </StHomeItem>
            </Link>

            <Link href="/my" passHref>
              <StHomeItem
                $isActive={pathname.startsWith("/my")}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="icon">✨</span>
                <span>내 서비스 요약</span>
              </StHomeItem>
            </Link>

            <StAccountBox>
              {user ? (
                <>
                  <StAccountInfo
                    type="button"
                    onClick={() => {
                      router.push("/account");
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="icon">👤</span>
                    <span>{user.nickname}</span>
                  </StAccountInfo>
                  <StAccountAction
                    type="button"
                    onClick={() => {
                      void logout();
                      setIsMenuOpen(false);
                    }}
                  >
                    로그아웃
                  </StAccountAction>
                </>
              ) : (
                <StAccountAction
                  type="button"
                  $primary
                  onClick={() => {
                    router.push("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  로그인 / 회원가입
                </StAccountAction>
              )}
            </StAccountBox>
            </StMenuTop>

            <StMenuGrid>
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
                      <span className="text">
                        {item.title}
                        <small>{item.desc}</small>
                      </span>
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
                    <span className="text">
                      {item.title}
                      <small>{item.desc}</small>
                    </span>
                  </StMenuItem>
                </Link>
              ))}
            </StCategoryBlock>
            </StMenuGrid>
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

  /* PC에서는 좁은 세로 목록 대신 넓게 펼쳐 한눈에 보이게 */
  @media ${({ theme }) => theme.media.desktop} {
    padding: 1rem 0 1.5rem;
    .center-box {
      max-width: ${({ theme }) => theme.layout.maxWidth};
      padding: 0 1rem;
      gap: 0.75rem;
    }
  }
`;

/* 홈·내 서비스 요약·계정 묶음: 폰은 세로, PC는 가로 한 줄 */
const StMenuTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
    > a {
      flex: none;
    }
    > div:last-child {
      margin-left: auto;
      margin-top: 0;
      margin-bottom: 0;
    }
  }
`;

/* 분류 묶음: 폰은 세로, PC는 4열(친구들과 함께 · 일과 시간 · 매일의 기록 · 그 외) */
const StMenuGrid = styled.div`
  display: flex;
  flex-direction: column;

  @media ${({ theme }) => theme.media.desktop} {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1.1fr 0.9fr;
    gap: 0.5rem;
    align-items: start;
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

const StAccountBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin: 0.6rem 1rem 0.25rem;
  padding: 0.7rem 0.9rem;
  border-radius: 14px;
  border: 1px solid #e4e5e6;
  background: #fbfbfc;
`;

const StAccountInfo = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  .icon {
    font-size: 1rem;
  }

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StAccountAction = styled.button<{ $primary?: boolean }>`
  flex-shrink: 0;
  border: 1px solid ${({ $primary }) => ($primary ? "#3182f6" : "#e2e3e5")};
  background: ${({ $primary }) => ($primary ? "#3182f6" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#6a6f78")};
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
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
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  /* 짧은 설명은 PC에서만 (폰은 목록이 길어져 숨김) */
  .text small {
    display: none;
    font-size: 0.74rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray500};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media ${({ theme }) => theme.media.desktop} {
    padding: 0.55rem 0.9rem;
    margin: 0 0.25rem;
    .text small {
      display: block;
    }
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
