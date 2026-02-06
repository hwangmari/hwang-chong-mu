import React from "react";
import styled, { css } from "styled-components";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close"; // X 아이콘을 더 깔끔한 것으로 교체 추천

interface TaskHeaderProps {
  title: string;
  titleValue: string;
  hasMemo: boolean;
  showMemo: boolean;
  isReadOnly: boolean;

  onTitleChange: (val: string) => void;
  onTitleBlur: () => void;
  onToggleMemo: () => void;
  onDelete: () => void;
}

const MemoIcon = () => <ChatBubbleOutlineIcon sx={{ fontSize: "1.1rem" }} />;
const DeleteIcon = () => <CloseIcon sx={{ fontSize: "1.2rem" }} />;

export default function TaskHeader({
  title,
  titleValue,
  hasMemo,
  showMemo,
  isReadOnly,
  onTitleChange,
  onTitleBlur,
  onToggleMemo,
  onDelete,
}: TaskHeaderProps) {
  return (
    <StHeaderContainer>
      {isReadOnly ? (
        <>
          <StTitleText title={title}>{title}</StTitleText>
          {hasMemo && (
            <StIconButton
              className={showMemo ? "active" : ""}
              onClick={onToggleMemo}
              title="메모 보기"
              $variant="memo"
            >
              <MemoIcon />
            </StIconButton>
          )}
        </>
      ) : (
        <>
          <StInput
            type="text"
            value={titleValue}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            placeholder="업무명을 입력하세요"
            autoFocus
          />

          <StButtonGroup>
            <StIconButton
              className={hasMemo || showMemo ? "active" : ""}
              onClick={onToggleMemo}
              tabIndex={-1}
              title="메모 입력"
              $variant="memo"
            >
              <MemoIcon />
            </StIconButton>

            <StIconButton onClick={onDelete} title="삭제" $variant="delete">
              <DeleteIcon />
            </StIconButton>
          </StButtonGroup>
        </>
      )}
    </StHeaderContainer>
  );
}


const StHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 양끝 정렬 */
  gap: 12px;
  min-height: 32px;
  margin-bottom: 6px;
  position: relative;
`;

const StTitleText = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151; /* gray-700 */
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 0;
  cursor: default;
`;

const StInput = styled.input`
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827; /* gray-900 */
  border: none;
  background: transparent;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  width: 100%;

  &::placeholder {
    color: rgb(73, 76, 83);
    font-weight: 400;
  }

  &:focus {
    outline: none;
    border-bottom-color: #111827;
  }

  &:hover:not(:focus) {
    border-bottom-color: #e5e7eb;
  }
`;

const StButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/** 버튼 스타일 통합 (variant로 구분) */
const StIconButton = styled.button<{ $variant: "memo" | "delete" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  /* 기본 색상 */
  color: #9ca3af; /* gray-400 */

  &:hover {
    transform: scale(1.1);
  }

  /* --- 메모 버튼 스타일 --- */
  ${({ $variant }) =>
    $variant === "memo" &&
    css`
      &:hover {
        color: #f59e0b; /* amber-500 */
        background-color: #fffbeb; /* amber-50 */
      }
      &.active {
        color: #d97706; /* amber-600 */
        background-color: #fef3c7; /* amber-100 */
      }
    `}

  /* --- 삭제 버튼 스타일 --- */
  ${({ $variant }) =>
    $variant === "delete" &&
    css`
      &:hover {
        color: #ef4444; /* red-500 */
        background-color: #fee2e2; /* red-50 */
      }
    `}
`;
