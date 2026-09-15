"use client";

import { StScoreInput } from "../page.styles";

// 점수(게임 수·타이브레이크) 입력 칸. 숫자 전용 글자 필드 — 휴대폰은 숫자 키패드, 스피너 화살표 없음,
// 숫자가 아닌 글자는 바로 지운다. 교류전·토너먼트·일반 대회 카드가 같이 쓴다 (2026-09-15).
type Props = {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  "aria-label": string;
  maxLength?: number; // 기본 2자리
};

export default function ScoreInput({ value, onChange, placeholder, maxLength = 2, ...rest }: Props) {
  return (
    <StScoreInput
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={rest["aria-label"]}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  );
}
