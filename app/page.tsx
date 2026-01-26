"use client"; // Styled Components는 클라이언트 컴포넌트입니다.

import Link from "next/link";
import styled from "styled-components";

export default function Home() {
  return (
    <StMainContainer>
      {/* 🐰 프로필 영역 */}
      <StProfileSection>
        <StAvatar>🐰</StAvatar>
        <StTitle>황총무의 실험실</StTitle>
        <StDescription>복잡한 건 제가 할게요, 총총총... 🐾</StDescription>
        <StSubDescription>
          일상의 번거로움을 덜어주는 <b>다정한 도구들</b>을 연구합니다.
        </StSubDescription>
      </StProfileSection>

      {/* 📂 프로젝트 목록 그리드 */}
      <StGridContainer>
        {/* 약속 잡기 카드 */}
        <Link href="/meeting" passHref>
          <StCard>
            <StIconBox>📅</StIconBox>
            <StCardContent>
              <StCardTitle>약속 잡기</StCardTitle>
              <StCardDesc>친구들과 일정을 잡는 법</StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* 습관 관리 카드 */}
        <Link href="/habit" passHref>
          <StCard>
            <StIconBox>🥕</StIconBox>
            <StCardContent>
              <StCardTitle>습관 관리</StCardTitle>
              <StCardDesc>매일매일 쌓이는 성실함</StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* 체중 관리 */}
        <Link href="/diet" passHref>
          <StCard>
            <StIconBox>⚖️</StIconBox>
            <StCardContent>
              <StCardTitle>체중 관리</StCardTitle>
              <StCardDesc>평생 숙제 다이어트!</StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* N빵 계산기 카드*/}
        <Link href="/calc" passHref>
          <StCard>
            <StIconBox>💸</StIconBox>
            <StCardContent>
              <StCardTitle>N빵 계산기</StCardTitle>
              <StCardDesc>복잡한 셈은 덜어내고</StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* 황총무 게임방*/}
        <Link href="/game" passHref>
          <StCard>
            <StIconBox>🎮</StIconBox>
            <StCardContent>
              <StCardTitle>게임방</StCardTitle>
              <StCardDesc>심심할 땐 랜덤 게임</StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* 업무 캘린더 */}
        <Link href="/schedule" passHref>
          <StCard>
            <StIconBox>🗓️</StIconBox>
            <StCardContent>
              <StCardTitle>업무 캘린더</StCardTitle>
              <StCardDesc>
                프로젝트 일정 관리 <br />
                관계자 외 출입금지
              </StCardDesc>
            </StCardContent>
          </StCard>
        </Link>

        {/* 포트폴리오 버튼 (전체 너비 차지하도록 설정) */}
        <StFullWidthLink href="/portfolio" passHref>
          <StPortfolioButton>
            <span>Developer Portfolio</span>
            <span>👩‍💻</span>
          </StPortfolioButton>
        </StFullWidthLink>
      </StGridContainer>

      {/* 하단 카피라이트 */}
      <StFooter>© 2025 Hwang Chongmu. All rights reserved.</StFooter>
    </StMainContainer>
  );
}

// ✨ 스타일 정의

const StMainContainer = styled.main`
  background-color: ${({ theme }) => theme.colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
`;

const StProfileSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const StAvatar = styled.div`
  width: 6rem;
  height: 6rem;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin: 0 auto 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  border: 4px solid ${({ theme }) => theme.colors.blue50};
`;

const StTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const StDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const StSubDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.5;

  b {
    color: ${({ theme }) => theme.colors.blue500};
    font-weight: 600;
  }
`;

// ✨ [수정] 2열 그리드 레이아웃 적용
const StGridContainer = styled.div`
  width: 100%;
  max-width: 600px; /* 카드가 2열이라 너비를 좀 더 넓힘 */
  display: grid;
  grid-template-columns: 1fr; /* 모바일: 1열 */
  gap: 1rem;

  /* 태블릿 이상: 2열 */
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StIconBox = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  border-radius: 0.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  transition: transform 0.2s;
  flex-shrink: 0;
`;

const StCardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  transition: color 0.2s;
  margin-bottom: 0.2rem;
`;

const StCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.25rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  height: 100%; /* 높이 맞춤 */

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.blue200};
    transform: translateY(-2px);

    ${StIconBox} {
      transform: scale(1.1) rotate(5deg);
    }
    ${StCardTitle} {
      color: ${({ theme }) => theme.colors.blue600};
    }
  }
`;

const StCardContent = styled.div`
  flex: 1;
  min-width: 0; /* 텍스트 말줄임 처리를 위해 필수 */
`;

const StCardDesc = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 내용 길면 ... 처리 */
`;

// ✨ [추가] 포트폴리오 버튼을 위한 전체 너비 링크 래퍼
const StFullWidthLink = styled(Link)`
  grid-column: 1 / -1; /* 그리드 전체 열 차지 */
  text-decoration: none;
`;

const StPortfolioButton = styled.div`
  width: 100%;
  padding: 1rem;
  border-radius: 1.5rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
  background-color: transparent;

  &:hover {
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.gray400};
    color: ${({ theme }) => theme.colors.gray800};
    background-color: ${({ theme }) => theme.colors.white};
  }
`;

const StFooter = styled.footer`
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem;
  font-weight: 500;
`;
