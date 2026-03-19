import { OvertimeSummary } from "@/app/overtime/types";
import {
  CompactInput,
  DurationCard,
  DurationInputs,
  FieldLabel,
  GuideText,
  PrimaryButton,
  ResultBox,
  SplitGrid,
  TabPanel,
  UnitText,
} from "@/app/overtime/components/styles";
import TargetGuideCard from "@/app/overtime/components/TargetGuideCard";

interface CalculatorTabProps {
  calcBefore10Hours: string;
  calcBefore10Minutes: string;
  calcAfter10Hours: string;
  calcAfter10Minutes: string;
  calcResult: string;
  calcSummary: OvertimeSummary | null;
  calcTargetDays: number;
  calcTargetGuide: {
    before10Minutes: number;
    after10Minutes: number;
    isReached: boolean;
  } | null;
  onChangeCalcBefore10Hours: (value: string) => void;
  onChangeCalcBefore10Minutes: (value: string) => void;
  onChangeCalcAfter10Hours: (value: string) => void;
  onChangeCalcAfter10Minutes: (value: string) => void;
  onNormalizeBefore10: () => void;
  onNormalizeAfter10: () => void;
  onCalculate: () => void;
  onChangeCalcTargetDays: (days: number) => void;
}

export default function CalculatorTab({
  calcBefore10Hours,
  calcBefore10Minutes,
  calcAfter10Hours,
  calcAfter10Minutes,
  calcResult,
  calcSummary,
  calcTargetDays,
  calcTargetGuide,
  onChangeCalcBefore10Hours,
  onChangeCalcBefore10Minutes,
  onChangeCalcAfter10Hours,
  onChangeCalcAfter10Minutes,
  onNormalizeBefore10,
  onNormalizeAfter10,
  onCalculate,
  onChangeCalcTargetDays,
}: CalculatorTabProps) {
  return (
    <TabPanel>
      <GuideText>
        시간/분으로 입력할 수 있어요.
        <br />분 칸에 `240`처럼 넣으면 포커스를 벗어날 때 자동으로 `4시간
        0분` 으로 바뀝니다.
      </GuideText>

      <SplitGrid>
        <DurationCard>
          <FieldLabel>10시 전 야근</FieldLabel>
          <DurationInputs>
            <CompactInput
              type="text"
              min="0"
              placeholder="시간"
              value={calcBefore10Hours}
              onChange={(event) => onChangeCalcBefore10Hours(event.target.value)}
            />
            <UnitText>시간</UnitText>
            <CompactInput
              type="text"
              min="0"
              placeholder="분"
              value={calcBefore10Minutes}
              onChange={(event) =>
                onChangeCalcBefore10Minutes(event.target.value)
              }
              onBlur={onNormalizeBefore10}
            />
            <UnitText>분</UnitText>
          </DurationInputs>
        </DurationCard>

        <DurationCard>
          <FieldLabel>10시 이후 야근</FieldLabel>
          <DurationInputs>
            <CompactInput
              type="text"
              min="0"
              placeholder="시간"
              value={calcAfter10Hours}
              onChange={(event) => onChangeCalcAfter10Hours(event.target.value)}
            />
            <UnitText>시간</UnitText>
            <CompactInput
              type="text"
              min="0"
              placeholder="분"
              value={calcAfter10Minutes}
              onChange={(event) =>
                onChangeCalcAfter10Minutes(event.target.value)
              }
              onBlur={onNormalizeAfter10}
            />
            <UnitText>분</UnitText>
          </DurationInputs>
        </DurationCard>
      </SplitGrid>

      <PrimaryButton type="button" onClick={onCalculate}>
        계산하기
      </PrimaryButton>

      <ResultBox>
        {calcResult || "10시 전/이후 야근 시간을 입력하고 계산해보세요."}
      </ResultBox>

      {calcSummary && calcSummary.totalRawMinutes > 0 && calcTargetGuide && (
        <TargetGuideCard
          targetDays={calcTargetDays}
          before10Minutes={calcTargetGuide.before10Minutes}
          after10Minutes={calcTargetGuide.after10Minutes}
          isReached={calcTargetGuide.isReached}
          onChangeTargetDays={onChangeCalcTargetDays}
        />
      )}
    </TabPanel>
  );
}
