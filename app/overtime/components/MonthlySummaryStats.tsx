import { OvertimeSummary } from "@/app/overtime/types";
import {
  formatDayValue,
  formatMonthLabel,
  formatRawDuration,
} from "@/app/overtime/utils";
import {
  ResultBox,
  StatCard,
  StatsRow,
} from "@/app/overtime/components/styles";
import TargetGuideCard from "@/app/overtime/components/TargetGuideCard";

interface MonthlySummaryStatsProps {
  currentMonth: Date;
  monthlyRecordCount: number;
  recordSummary: OvertimeSummary;
  recordResult: string;
  targetUsableDays: number;
  targetDayGuide: {
    before10Minutes: number;
    after10Minutes: number;
    isReached: boolean;
  };
  onChangeTargetUsableDays: (days: number) => void;
}

export default function MonthlySummaryStats({
  currentMonth,
  monthlyRecordCount,
  recordSummary,
  recordResult,
  targetUsableDays,
  targetDayGuide,
  onChangeTargetUsableDays,
}: MonthlySummaryStatsProps) {
  return (
    <>
      <StatsRow>
        <StatCard>
          <span>{formatMonthLabel(currentMonth)} 기록</span>
          <strong>{monthlyRecordCount}건</strong>
        </StatCard>
        <StatCard>
          <span>누적 야근시간</span>
          <strong>{formatRawDuration(recordSummary.totalRawMinutes)}</strong>
        </StatCard>
        <StatCard>
          <span>사용 가능 일수</span>
          <strong>{formatDayValue(recordSummary.usableDays)}</strong>
        </StatCard>
      </StatsRow>

      {recordSummary.totalRawMinutes > 0 && (
        <TargetGuideCard
          targetDays={targetUsableDays}
          before10Minutes={targetDayGuide.before10Minutes}
          after10Minutes={targetDayGuide.after10Minutes}
          isReached={targetDayGuide.isReached}
          onChangeTargetDays={onChangeTargetUsableDays}
        />
      )}

      <ResultBox>{recordResult}</ResultBox>
    </>
  );
}
