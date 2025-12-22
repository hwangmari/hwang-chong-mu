"use client";

import styled, { css } from "styled-components";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { UserVote } from "@/types";

interface Props {
  participants: UserVote[];
  onEdit: (user: UserVote) => void;
  onDelete: (user: UserVote) => void;
}

export default function ParticipantList({
  participants,
  onEdit,
  onDelete,
}: Props) {
  return (
    <StParticipantSection>
      <StSectionTitle>
        <PeopleIcon className="w-5 h-5 mr-1" /> 참여 현황 ({participants.length}
        명)
      </StSectionTitle>

      {participants.length === 0 ? (
        <StEmptyState>등록된 일정 없음</StEmptyState>
      ) : (
        participants.map((user, idx) => (
          <StUserCard
            key={idx}
            $isAbsent={user.isAbsent}
            onClick={() => onEdit(user)}
            className="group"
          >
            <StUserInfo>
              <StAvatar $isAbsent={user.isAbsent}>
                {user.name.slice(0, 1)}
              </StAvatar>
              <StUserName $isAbsent={user.isAbsent}>{user.name}</StUserName>
            </StUserInfo>

            <div className="flex items-center gap-2">
              <StEditLabel className="edit-label">수정</StEditLabel>

              {user.isAbsent ? (
                <StStatusBadge $status="absent">불참 🥲</StStatusBadge>
              ) : (
                <StStatusBadge $status="unavailable">
                  {user.unavailableDates.length}일 불가
                </StStatusBadge>
              )}
            </div>

            <StDeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="delete-btn"
            >
              <DeleteOutlineIcon sx={{ fontSize: 20 }} />{" "}
            </StDeleteButton>
          </StUserCard>
        ))
      )}
    </StParticipantSection>
  );
}

const StParticipantSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

const StSectionTitle = styled.h3`
  display: flex;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;
  font-size: 0.875rem;
  align-items: center;
`;

const StEmptyState = styled.div`
  text-align: center;
  padding: 1.5rem;
  color: ${({ theme }) => theme.colors.gray400};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 1rem;
  font-size: 0.875rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
`;

const StUserCard = styled.div<{ $isAbsent: boolean }>`
  position: relative;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 0.75rem;
  padding-right: 2rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          border-color: ${theme.colors.gray100};
          opacity: 0.6;
        `
      : css`
          border-color: ${theme.colors.gray100};
          &:hover {
            border-color: ${theme.colors.gray400};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `}

  &:hover .edit-label,
  &:hover .delete-btn {
    opacity: 1;
  }
`;

const StUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex: 1;
`;

const StAvatar = styled.div<{ $isAbsent: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;

  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray400};
        `
      : css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue600};
        `}
`;

const StUserName = styled.span<{ $isAbsent: boolean }>`
  font-weight: 700;
  font-size: 0.875rem;
  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          color: ${theme.colors.gray400};
          text-decoration: line-through;
        `
      : css`
          color: ${theme.colors.gray700};
        `}
`;

const StEditLabel = styled.button`
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0 0.5rem;
`;

const StStatusBadge = styled.span<{ $status: "absent" | "unavailable" }>`
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;

  ${({ $status, theme }) =>
    $status === "absent"
      ? css`
          color: ${theme.colors.gray400};
          background-color: ${theme.colors.gray50};
          border: 1px solid ${theme.colors.gray100};
        `
      : css`
          color: ${theme.colors.gray500};
          background-color: ${theme.colors.gray100};
        `}
`;

const StDeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: ${({ theme }) => theme.colors.gray300};
  opacity: 0;
  transition: all 0.2s;
  padding: 0.25rem;
  &:hover {
    color: #ef4444;
  }
`;
