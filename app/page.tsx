"use client"; // Styled Components는 클라이언트 컴포넌트입니다.

import Link from "next/link";
import styled from "styled-components";

export default function Home() {
  return (
    <MainContainer>
      {/* 🐰 프로필 영역 */}
      <ProfileSection>
        <Avatar>🐰</Avatar>
        <Title>황총무의 실험실</Title>
        <Description>복잡한 건 제가 할게요, 총총총... 🐾</Description>
      </ProfileSection>

      {/* 📂 프로젝트 목록 그리드 */}
      <GridContainer>
        {/* 1. 약속 잡기 카드 */}
        <Link href="/meeting" passHref>
          <Card>
            <IconBox>📅</IconBox>
            <CardContent>
              <CardTitle>약속 잡기</CardTitle>
              <CardDesc>친구들과 일정을 가장 쉽게 잡는 법</CardDesc>
            </CardContent>
            <ArrowIcon>➔</ArrowIcon>
          </Card>
        </Link>

        {/* ✅ 2. 습관 관리 카드 (추가됨!) */}
        <Link href="/habit" passHref>
          <Card>
            <IconBox>🥕</IconBox>
            <CardContent>
              <CardTitle>습관 관리</CardTitle>
              <CardDesc>매일매일 쌓이는 성실함의 농도</CardDesc>
            </CardContent>
            <ArrowIcon>➔</ArrowIcon>
          </Card>
        </Link>

        {/* 💸 3. N빵 계산기 카드 (New!) */}
        <Link href="/calc" passHref>
          <Card>
            <IconBox>💸</IconBox>
            <CardContent>
              <CardTitle>N빵 계산기</CardTitle>
              <CardDesc>복잡한 셈은 덜어내고 추억만 남기는 법</CardDesc>
            </CardContent>
            <ArrowIcon>➔</ArrowIcon>
          </Card>
        </Link>

        {/* 포트폴리오 버튼 */}
        <Link href="/portfolio" passHref>
          <PortfolioButton>
            <span>Developer Portfolio</span>
            <span>👩‍💻</span>
          </PortfolioButton>
        </Link>
      </GridContainer>

      {/* 하단 카피라이트 */}
      <Footer>© 2025 Hwang Chongmu. All rights reserved.</Footer>
    </MainContainer>
  );
}

// ✨ 스타일 정의 (기존과 동일)
const MainContainer = styled.main`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ProfileSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Avatar = styled.div`
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

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 500;
`;

const GridContainer = styled.div`
  width: 100%;
  max-width: 28rem;
  display: grid;
  gap: 1rem;
`;

const IconBox = styled.div`
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

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  transition: color 0.2s;
`;

const ArrowIcon = styled.div`
  color: ${({ theme }) => theme.colors.gray300};
  transition: transform 0.2s;
`;

const Card = styled.div`
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

    ${IconBox} {
      transform: scale(1.1);
    }
    ${CardTitle} {
      color: ${({ theme }) => theme.colors.blue600};
    }
    ${ArrowIcon} {
      transform: translateX(0.25rem);
    }
  }
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardDesc = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const PortfolioButton = styled.div`
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

const Footer = styled.footer`
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem;
  font-weight: 500;
`;
