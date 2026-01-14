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
        {/* ✅ 추가된 멘트 */}
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
              <StCardDesc>친구들과 일정을 가장 쉽게 잡는 법</StCardDesc>
            </StCardContent>
            <StArrowIcon>➔</StArrowIcon>
          </StCard>
        </Link>

        {/* ✅ 습관 관리 카드 */}
        <Link href="/habit" passHref>
          <StCard>
            <StIconBox>🥕</StIconBox>
            <StCardContent>
              <StCardTitle>습관 관리</StCardTitle>
              <StCardDesc>매일매일 쌓이는 성실함의 농도</StCardDesc>
            </StCardContent>
            <StArrowIcon>➔</StArrowIcon>
          </StCard>
        </Link>

        {/* ✅ 체중 관리 */}
        <Link href="/diet" passHref>
          <StCard>
            <StIconBox>⚖️</StIconBox>
            <StCardContent>
              <StCardTitle>체중 관리 </StCardTitle>
              <StCardDesc>평생 숙제 다이어트 해보자고!</StCardDesc>
            </StCardContent>
            <StArrowIcon>➔</StArrowIcon>
          </StCard>
        </Link>

        {/* 💸 N빵 계산기 카드*/}
        <Link href="/calc" passHref>
          <StCard>
            <StIconBox>💸</StIconBox>
            <StCardContent>
              <StCardTitle>N빵 계산기</StCardTitle>
              <StCardDesc>복잡한 셈은 덜어내고 추억만 남기는 법</StCardDesc>
            </StCardContent>
            <StArrowIcon>➔</StArrowIcon>
          </StCard>
        </Link>

        {/* ✨ 황총무 게임방*/}
        <Link href="/game" passHref>
          <StCard>
            <StIconBox>🎮</StIconBox>
            <StCardContent>
              <StCardTitle>황총무 게임방</StCardTitle>
              <StCardDesc>랜덤 게임</StCardDesc>
            </StCardContent>
            <StArrowIcon>➔</StArrowIcon>
          </StCard>
        </Link>

        {/* 포트폴리오 버튼 */}
        <Link href="/portfolio" passHref>
          <StPortfolioButton>
            <span>Developer Portfolio</span>
            <span>👩‍💻</span>
          </StPortfolioButton>
        </Link>
      </StGridContainer>

      {/* 하단 카피라이트 */}
      <StFooter>© 2025 Hwang Chongmu. All rights reserved.</StFooter>
    </StMainContainer>
  );
}

// ✨ 스타일 정의 (모두 St 접두사 적용)
const StMainContainer = styled.main`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
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

const StGridContainer = styled.div`
  width: 100%;
  max-width: 480px;
  display: grid;
  gap: 1rem;
`;

const StIconBox = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background-color: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  border-radius: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  transition: transform 0.2s;
`;

const StCardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  transition: color 0.2s;
`;

const StArrowIcon = styled.div`
  color: ${({ theme }) => theme.colors.gray300};
  transition: transform 0.2s;
`;

const StCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 2rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.blue200};

    ${StIconBox} {
      transform: scale(1.1);
    }
    ${StCardTitle} {
      color: ${({ theme }) => theme.colors.blue600};
    }
    ${StArrowIcon} {
      transform: translateX(0.25rem);
    }
  }
`;

const StCardContent = styled.div`
  flex: 1;
`;

const StCardDesc = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StPortfolioButton = styled.div`
  width: 100%;
  margin-top: 1rem;
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

  &:hover {
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.gray400};
    color: ${({ theme }) => theme.colors.gray800};
    background-color: ${({ theme }) => theme.colors.white};
  }
`;

const StFooter = styled.footer`
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem;
  font-weight: 500;
`;
