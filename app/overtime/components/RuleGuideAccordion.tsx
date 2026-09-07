import { OvertimeRule, RuleGuideItem } from "@/app/overtime/types";
import {
  AccordionSection,
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
  return (
    <AccordionSection>
      <SectionTitle>보상 규칙 요약</SectionTitle>
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
              <strong>{formatRawDuration(item.totalMinutes)} 야근 필요</strong>
            </GuideItem>
          ))}
        </GuideList>
      </GuidePanel>
      </StFieldGrid>
      <SubText>{activeRule.exampleText}</SubText>
    </AccordionSection>
  );
}
