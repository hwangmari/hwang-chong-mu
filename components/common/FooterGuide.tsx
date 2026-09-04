"use client";

import styled from "styled-components";
import Link from "next/link";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface TipItem {
  icon: ReactNode; // 이모지 or MUI 아이콘
  title: string;
  description: ReactNode; // 줄바꿈 등을 위해 ReactNode로
}

interface FooterGuideProps {
  title: string; // 전체 제목 (예: 약속 잡기 꿀팁)
  story?: {
    title: string;
    content: ReactNode;
    solution?: {
      title: string;
      content: ReactNode;
    };
  };
  tips: TipItem[]; // 팁 리스트
  blogGuideId?: string; // 블로그 사용 가이드 포스트 id
  /**
   * 팁 카드 그리드 폭.
   * "full"(기본) = 본문 전체 폭에 놓일 때 1 / 2 / 3열
   * "compact"   = 데스크톱 오른쪽 컬럼 안에 놓일 때 1 / 2열
   */
  layout?: "full" | "compact";
}

/**
 * 긴 설명을 문장 단위로 끊어 문단으로 나눈다.
 * - 마침표 뒤에 공백이 있고, 다음 글자가 한글/따옴표일 때만 자른다.
 * - "vs." 같은 약어나 괄호 안 마침표는 그대로 둔다.
 */
const SENTENCE_BREAK = /(?<=[요다죠])\.\s+(?=[가-힣'"“‘])/g;

function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_BREAK)
    .map((part, index, all) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      // split이 마침표를 먹었으므로 마지막 조각을 제외하고 되돌려준다
      return index < all.length - 1 && !trimmed.endsWith(".")
        ? `${trimmed}.`
        : trimmed;
    })
    .filter(Boolean);
}

const CLAMP_LINES = 4;

function TipCard({ tip }: { tip: TipItem }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 실제로 넘칠 때만 '더 보기'를 띄운다 (레이아웃이 흔들리지 않도록 접힌 상태에서 측정)
  const measure = useCallback(() => {
    const el = bodyRef.current;
    if (!el || isExpanded) return;
    setIsClamped(el.scrollHeight - el.clientHeight > 2);
  }, [isExpanded]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const paragraphs =
    typeof tip.description === "string"
      ? splitSentences(tip.description)
      : null;

  return (
    <StTipCard>
      <StTipIcon aria-hidden>{tip.icon}</StTipIcon>
      <StTipTitle>{tip.title}</StTipTitle>
      <StTipBody ref={bodyRef} $expanded={isExpanded}>
        {paragraphs ? (
          paragraphs.map((sentence, index) => <p key={index}>{sentence}</p>)
        ) : (
          <p>{tip.description}</p>
        )}
      </StTipBody>
      {isClamped && (
        <StMoreButton
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "접기" : "더 보기"}
        </StMoreButton>
      )}
    </StTipCard>
  );
}

export default function FooterGuide({
  title,
  story,
  tips,
  blogGuideId,
  layout = "full",
}: FooterGuideProps) {
  return (
    <StGuideSection>
      <StGuideHeader>
        <div>
          <StEyebrow>이렇게 써요</StEyebrow>
          <StGuideTitle>{title}</StGuideTitle>
        </div>
        {blogGuideId && (
          <StGuideLink href={`/blog/${blogGuideId}`}>
            자세한 사용법 →
          </StGuideLink>
        )}
      </StGuideHeader>

      {/* 1. 브랜드 스토리 — 카드 없이 조용한 리드 문단 */}
      {story && (
        <StLead>
          <StLeadTitle>{story.title}</StLeadTitle>
          <StLeadText>{story.content}</StLeadText>
          {story.solution && (
            <StCallout>
              <strong>{story.solution.title}</strong>
              <span>{story.solution.content}</span>
            </StCallout>
          )}
        </StLead>
      )}

      {/* 2. 꿀팁 카드 그리드 */}
      <StTipGrid $compact={layout === "compact"}>
        {tips.map((tip, index) => (
          <TipCard key={index} tip={tip} />
        ))}
      </StTipGrid>
    </StGuideSection>
  );
}

const StGuideSection = styled.section`
  /* 팁 카드 열 수를 '화면 폭'이 아니라 '가이드가 놓인 열의 폭'으로 정한다 */
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const StGuideHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  /* 좁은 화면에선 제목이 눌리지 않게 링크를 아래 줄로 */
  @media (max-width: 560px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
`;

const StEyebrow = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.semantic.subText};
  margin-bottom: 0.15rem;
`;

const StGuideTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  line-height: 1.35;
  word-break: keep-all;
`;

const StGuideLink = styled(Link)`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 2.2rem;
  padding: 0 0.8rem;
  border-radius: 0.7rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.semantic.bg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StLead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StLeadTitle = styled.p`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

const StLeadText = styled.div`
  font-size: 0.95rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const StCallout = styled.div`
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border-left: 3px solid ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primaryLight};

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    word-break: keep-all;
  }

  span {
    font-size: 0.88rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.semantic.subText};
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
`;

const StTipGrid = styled.div<{ $compact: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.6rem;

  /* 560 열 → 1개, 760 열 → 2개, 1024 열 → 3개.
     compact 는 아무리 넓어도 한 줄씩 유지한다. */
  ${({ $compact }) =>
    $compact
      ? ""
      : `
    @container (min-width: 620px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @container (min-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `}
`;

const StTipCard = styled.article`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.1rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
`;

const StTipIcon = styled.span`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  line-height: 1;
  flex-shrink: 0;
`;

const StTipTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  line-height: 1.4;
  word-break: keep-all;
`;

const StTipBody = styled.div<{ $expanded: boolean }>`
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
  overflow-wrap: anywhere;

  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  ${({ $expanded }) =>
    $expanded
      ? ""
      : `
    display: -webkit-box;
    -webkit-line-clamp: ${CLAMP_LINES};
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}

  /* 접힌 상태(-webkit-box)에서도 문장 사이 간격이 유지되도록 */
  p + p {
    margin-top: 0.35rem;
  }
`;

const StMoreButton = styled.button`
  padding: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  background: none;
  border: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
`;
