"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import ToolDemo, { type DemoScene } from "./ToolDemo";

// 메인 첫 화면: 총무가 실제로 마주치는 상황이 몇 초마다 바뀌고, 그 상황을 푸는 도구로 바로 이어진다.
type Situation = {
  question: string; // 상황 (큰 제목)
  answer: string; // 이 도구가 어떻게 푸는지 한 줄
  cta: string; // 버튼 글자
  href: string;
  icon: string;
  scene: DemoScene; // 오른쪽 미니 데모 장면
};

const SITUATIONS: Situation[] = [
  {
    question: "회식 날짜, 아직 못 잡았나요?",
    answer: "되는 날을 묻지 말고 안 되는 날만 찍게 하면, 남는 날이 곧 모임 날이에요.",
    cta: "약속 잡기 시작",
    href: "/meeting",
    scene: "meeting",
    icon: "📅",
  },
  {
    question: "어제 밤 11시까지 일했는데, 이거 얼마죠?",
    answer: "밤 10시 전후로 나눠 적으면 누적 시간과 보상휴가 일수까지 바로 나와요.",
    cta: "야근 계산하기",
    href: "/overtime",
    scene: "overtime",
    icon: "🌙",
  },
  {
    question: "여행 다녀왔는데, 누가 누구한테 얼마 보내죠?",
    answer: "숙소·식사·기름값을 각자 낸 대로 적으면, 송금 횟수를 가장 적게 줄여서 알려줘요.",
    cta: "여행 경비 계산하기",
    href: "/calc",
    scene: "calc",
    icon: "💸",
  },
  {
    question: "이번 주말 교류전, 대진표 누가 짜요?",
    answer: "선수 명단만 넣으면 출전 횟수가 공평한 대진표와 승점 순위가 나와요.",
    cta: "대진표 만들기",
    href: "/tennis",
    scene: "tennis",
    icon: "🎾",
  },
  {
    question: "청첩장이 왔는데, 저번에 얼마 받았더라?",
    answer: "이름으로 찾으면 그 사람과 주고받은 경조사비 내역이 바로 나와요.",
    cta: "경조사비 장부 열기",
    href: "/gift-log",
    scene: "gift",
    icon: "🎁",
  },
];

const ROTATE_MS = 4500;

export default function HeroSituations() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // 움직임 줄이기 설정이면 첫 상황만 고정
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SITUATIONS.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const current = SITUATIONS[index];

  return (
    <StHeroGrid onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <StHero>
      <StEyebrow>총무에게 이런 날이 있죠</StEyebrow>
      <StQuestion key={`q-${index}`} className="display" aria-live="polite">
        <StMark>{current.question}</StMark>
      </StQuestion>
      <StAnswer key={`a-${index}`}>{current.answer}</StAnswer>
      <StCtaRow>
        <StCta href={current.href}>
          <span aria-hidden="true">{current.icon}</span> {current.cta} →
        </StCta>
        <StDots role="tablist" aria-label="상황 고르기">
          {SITUATIONS.map((s, i) => (
            <StDot
              key={s.href}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.question}
              $active={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </StDots>
      </StCtaRow>
    </StHero>
    <ToolDemo scene={current.scene} />
    </StHeroGrid>
  );
}

const rise = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StHeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: center;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const StHero = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-width: 0;
`;

const StEyebrow = styled.p`
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.semantic.primary};
`;

const StQuestion = styled.h2`
  font-size: clamp(1.9rem, 4.2vw, 3rem);
  line-height: 1.25;
  font-weight: 400;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
  /* 상황이 바뀔 때 줄 수가 달라져도 아래가 밀리지 않게 두 줄 높이를 미리 잡아 둔다 (폰은 세 줄) */
  min-height: calc(1.25em * 2);
  animation: ${rise} 0.45s ease-out;
  @media ${({ theme }) => theme.media.mobile} {
    min-height: calc(1.25em * 3);
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* 형광펜으로 그은 듯한 밑칠 — 이 페이지의 시그니처 */
const StMark = styled.span`
  background-image: linear-gradient(transparent 58%, ${({ theme }) => theme.colors.amber200} 58%);
  background-repeat: no-repeat;
  padding: 0 0.15em;
`;

const StAnswer = styled.p`
  font-size: 1.05rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
  max-width: 34rem;
  min-height: calc(1.6em * 2); /* 설명도 두 줄 높이 고정 (폰은 세 줄) */
  animation: ${rise} 0.45s ease-out 0.08s both;
  @media ${({ theme }) => theme.media.mobile} {
    min-height: calc(1.6em * 3);
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StCtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
`;

const StCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.3rem;
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -10px ${({ theme }) => theme.semantic.primary};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StDots = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const StDot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? "1.4rem" : "0.5rem")};
  height: 0.5rem;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.semantic.primary : theme.colors.gray300)};
  transition: width 0.2s ease, background 0.2s ease;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;
