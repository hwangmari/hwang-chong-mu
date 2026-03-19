import { OVERTIME_RULES } from "@/app/overtime/constants";
import { OvertimeRuleId } from "@/app/overtime/types";
import {
  RuleSelectorButton,
  RuleSelectorCard,
  RuleSelectorDescription,
  RuleSelectorHeader,
  RuleSelectorTabs,
  RuleSelectorTitle,
} from "@/app/overtime/components/styles";

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
            <RuleSelectorButton
              key={rule.id}
              type="button"
              $isActive={activeRuleId === rule.id}
              onClick={() => onChangeRule(rule.id)}
            >
              {rule.shortLabel}
            </RuleSelectorButton>
          ))}
        </RuleSelectorTabs>
      </RuleSelectorHeader>
    </RuleSelectorCard>
  );
}
