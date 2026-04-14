"use client"; // Styled Components는 클라이언트 컴포넌트입니다.

import Link from "next/link";
import styled from "styled-components";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import { MENU_CATEGORIES } from "@/lib/menuCategories";

export default function Home() {
  return (
    <StMainContainer>
      <StTopBar>
        <ThemeToggleButton />
      </StTopBar>
      {/* 🐰 프로필 영역 */}
      <StProfileSection>
        <StAvatar>🐰</StAvatar>
        <StTitle>황총무의 실험실</StTitle>
        <StDescription>복잡한 건 제가 할게요, 총총총... 🐾</StDescription>
        <StSubDescription>
          일상의 번거로움을 덜어주는 <b>다정한 도구들</b>을 연구합니다.
        </StSubDescription>
      </StProfileSection>

      {/* 📂 카테고리별 메뉴 */}
      <StCategoryWrapper>
        {MENU_CATEGORIES.map((category) => (
          <StCategorySection key={category.title}>
            <StCategoryTitle>
              <span>{category.emoji}</span>
              {category.title}
            </StCategoryTitle>
            <StGridContainer>
              {category.items.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <StCard>
                    <StIconBox>{item.icon}</StIconBox>
                    <StCardContent>
                      <StCardTitle>{item.title}</StCardTitle>
                      <StCardDesc>{item.desc}</StCardDesc>
                    </StCardContent>
                  </StCard>
                </Link>
              ))}
            </StGridContainer>
          </StCategorySection>
        ))}
      </StCategoryWrapper>

      {/* 소개 섹션 */}
      <StSectionContainer>
        <StSectionBox>
          <StSectionTitle>황총무의 실험실이란?</StSectionTitle>
          <StParagraph>
            <b>황총무의 실험실</b>은 일상에서 마주치는 작은 불편함들을 해결하기
            위해 만든 개인 프로젝트입니다.
          </StParagraph>
          <StParagraph>
            친구들과 약속 날짜를 정할 때, 모임 후 정산할 때, 야근 시간을 계산할
            때 — 이런 순간마다 &ldquo;이거 자동으로 해주는 게 있으면
            좋겠다&rdquo;는 생각에서 출발했습니다.
          </StParagraph>
          <StParagraph>
            쓸수록 편해지는 도구를 목표로, 새로운 기능을 꾸준히 실험하고
            추가하고 있습니다. 만든 사람이 궁금하다면 포트폴리오를 구경해 주세요!
          </StParagraph>
          <Link href="/portfolio" passHref>
            <StPortfolioButton>
              <span>Developer Portfolio</span>
              <span>👩‍💻</span>
            </StPortfolioButton>
          </Link>
        </StSectionBox>

        {/* 기술 스택 */}
        <StSectionBox>
          <StSectionTitle>기술 스택</StSectionTitle>
          <StTechList>
            <StTechItem>
              <StTechLabel>Frontend</StTechLabel>
              <StTechValue>Next.js (App Router), React, TypeScript</StTechValue>
            </StTechItem>
            <StTechItem>
              <StTechLabel>Styling</StTechLabel>
              <StTechValue>styled-components, Tailwind CSS</StTechValue>
            </StTechItem>
            <StTechItem>
              <StTechLabel>Backend</StTechLabel>
              <StTechValue>Supabase (Database, Auth, Realtime)</StTechValue>
            </StTechItem>
            <StTechItem>
              <StTechLabel>Infra</StTechLabel>
              <StTechValue>Vercel</StTechValue>
            </StTechItem>
          </StTechList>
        </StSectionBox>

        {/* 문의하기 */}
        <StSectionBox>
          <StSectionTitle>문의하기</StSectionTitle>
          <StParagraph>
            서비스 이용 중 문의사항이나 건의사항이 있다면 아래로 연락해 주세요.
          </StParagraph>
          <StContactList>
            <StContactItem>
              <StContactLabel>Email</StContactLabel>
              <StContactLink href="mailto:hwangmari@naver.com">
                hwangmari@naver.com
              </StContactLink>
            </StContactItem>
            <StContactItem>
              <StContactLabel>GitHub</StContactLabel>
              <StContactLink
                href="https://github.com/hwangmari/"
                target="_blank"
              >
                github.com/hwangmari
              </StContactLink>
            </StContactItem>
            <StContactItem>
              <StContactLabel>Blog</StContactLabel>
              <StContactLink
                href="https://blog.naver.com/hwangmari"
                target="_blank"
              >
                blog.naver.com/hwangmari
              </StContactLink>
            </StContactItem>
          </StContactList>
        </StSectionBox>

        <StFooterLinks>
          <Link href="/terms">이용약관</Link>
          <StDivider>|</StDivider>
          <Link href="/privacy">개인정보처리방침</Link>
        </StFooterLinks>
      </StSectionContainer>

      {/* 하단 카피라이트 */}
      <StFooter>© 2025 Hwang Chongmu. All rights reserved.</StFooter>
    </StMainContainer>
  );
}

const StMainContainer = styled.main`
  background-color: ${({ theme }) => theme.colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
`;

const StTopBar = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
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

const StCategoryWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StCategorySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StCategoryTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
  padding-left: 0.25rem;

  span {
    font-size: 1.05rem;
  }
`;

const StGridContainer = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr; /* 모바일: 1열 */
  gap: 1rem;

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

const StPortfolioButton = styled.div`
  width: 100%;
  margin-top: 0.75rem;
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

const StSectionContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StSectionBox = styled.section`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 1rem;
`;

const StParagraph = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.8;
  margin-bottom: 0.75rem;

  b {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
  }

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const StTechList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StTechItem = styled.div`
  display: flex;
  gap: 1rem;
  align-items: baseline;
`;

const StTechLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  min-width: 80px;
  flex-shrink: 0;
`;

const StTechValue = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const StContactItem = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const StContactLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  min-width: 60px;
`;

const StContactLink = styled.a`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.blue600};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const StFooterLinks = styled.div`
  text-align: center;
  padding: 0.5rem 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  a {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray400};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.gray600};
      text-decoration: underline;
    }
  }
`;

const StDivider = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray300};
`;

const StFooter = styled.footer`
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.75rem;
  font-weight: 500;
`;
