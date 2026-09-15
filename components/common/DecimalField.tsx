"use client";

import { useState, type ComponentType, type InputHTMLAttributes } from "react";
import { onlyDecimal } from "@/utils/number";

// 숫자(소수 허용)를 글자 칸으로 받되, 입력 중인 "62." 같은 글자를 잠시 들고 있다가 숫자로 넘긴다.
// 글자 칸은 값이 숫자 상태로 바로 바뀌면 점이 사라져 62.5를 칠 수 없기 때문 (2026-09-15).
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number; // 저장된 숫자 (0이면 빈 칸)
  onCommit: (next: number) => void;
  as?: ComponentType<InputHTMLAttributes<HTMLInputElement>>; // 화면마다 쓰는 styled input
};

export default function DecimalField({ value, onCommit, as: Input = "input" as unknown as ComponentType<InputHTMLAttributes<HTMLInputElement>>, ...rest }: Props) {
  const [text, setText] = useState(value ? String(value) : "");
  const [seen, setSeen] = useState(value);

  // 밖에서 값이 바뀌면(루틴 불러오기 등) 글자도 맞춘다. 입력 중인 글자와 같은 숫자면 건드리지 않는다.
  // (효과가 아니라 그리는 중에 맞추는 React 권장 방식)
  if (value !== seen) {
    setSeen(value);
    if ((Number(text) || 0) !== value) setText(value ? String(value) : "");
  }

  return (
    <Input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const next = onlyDecimal(e.target.value);
        setText(next);
        const n = Number(next) || 0;
        if (n !== value) onCommit(n);
      }}
    />
  );
}
