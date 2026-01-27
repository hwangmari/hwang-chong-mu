import React, { useState, useEffect } from "react";
import { StMemoContainer } from "./TaskList.styles";

interface MemoAreaProps {
  initialMemo: string;
  onUpdate: (memo: string) => void;
  isReadOnly?: boolean;
}

export default function MemoArea({
  initialMemo,
  onUpdate,
  isReadOnly,
}: MemoAreaProps) {
  const [memoValue, setMemoValue] = useState(initialMemo);

  useEffect(() => {
    setMemoValue(initialMemo);
  }, [initialMemo]);

  const handleBlur = () => {
    if (memoValue !== initialMemo) {
      onUpdate(memoValue);
    }
  };

  return (
    <StMemoContainer>
      {isReadOnly ? (
        <p className="memo-text">{memoValue}</p>
      ) : (
        <textarea
          className="memo-input"
          value={memoValue}
          onChange={(e) => setMemoValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="이슈 사항이나 메모를 입력하세요..."
          rows={2}
          autoFocus
        />
      )}
    </StMemoContainer>
  );
}
