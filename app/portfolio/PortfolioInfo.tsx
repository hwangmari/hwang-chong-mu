"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import Typography from "@/components/common/Typography";

export default function PortfolioInfo() {
  return (
    <StHeaderContainer>
      <StProfileWrapper>
        <StTextContent>
          {/* 🏷️ 뱃지 */}
          <StBadgeBox>Frontend Developer</StBadgeBox>

          {/* 🦁 메인 타이틀 */}
          <StMainTitleWrapper>
            <Typography variant="h1" as="h1" color="gray900">
              사용자의 불편함을 <br className="desktop-only" />
              <span className="text-blue-600 fw-700">기술로 해결하는</span>{" "}
              황혜경입니다.
            </Typography>
          </StMainTitleWrapper>

          {/* 🐰 설명글 */}
          <Typography variant="body1" color="gray500">
            복잡한 문제를 단순하게 정의하고, <br />
            주도적으로 서비스를 만들어가는 것을 좋아합니다.
            <br />
            운동과 기록을 즐기며, 끊임없이 성장하는 개발자입니다.
          </Typography>
        </StTextContent>

        <StAvatarBox>👩‍💻</StAvatarBox>
      </StProfileWrapper>

      {/* 🔗 링크 영역 */}
      <StLinkGroup>
        <StExternalLink href="https://github.com/hwangmari/" target="_blank">
          GitHub ↗
        </StExternalLink>
        <StExternalLink href="https://blog.naver.com/hwangmari" target="_blank">
          Blog ↗
        </StExternalLink>
        <StSeparator>|</StSeparator>
        <StExternalLink href="mailto:hwangmari@naver.com">Email</StExternalLink>
      </StLinkGroup>
    </StHeaderContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스 적용)

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StHeaderContainer = styled.header`
  max-width: 56rem;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  animation: ${fadeInUp} 0.8s ease-out forwards;
`;

const StProfileWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const StTextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StBadgeBox = styled.span`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.gray900};
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
`;

const StMainTitleWrapper = styled.div`
  .desktop-only {
    display: none;
    @media ${({ theme }) => theme.media.desktop} {
      display: block;
    }
  }
`;

const StAvatarBox = styled.div`
  width: 6rem;
  height: 6rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.25rem;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

  @media ${({ theme }) => theme.media.desktop} {
    width: 8rem;
    height: 8rem;
  }
`;

const StLinkGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StExternalLink = styled(Link)`
  transition: all 0.2s;
  text-decoration-thickness: 2px;
  color: ${({ theme }) => theme.colors.gray600};

  &:hover {
    color: ${({ theme }) => theme.colors.black};
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const StSeparator = styled.span`
  color: ${({ theme }) => theme.colors.gray300};
`;
