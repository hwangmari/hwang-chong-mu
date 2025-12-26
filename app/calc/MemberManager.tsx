"use client";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { StSection } from "@/components/styled/layout.styled";
import React, { useState } from "react";
import styled from "styled-components";

interface Props {
  members: string[];
  onAddMember: (name: string) => void;
  onDeleteMember: (name: string) => void;
}

export default function MemberManager({
  members,
  onAddMember,
  onDeleteMember,
}: Props) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAddMember(name);
      setName("");
    }
  };

  return (
    <StSection>
      <StSectionTitle>👥 참여 멤버 ({members.length}명)</StSectionTitle>
      <StFixedButton>
        <ShareButton />
      </StFixedButton>
      <StFlexRow>
        <StTags>
          {members.length === 0 ? (
            <StEmptyMsg>정산할 멤버를 추가해주세요.</StEmptyMsg>
          ) : (
            members.map((m) => (
              <StTag key={m}>
                {m}
                <StDeleteMemberBtn onClick={() => onDeleteMember(m)}>
                  ×
                </StDeleteMemberBtn>
              </StTag>
            ))
          )}
        </StTags>
        <StInputGroup>
          <StInput
            placeholder="이름 (예: 황총무)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // ✨ [수정] 한글 조합 중(isComposing)이면 함수 실행을 막습니다.
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") handleAdd();
            }}
          />
          <StButton onClick={handleAdd}>추가</StButton>
        </StInputGroup>
      </StFlexRow>
    </StSection>
  );
}

// ... (스타일 컴포넌트들은 기존과 동일합니다)
const StFixedButton = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
`;
const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
`;
const StFlexRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;
const StTags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 2rem;
  align-items: center;
`;
const StEmptyMsg = styled.span`
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.9rem;
`;
const StTag = styled.span`
  background-color: ${({ theme }) => theme.semantic.primaryLight};
  color: ${({ theme }) => theme.semantic.primary};
  padding: 0.35rem 0.6rem 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
const StDeleteMemberBtn = styled.button`
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.6;
  padding: 0 0.1rem;
  &:hover {
    opacity: 1;
    color: ${({ theme }) => theme.semantic.danger};
  }
`;
const StInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;
const StInput = styled.input`
  padding: 0.875rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  flex: 1;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  background-color: ${({ theme }) => theme.colors.gray50};
  &:focus {
    border-color: ${({ theme }) => theme.semantic.primary};
    background-color: ${({ theme }) => theme.colors.white};
  }
`;
const StButton = styled.button`
  background-color: ${({ theme }) => theme.colors.gray800};
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray900};
  }
`;
