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
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const text = inputValue.trim();
      if (text) {
        if (!tags.includes(text)) {
          onChange([...tags, text]);
        }
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
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

const StContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.gray500 || theme.colors.gray500};
`;

const StInputWrapper = styled.div`
  width: 100%;
  min-height: 48px;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors?.gray200 || theme.colors.gray200};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  cursor: text;
  transition: all 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors?.gray500 || theme.colors.gray500};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors?.gray100 || theme.colors.gray100};
  }
`;

const StTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
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
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  padding: 0;
  &:hover {
    color: ${({ theme }) => theme.colors.rose500};
  }
`;

const StInput = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 4px 0;
  color: ${({ theme }) => theme.colors.gray800};
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }
`;
