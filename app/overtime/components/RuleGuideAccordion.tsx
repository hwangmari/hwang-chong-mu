"use client";

import { useState } from "react";
import { OvertimeRule, RuleGuideItem } from "@/app/overtime/types";
import {
  AccordionHeader,
  AccordionHint,
  AccordionSection,
  AccordionToggleButton,
  GuideItem,
  GuideList,
  GuidePanel,
  GuideTitle,
  RuleItem,
  RuleList,
  SectionTitle,
  SubText,
} from "@/app/overtime/components/styles";
import { StFieldGrid } from "@/components/styled/layout.styled";
import { formatRawDuration } from "@/app/overtime/utils";

interface RuleGuideAccordionProps {
  activeRule: OvertimeRule;
  guideItems: RuleGuideItem[];
}

export default function RuleGuideAccordion({
  activeRule,
  guideItems,
}: RuleGuideAccordionProps) {
  // 표가 15줄이라 기본은 접어 두고, 필요할 때만 펼친다 (사용자 요청 2026-09-08)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <AccordionSection>
      <AccordionHeader>
        <div>
          <SectionTitle>보상 규칙 요약</SectionTitle>
          {!isExpanded && (
            <AccordionHint>
              적립 기준·배율과 휴가 일수별 필요 야근 시간을 표로 볼 수 있어요.
            </AccordionHint>
          )}
        </div>
        <AccordionToggleButton
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "접기" : "더보기"}
        </AccordionToggleButton>
      </AccordionHeader>
      {isExpanded && (
        <>
          {/* 규칙 표(5줄)와 휴가 가이드(10줄)를 넓은 화면에선 나란히 — 카드가 아래로 길어지지 않게 */}
          <StFieldGrid>
            <GuidePanel>
              <GuideTitle>적립 규칙</GuideTitle>
              <RuleList>
                {activeRule.ruleSummaryItems.map((item) => (
                  <RuleItem key={`${activeRule.id}-${item.label}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </RuleItem>
                ))}
              </RuleList>
            </GuidePanel>
            <GuidePanel>
              <GuideTitle>{activeRule.guideTitle}</GuideTitle>
              <GuideList>
                {guideItems.map((item) => (
                  <GuideItem key={item.days}>
                    <span>{item.days}일 휴가</span>
                    <strong>
                      {formatRawDuration(item.totalMinutes)} 야근 필요
                    </strong>
                  </GuideItem>
                ))}
              </GuideList>
            </GuidePanel>
          </StFieldGrid>
          <SubText>{activeRule.exampleText}</SubText>
        </>
      )}
    </AccordionSection>
  );
}
