import { OVERTIME_RULES } from "@/app/overtime/constants";
import { OvertimeRuleId } from "@/app/overtime/types";
import {
  RuleSelectorCard,
  RuleSelectorDescription,
  RuleSelectorHeader,
  RuleSelectorTabs,
  RuleSelectorTitle,
} from "@/app/overtime/components/styles";
import { StSegmentButton } from "@/components/styled/layout.styled";

interface RuleSelectorProps {
  activeRuleId: OvertimeRuleId;
  activeRuleDescription: string;
  onChangeRule: (nextRuleId: OvertimeRuleId) => void;
}

export default function RuleSelector({
  activeRuleId,
  activeRuleDescription,
  onChangeRule,
}: RuleSelectorProps) {
  return (
    <RuleSelectorCard>
      <RuleSelectorHeader>
        <div>
          <RuleSelectorTitle>계산 요건</RuleSelectorTitle>
          <RuleSelectorDescription>
            {activeRuleDescription}
          </RuleSelectorDescription>
        </div>
        <RuleSelectorTabs>
          {Object.values(OVERTIME_RULES).map((rule) => (
            <StSegmentButton
              key={rule.id}
              type="button"
              $active={activeRuleId === rule.id}
              onClick={() => onChangeRule(rule.id)}
            >
              {rule.shortLabel}
            </StSegmentButton>
          ))}
        </RuleSelectorTabs>
      </RuleSelectorHeader>
    </RuleSelectorCard>
  );
}
