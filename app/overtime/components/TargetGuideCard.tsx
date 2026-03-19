import { TARGET_DAY_OPTIONS } from "@/app/overtime/constants";
import { formatRawDuration } from "@/app/overtime/utils";
import {
  NoticeCard,
  NoticeContent,
  TargetDayButton,
  TargetDayTabs,
} from "@/app/overtime/components/styles";

interface TargetGuideCardProps {
  targetDays: number;
  before10Minutes: number;
  after10Minutes: number;
  isReached: boolean;
  onChangeTargetDays: (days: number) => void;
}

export default function TargetGuideCard({
  targetDays,
  before10Minutes,
  after10Minutes,
  isReached,
  onChangeTargetDays,
}: TargetGuideCardProps) {
  return (
    <NoticeCard>
      <TargetDayTabs>
        {TARGET_DAY_OPTIONS.map((option) => (
          <TargetDayButton
            key={option}
            type="button"
            $isActive={targetDays === option}
            onClick={() => onChangeTargetDays(option)}
          >
            {option}일
          </TargetDayButton>
        ))}
      </TargetDayTabs>
      <NoticeContent>
        <strong>사용 가능 {targetDays.toFixed(2)}까지 더 필요해요</strong>
        {isReached ? (
          <span>이미 {targetDays.toFixed(2)} 이상 사용 가능한 상태예요.</span>
        ) : (
          <>
            <span>10시 전만 추가하면 {formatRawDuration(before10Minutes)}</span>
            <span>10시 이후만 추가하면 {formatRawDuration(after10Minutes)}</span>
          </>
        )}
      </NoticeContent>
    </NoticeCard>
  );
}
