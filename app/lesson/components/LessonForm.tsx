"use client";

import { Button } from "@hwangchongmu/ui";
import DatePickerCalendar from "@/app/workout/components/DatePickerCalendar";
import { formatDurationMin } from "@/app/workout/helpers";
import { onlyDigits } from "@/utils/number";
import {
  StActions,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StError,
  StFieldName,
  StInput,
  StLabel,
  StTextarea,
} from "@/app/gift-log/page.styles";
import { StIconBtn, StMinuteField, StPartRow, StTotalBand } from "../page.styles";

export type PartInput = { name: string; minutes: string };

export type LessonFormState = {
  /** 고칠 때만 */
  id: string | null;
  date: string;
  parts: PartInput[];
  raw: string;
};

/** 구성 이름을 빠르게 넣는 칩 */
const PART_PRESETS = ["레슨", "볼머신", "랠리", "게임", "서브 연습"];

export function formMinutes(form: LessonFormState) {
  return form.parts.reduce((sum, p) => sum + (Number(p.minutes) || 0), 0);
}

type Props = {
  form: LessonFormState;
  lessonDates: ReadonlySet<string>;
  busy: boolean;
  error: string;
  onChange: (patch: Partial<LessonFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function LessonForm({
  form,
  lessonDates,
  busy,
  error,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const total = formMinutes(form);

  function patchPart(index: number, patch: Partial<PartInput>) {
    onChange({ parts: form.parts.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
  }

  function addPart(name: string) {
    // 비어 있는 줄이 있으면 거기에 채우고, 없으면 한 줄 더한다
    const empty = form.parts.findIndex((p) => !p.name.trim());
    if (empty >= 0) patchPart(empty, { name });
    else onChange({ parts: [...form.parts, { name, minutes: "" }] });
  }

  return (
    <StCard id="lesson-form">
      <StCardHead>
        <StCardTitle>{form.id ? "✏️ 일지 고치기" : "✏️ 오늘 레슨"}</StCardTitle>
      </StCardHead>

      <StLabel>
        <StFieldName>날짜</StFieldName>
        <StInput
          type="date"
          value={form.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
        <DatePickerCalendar
          value={form.date}
          onChange={(date) => onChange({ date })}
          markedDates={lessonDates}
        />
      </StLabel>

      <StLabel as="div">
        <StFieldName>무엇을 몇 분</StFieldName>
        {form.parts.map((part, index) => (
          <StPartRow key={index}>
            <StInput
              type="text"
              placeholder="예) 레슨"
              value={part.name}
              maxLength={20}
              autoComplete="off"
              aria-label={`${index + 1}번째 구성 이름`}
              onChange={(e) => patchPart(index, { name: e.target.value })}
            />
            <StMinuteField>
              <StInput
                type="text"
                inputMode="numeric"
                placeholder="20"
                value={part.minutes}
                aria-label={`${index + 1}번째 구성 시간(분)`}
                onChange={(e) => patchPart(index, { minutes: onlyDigits(e.target.value).slice(0, 3) })}
              />
              <span>분</span>
            </StMinuteField>
            <StIconBtn
              type="button"
              aria-label={`${index + 1}번째 구성 지우기`}
              disabled={form.parts.length <= 1}
              onClick={() => onChange({ parts: form.parts.filter((_, i) => i !== index) })}
            >
              ×
            </StIconBtn>
          </StPartRow>
        ))}
        <StChipRow>
          {PART_PRESETS.map((name) => (
            <StChip key={name} type="button" $active={false} onClick={() => addPart(name)}>
              + {name}
            </StChip>
          ))}
        </StChipRow>
      </StLabel>

      <StTotalBand>
        <span>운동 기록에 테니스로 들어가요</span>
        <b>{total > 0 ? `총 ${formatDurationMin(total)}` : "시간 없이"}</b>
      </StTotalBand>

      <StLabel>
        <StFieldName>배운 것 · 느낀 것</StFieldName>
        <StTextarea
          rows={6}
          placeholder="생각나는 대로 적어요. 다듬지 않아도 돼요. 예) 빠른 공은 크게 휘두르지 말고 면으로 받기"
          value={form.raw}
          onChange={(e) => onChange({ raw: e.target.value })}
        />
      </StLabel>

      {error ? <StError>{error}</StError> : null}

      <StActions>
        {form.id ? (
          <Button color="light" variant="fill" size="medium" onClick={onCancel} disabled={busy}>
            취소
          </Button>
        ) : null}
        <Button color="primary" variant="fill" size="medium" onClick={onSubmit} disabled={busy}>
          {busy ? "저장 중…" : form.id ? "고친 내용 저장" : "일지 저장"}
        </Button>
      </StActions>

      <StCardHint>
        팁은 화면에서 쓰지 않아요. 적어 둔 메모를 <b>나중에 클로드가 읽고</b> 주제별로 정리해 채워요.
      </StCardHint>
    </StCard>
  );
}
