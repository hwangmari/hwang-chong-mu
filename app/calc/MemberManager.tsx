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
      <StHeaderRow>
        <StSectionTitle>
          👥 참여 멤버 <span>{members.length}</span>
        </StSectionTitle>
        <ShareButton />
      </StHeaderRow>

      <StFlexRow>
        {/* 입력 그룹을 상단으로 배치 */}
        <StInputGroup>
          <StInput
            placeholder="이름 추가 (예: 황총무)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") handleAdd();
            }}
          />
          <StAddButton onClick={handleAdd}>추가</StAddButton>
        </StInputGroup>

        {/* 멤버 태그 리스트 */}
        <StTags>
          {members.length === 0 ? (
            <StEmptyMsg>함께 정산할 멤버를 추가해 보세요!</StEmptyMsg>
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
      </StFlexRow>
    </StSection>
  );
}

const StHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  span {
    color: ${({ theme }) => theme.semantic.primary};
    margin-left: 0.25rem;
  }
`;

const StFlexRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  font-size: 0.95rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  &:focus {
    background-color: white;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StAddButton = styled.button`
  background-color: ${({ theme }) => theme.colors.gray800};
  color: white;
  padding: 0 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
`;

const StTags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StTag = styled.span`
  background-color: white;
  color: ${({ theme }) => theme.colors.gray700};
  padding: 0.4rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StDeleteMemberBtn = styled.button`
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 1rem;
  &:hover {
    color: ${({ theme }) => theme.semantic.danger};
  }
`;

const StEmptyMsg = styled.div`
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.85rem;
  padding: 0.5rem 0;
`;
