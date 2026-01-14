"use client";

import { useState } from "react";
import styled from "styled-components";

interface TagInputProps {
  label?: string;
  placeholder?: string;
  tags: string[]; // 현재 입력된 태그 목록
  onChange: (tags: string[]) => void; // 변경 시 부모에게 알림
}

export default function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중 조합 이벤트 중복 방지 (isComposing)
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const text = inputValue.trim();
      if (text) {
        // 이미 있는 태그인지 체크 (선택사항)
        if (!tags.includes(text)) {
          onChange([...tags, text]);
        }
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // 입력창이 비었을 때 백스페이스 누르면 마지막 태그 삭제
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <StContainer>
      {label && <StLabel>{label}</StLabel>}
      <StInputWrapper
        onClick={(e) => {
          // 래퍼 클릭 시 인풋에 포커스
          const input = e.currentTarget.querySelector("input");
          input?.focus();
        }}
      >
        {tags.map((tag, index) => (
          <StTag key={index}>
            <span>{tag}</span>
            <StRemoveBtn
              onClick={(e) => {
                e.stopPropagation(); // 인풋 포커스 방지
                removeTag(index);
              }}
            >
              ×
            </StRemoveBtn>
          </StTag>
        ))}
        <StInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </StInputWrapper>
    </StContainer>
  );
}

// ✨ 스타일 정의
const StContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.gray500 || "#64748b"};
`;

const StInputWrapper = styled.div`
  width: 100%;
  min-height: 48px;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors?.gray200 || "#e2e8f0"};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  cursor: text;
  transition: all 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors?.gray500 || "#64748b"};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors?.gray100 || "#f1f5f9"};
  }
`;

const StTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: #f1f5f9;
  color: #334155;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  gap: 4px;
`;

const StRemoveBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  padding: 0;
  &:hover {
    color: #ef4444;
  }
`;

const StInput = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 4px 0;
  color: #1e293b;
  &::placeholder {
    color: #cbd5e1;
  }
`;
