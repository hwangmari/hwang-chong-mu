"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import Introduction from "./Introduction";
import ProfileCard from "./ProfileCard";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function PortfolioInfo() {
  return (
    <StHeaderContainer>
      <StProfileWrapper>
        {/* [좌측] 텍스트 및 소개 영역 */}
        <StMainContent>
          <StBadgeBox>Frontend Developer</StBadgeBox>

          <Introduction />

          {/* 🔗 링크 영역 (소개글 하단 배치) */}
          <StLinkGroup>
            <StExternalLink
              href="https://github.com/hwangmari/"
              target="_blank"
            >
              <StLinkContent>
                GitHub <OpenInNewIcon fontSize="inherit" />
              </StLinkContent>
            </StExternalLink>
            <StExternalLink
              href="https://blog.naver.com/hwangmari"
              target="_blank"
            >
              <StLinkContent>
                Blog <OpenInNewIcon fontSize="inherit" />
              </StLinkContent>
            </StExternalLink>
            <StSeparator>|</StSeparator>
            <StExternalLink href="mailto:hwangmari@naver.com">
              Email
            </StExternalLink>
          </StLinkGroup>
        </StMainContent>

        {/* [우측] 프로필 카드 (Sticky 사이드바) */}
        <StSidebar>
          <ProfileCard />
        </StSidebar>
      </StProfileWrapper>
    </StHeaderContainer>
  );
}


const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StHeaderContainer = styled.header`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 4rem 1.5rem; /* 상하 여백 조정 */
  animation: ${fadeInUp} 0.8s ease-out forwards;
`;

const StProfileWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;

  /* PC 화면 설정 */
  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

const StMainContent = styled.div`
  flex: 1; /* 남은 공간 모두 차지 */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0; /* Flex 자식 요소 넘침 방지 */
`;

const StSidebar = styled.aside`
  width: 100%;

  @media ${({ theme }) => theme.media.desktop} {
    width: 180px;
    flex-shrink: 0;
    position: sticky; /* 스크롤 따라오기 */
    top: 6rem;
    display: flex;
    justify-content: flex-end;
  }
`;

const StBadgeBox = styled.span`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 9999px; /* 둥근 캡슐 모양 */
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  align-self: flex-start; /* 왼쪽 정렬 */
`;

const StLinkGroup = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StLinkContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const StExternalLink = styled(Link)`
  transition: color 0.2s;
  color: ${({ theme }) => theme.colors.gray600};

  &:hover {
    color: ${({ theme }) => theme.colors.blue600}; /* 브랜드 컬러 포인트 */
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const StSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.8rem;
`;
