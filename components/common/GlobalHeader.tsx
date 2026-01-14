"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

// ✅ 1. 기본 경로별 타이틀
const TITLE_MAP: Record<string, string> = {
  "/": "황총무의 실험실",
  "/meeting": "약속 잡기",
  "/habit": "습관 관리",
  "/diet": "체중 관리",
  "/calc": "N빵 계산기",
  "/game": "황총무 게임방",
  "/portfolio": "포트폴리오",
};

// ✅ 2. 게임 ID별 한글 타이틀 매핑 (URL의 영어 ID -> 한글 변환용)
const GAME_NAMES: Record<string, string> = {
  ladder: "사다리 타기",
  wheel: "돌림판",
  clicker: "광클 대전",
  telepathy: "텔레파시",
};

const NAV_ITEMS = [
  { label: "홈으로", href: "/" },
  { label: "약속 잡기", href: "/meeting" },
  { label: "습관 관리", href: "/habit" },
  { label: "체중 관리", href: "/diet" },
  { label: "N빵 계산기", href: "/calc" },
  { label: "황총무 게임방", href: "/game" },
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");

  // ✅ 경로가 바뀔 때마다 타이틀 분석 및 설정
  useEffect(() => {
    // 1. 메뉴 닫기 및 스크롤 초기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
    window.scrollTo(0, 0);

    // 2. 정확히 일치하는 경로가 있으면 바로 적용 (예: /game, /calc)
    if (TITLE_MAP[pathname]) {
      setCurrentTitle(TITLE_MAP[pathname]);
      return;
    }

    // 3. ✨ [수정] 게임 하위 경로 처리 로직 강화
    if (pathname.startsWith("/game")) {
      const parts = pathname.split("/"); // ["", "game", "quick", "ladder"] 형태

      // 3-1. 빠른 시작 (예: /game/quick/ladder)
      if (parts[2] === "quick" && parts[3]) {
        const gameName = GAME_NAMES[parts[3]]; // 영어 ID를 한글로 변환
        setCurrentTitle(gameName ? `${gameName}` : "빠른 게임");
      }
      // 3-2. 온라인 방 (예: /game/12345)
      else if (parts.length > 2) {
        // 숫자 ID면 대기실, 아니면 그냥 게임방
        const isRoomId = !isNaN(Number(parts[2]));
        setCurrentTitle(isRoomId ? "게임 대기실" : "황총무 게임방");
      } else {
        setCurrentTitle("황총무 게임방");
      }
    }
    // 4. 기타 서브 경로 처리
    else if (pathname.startsWith("/calc")) {
      setCurrentTitle("N빵 계산기");
    } else if (pathname.startsWith("/meeting")) {
      setCurrentTitle("약속 잡기");
    } else if (pathname.startsWith("/habit")) {
      setCurrentTitle("습관 관리");
    } else if (pathname.startsWith("/diet")) {
      setCurrentTitle("체중 관리");
    } else {
      setCurrentTitle("황총무의 실험실");
    }
  }, [pathname]);

  // 홈('/')이 아니면 뒤로가기 버튼 노출
  const showBack = pathname !== "/";

  // 스마트 뒤로가기 핸들러
  const handleBack = () => {
    // ✨ 게임방 내부 깊은 곳(게임 중)에 있다면
    if (pathname.startsWith("/game/") && pathname.split("/").length > 2) {
      // 빠른 시작 내부라면 게임 선택 화면(/game)으로 보내는 게 깔끔할 수도 있음
      if (pathname.includes("/quick")) {
        // 만약 '목록으로' 가고 싶다면 router.replace('/game?mode=quick') 등을 쓸 수 있지만
        // 지금은 router.back()이 가장 자연스럽습니다.
        router.back();
        return;
      }
    }

    // 기본 뒤로가기 로직
    const referrer = document.referrer;
    const currentHost = window.location.host;
    if (referrer && referrer.includes(currentHost)) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <StHeaderWrapper>
        {/* [좌측] 뒤로가기 버튼 */}
        <StLeftArea>
          {showBack && (
            <StIconButton onClick={handleBack} aria-label="뒤로 가기">
              <ArrowBackIosNewIcon style={{ fontSize: "1.2rem" }} />
            </StIconButton>
          )}
        </StLeftArea>

        {/* [중앙] 타이틀 */}
        <StCenterArea>
          <StTitle>{currentTitle}</StTitle>
        </StCenterArea>

        {/* [우측] 메뉴 버튼 */}
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

      {/* 메뉴 드로어 (기존 동일) */}
      <StMenuOverlay $isOpen={isMenuOpen}>
        <StMenuContainer>
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
        </StMenuContainer>
        <StBackdrop onClick={() => setIsMenuOpen(false)} />
      </StMenuOverlay>
    </>
  );
}

// ... 스타일 컴포넌트 (기존 코드와 동일하게 유지) ...
const StHeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem;
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  z-index: 50;
  margin: 0 auto;
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
  margin: 0 auto;
`;

const StMenuContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-direction: column;
`;

const StMenuItem = styled.div<{ $isActive: boolean }>`
  padding: 1rem;
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
