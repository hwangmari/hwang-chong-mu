"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styled from "styled-components";

// 가계부·업무 캘린더는 워크스페이스에 들어가면 전체 화면 고정 레이아웃을 쓰기 때문에
// GlobalHeader와 동일한 기준으로 이 페이지들에서는 푸터도 숨긴다. (GlobalHeader.tsx 참고)
function useShouldHideChrome() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAccountBookHub =
    pathname === "/account-book" && !searchParams.get("workspaceId");
  const isScheduleHub =
    pathname === "/schedule" && !searchParams.get("workspaceId");

  return (
    (pathname.startsWith("/account-book") && !isAccountBookHub) ||
    (pathname.startsWith("/schedule") && !isScheduleHub)
  );
}

const FOOTER_LINKS = [
  { href: "/blog/hwang-chongmu-intro", label: "소개" },
  { href: "/blog", label: "블로그" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "mailto:hwangmari@naver.com", label: "문의" },
];

export default function GlobalFooter() {
  const shouldHide = useShouldHideChrome();

  if (shouldHide) {
    return null;
  }

  return (
    <StFooterWrapper>
      <div className="center-box">
        <StTop>
          <StBrand>황총무의 실험실</StBrand>
          <StTagline>복잡한 건 제가 할게요, 총총총... 🐾</StTagline>
        </StTop>

        <StLinkRow>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </StLinkRow>

        <StCopyright>© 2026 황총무의 실험실</StCopyright>
      </div>
    </StFooterWrapper>
  );
}

const StFooterWrapper = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  background-color: ${({ theme }) => theme.semantic.bg};
  /* 본문(components/styled/layout.styled.tsx의 StContainer: padding 2rem 1rem, max-width 1024px)과 왼쪽 선을 맞춘다 */
  padding: 2rem 0 calc(2rem + env(safe-area-inset-bottom, 0px));
  margin-top: 2rem;

  .center-box {
    max-width: 1024px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
`;

const StTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const StBrand = styled.p`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StTagline = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StLinkRow = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;

  a {
    font-size: 0.82rem;
    font-weight: 600;
    color: ${({ theme }) => theme.semantic.subText};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.semantic.text};
      text-decoration: underline;
    }
  }
`;

const StCopyright = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
`;
