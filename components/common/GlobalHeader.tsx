"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

// ✅ 경로별 타이틀 매핑
const TITLE_MAP: Record<string, string> = {
  "/": "황총무의 실험실",
  "/meeting": "약속 잡기",
  "/habit": "습관 관리",
  "/calc": "N빵 계산기",
  "/game": "황총무 게임방",
  "/portfolio": "포트폴리오",
};

// ✅ 메뉴 목록
const NAV_ITEMS = [
  { label: "홈으로", href: "/" },
  { label: "약속 잡기", href: "/meeting" },
  { label: "습관 관리", href: "/habit" },
  { label: "N빵 계산기", href: "/calc" },
  { label: "황총무 게임방", href: "/game" },
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("황총무의 실험실");

  // ✅ 경로가 바뀔 때마다 타이틀 자동 설정
  useEffect(() => {
    if (TITLE_MAP[pathname]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTitle(TITLE_MAP[pathname]);
      return;
    }
    if (pathname.startsWith("/calc")) setCurrentTitle(TITLE_MAP["/calc"]);
    else if (pathname.startsWith("/meeting"))
      setCurrentTitle(TITLE_MAP["/meeting"]);
    else if (pathname.startsWith("/habit"))
      setCurrentTitle(TITLE_MAP["/habit"]);
    else setCurrentTitle("황총무의 실험실");
  }, [pathname]);

  // ✨ [추가] 경로가 바뀌면 스크롤을 맨 위로 올리고, 메뉴 닫기
  useEffect(() => {
    // 1. 메뉴 닫기 (페이지 이동했으니까)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);

    // 2. 윈도우 스크롤 맨 위로 (즉시 이동)
    window.scrollTo(0, 0);
  }, [pathname]); // pathname이 바뀔 때마다 실행

  // 홈('/')이 아니면 뒤로가기 버튼 노출
  const showBack = pathname !== "/";

  // ✨ [추가] 스마트 뒤로가기 핸들러
  const handleBack = () => {
    // 1. 게임방 안에 있을 때
    const isGameRoom =
      pathname.startsWith("/game/") && pathname.split("/").length > 2;

    if (isGameRoom) {
      // 🚨 뒤로가기 실행 (이제 강제로 /game으로 보내지 않음!)
      router.back();
      return;
    }

    // 1. 이전 페이지 정보(Referrer)가 있는지, 그리고 내 사이트에서 왔는지 확인
    const referrer = document.referrer;
    const currentHost = window.location.host; // 예: localhost:3000

    // 2. 내 사이트 내부에서 이동해온 경우 -> 정상적으로 뒤로가기
    if (referrer && referrer.includes(currentHost)) {
      router.back();
    } else {
      // 3. 외부에서 왔거나(구글 등), 새 탭으로 바로 들어온 경우 -> 홈으로 이동
      router.push("/");
    }
  };

  return (
    <>
      <StHeaderWrapper>
        {/* [좌측] 뒤로가기 버튼 */}
        <StLeftArea>
          {showBack && (
            // router.back() 대신 handleBack 사용
            <StIconButton onClick={handleBack} aria-label="뒤로 가기">
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

// ... 스타일 정의는 기존과 동일하게 유지 ...
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
