"use client";

import styled, { keyframes } from "styled-components";

// 로그인 전 '내 서비스 요약'(/my)의 맨 위 머리말 + 좋은 점 세 가지.
// 로그인한 뒤에는 이 설명이 필요 없어(2026-09-08 사용자 결정) 판이 바로 '이번 달'부터 시작한다.
// 아래 판(게이지·달력·현황·내 방)은 로그인 전에는 예시 데이터, 로그인 후에는 진짜 데이터로 같은 모양을 그린다.

// 연결하면(또는 연결해 두면) 좋은 점 세 가지
const BENEFITS = [
  {
    icon: "🔗",
    title: "한 계정으로 이어짐",
    text: "약속·정산·가계부·운동을 계정 하나에 연결해요.",
  },
  {
    icon: "⏱️",
    title: "오늘·이번 주가 먼저",
    text: "지난 기록보다 지금 챙길 것이 위로 올라와요.",
  },
  {
    icon: "🔓",
    title: "로그인 없이도 각 도구는 그대로",
    text: "각 도구는 로그인 안 해도 지금처럼 쓸 수 있어요.",
  },
];

// 현황 줄 하나하나에 붙는 "이게 좋아요" 한 줄. 서비스 아이디로 찾는다.
// 로그인 전 예시 줄과 로그인 후 진짜 줄이 똑같은 문장을 쓴다.
export const SERVICE_BENEFITS: Record<string, string> = {
  meeting: "확정되면 달력에 자동으로",
  calc: "남은 정산만 골라 보여줘요",
  place: "투표 결과가 바로바로 모여요",
  tennis: "다음 경기 D-day가 늘 보여요",
  daily: "며칠째 쓰고 있는지 이어져요",
  overtime: "보상휴가 며칠인지 바로 나와요",
  schedule: "오늘 마감인 일이 맨 위로 와요",
  "account-book": "예산 대비 얼마 썼는지 한 줄로",
  "gift-log": "이름만 치면 주고받은 내역이 나와요",
  habit: "이번 주 몇 번 해냈는지 보여요",
  diet: "목표까지 남은 만큼 채워져요",
  workout: "폰에서 적고 PC에서 이어 봐요",
};

export default function DashboardIntro() {
  return (
    <StIntroWrap>
      <StIntro>
        <StIntroTitle>흩어진 약속·정산·기록을 한 화면에</StIntroTitle>
        <StIntroText>
          오늘 할 일이 먼저 보이고, 폰과 PC가 같은 화면이에요. 아래는 예시예요.
        </StIntroText>
      </StIntro>

      <StBenefitRow>
        {BENEFITS.map((benefit, index) => (
          <StBenefitCard
            key={benefit.title}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <StBenefitHead>
              <StBenefitIcon aria-hidden="true">{benefit.icon}</StBenefitIcon>
              <StBenefitTitle>{benefit.title}</StBenefitTitle>
            </StBenefitHead>
            <StBenefitText>{benefit.text}</StBenefitText>
          </StBenefitCard>
        ))}
      </StBenefitRow>
    </StIntroWrap>
  );
}

// 카드가 아래에서 한 번 올라온다 (반복 없음)
const rise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StIntroWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.25rem;
`;

const StIntroTitle = styled.h2`
  font-size: 1.35rem;
  line-height: 1.35;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

const StIntroText = styled.p`
  font-size: 0.92rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
`;

// 한 줄에 셋(모바일 1열), 격자라 아래 선이 저절로 맞는다
const StBenefitRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.6rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }
`;

const StBenefitCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StBenefitHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
`;

const StBenefitIcon = styled.span`
  font-size: 1.05rem;
  line-height: 1;
  flex-shrink: 0;
`;

const StBenefitTitle = styled.strong`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

const StBenefitText = styled.span`
  font-size: 0.8rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
`;
