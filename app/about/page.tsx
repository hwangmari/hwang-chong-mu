"use client";

import Link from "next/link";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";

const SERVICES = [
  { emoji: "📅", name: "약속 잡기", desc: "캘린더 기반 일정 투표" },
  { emoji: "📍", name: "장소잡기", desc: "네이버 검색 기반 장소 투표" },
  { emoji: "💸", name: "N빵 계산기", desc: "모임 정산을 간편하게" },
  { emoji: "🌙", name: "야근 계산기", desc: "야근 시간 입력으로 보상휴가 자동 계산" },
  { emoji: "🧾", name: "가계부", desc: "수입/지출 한눈에 관리" },
  { emoji: "🥕", name: "습관 관리", desc: "매일 체크하며 습관 만들기" },
  { emoji: "📓", name: "일일 기록", desc: "한 줄 일기 + 체크리스트" },
  { emoji: "⚖️", name: "체중 관리", desc: "다이어트 기록 추적" },
  { emoji: "🎮", name: "게임방", desc: "사다리, 돌림판, 광클 대전" },
  { emoji: "🗓️", name: "업무 캘린더", desc: "프로젝트 일정/칸반 관리" },
];

export default function AboutPage() {
  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="🐰"
          title="황총무의 실험실"
          description="복잡한 건 제가 할게요, 총총총..."
        />

        {/* 소개 섹션 */}
        <StSection>
          <StSectionTitle>이 사이트는요</StSectionTitle>
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
            프론트엔드 개발자 <b>황혜경</b>이 직접 기획하고, 디자인하고,
            개발합니다. Next.js, styled-components, Supabase를 기반으로 만들어진
            이 서비스는 앞으로도 유용한 도구들을 계속 추가해 나갈 예정입니다.
          </StParagraph>
        </StSection>

        {/* 서비스 목록 */}
        <StSection>
          <StSectionTitle>제공 중인 서비스</StSectionTitle>
          <StServiceGrid>
            {SERVICES.map((svc) => (
              <StServiceItem key={svc.name}>
                <StServiceEmoji>{svc.emoji}</StServiceEmoji>
                <StServiceInfo>
                  <StServiceName>{svc.name}</StServiceName>
                  <StServiceDesc>{svc.desc}</StServiceDesc>
                </StServiceInfo>
              </StServiceItem>
            ))}
          </StServiceGrid>
        </StSection>

        {/* 기술 스택 */}
        <StSection>
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
        </StSection>

        {/* 문의 */}
        <StSection>
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
        </StSection>

        {/* 하단 링크 */}
        <StFooterLinks>
          <Link href="/privacy">개인정보처리방침</Link>
        </StFooterLinks>
      </StWrapper>
    </StContainer>
  );
}

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

const StServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StServiceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
`;

const StServiceEmoji = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const StServiceInfo = styled.div`
  min-width: 0;
`;

const StServiceName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StServiceDesc = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
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
  padding: 1.5rem 0 0;

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
