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
import { formatRawDuration } from "@/app/overtime/utils";

interface RuleGuideAccordionProps {
  isExpanded: boolean;
  activeRule: OvertimeRule;
  guideItems: RuleGuideItem[];
  onToggle: () => void;
}

export default function RuleGuideAccordion({
  isExpanded,
  activeRule,
  guideItems,
  onToggle,
}: RuleGuideAccordionProps) {
  return (
    <AccordionSection>
      <AccordionHeader>
        <SectionTitle>보상 규칙 요약</SectionTitle>
        <AccordionToggleButton type="button" onClick={onToggle}>
          {isExpanded ? "접기" : "더보기"}
        </AccordionToggleButton>
      </AccordionHeader>
      {isExpanded ? (
        <>
          <RuleList>
            {activeRule.ruleSummaryItems.map((item) => (
              <RuleItem key={`${activeRule.id}-${item.label}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </RuleItem>
            ))}
          </RuleList>
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
          <SubText>{activeRule.exampleText}</SubText>
        </>
      ) : (
        <AccordionHint>{activeRule.collapsedHint}</AccordionHint>
      )}
    </AccordionSection>
  );
}
