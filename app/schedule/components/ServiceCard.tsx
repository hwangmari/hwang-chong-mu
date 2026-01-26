/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";

// 보드 타입 (필요한 필드만)
type BoardData = {
  id: string;
  title: string;
  description: string | null;
};

interface ServiceCardProps {
  board: BoardData;
  isEditing: boolean;
  onEnter: () => void; // 입장 (클릭)
  onStartEdit: () => void; // 수정 모드 시작
  onCancelEdit: () => void; // 수정 취소
  onSave: (id: string, title: string, desc: string) => Promise<void>; // 저장
  onDelete: (id: string) => Promise<void>; // 삭제
}

export default function ServiceCard({
  board,
  isEditing,
  onEnter,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ServiceCardProps) {
  // ✨ 로컬 입력 상태 (부모에서 분리됨!)
  const [localTitle, setLocalTitle] = useState(board.title);
  const [localDesc, setLocalDesc] = useState(board.description || "");

  // 수정 모드가 켜질 때, 현재 보드 데이터로 초기화
  useEffect(() => {
    if (isEditing) {
      setLocalTitle(board.title);
      setLocalDesc(board.description || "");
    }
  }, [isEditing, board]);

  // 저장 핸들러
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localTitle.trim()) return alert("제목을 입력해주세요.");
    await onSave(board.id, localTitle, localDesc);
  };

  // 삭제 핸들러
  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(board.id);
  };

  return (
    <StCard
      $color="#111827"
      $isEditing={isEditing}
      onClick={() => !isEditing && onEnter()}
    >
      <div className="card-header">
        <StColorDot $color="#3b82f6" />

        {isEditing ? (
          <input
            className="edit-input-title"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="제목 입력"
            autoFocus
          />
        ) : (
          <h3>{board.title}</h3>
        )}
      </div>

      {isEditing ? (
        <textarea
          className="edit-input-desc"
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="설명 입력"
          rows={2}
        />
      ) : (
        <p className="desc">{board.description || "설명 없음"}</p>
      )}

      <div className="footer">
        {isEditing ? (
          <div className="edit-actions">
            <button
              className="btn-cancel"
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
            >
              취소
            </button>
            <button className="btn-save" onClick={handleSaveClick}>
              저장
            </button>
          </div>
        ) : (
          <div className="view-actions">
            <div className="arrow">입장하기 →</div>
            <div>
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit();
                }}
              >
                수정
              </button>
              <button className="btn-icon delete" onClick={handleDeleteClick}>
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </StCard>
  );
}

// --- 스타일 (기존 StServiceCard, StColorDot 이동) ---

const StColorDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
`;

const StCard = styled.div<{ $color: string; $isEditing: boolean }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: ${({ $isEditing }) => ($isEditing ? "default" : "pointer")};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  ${({ $isEditing, $color }) =>
    !$isEditing &&
    css`
      &:hover {
        border-color: ${$color};
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        h3 {
          color: ${$color};
        }
      }
    `}

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0.75rem;
    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
      transition: color 0.2s;
      flex: 1;
    }
    .edit-input-title {
      flex: 1;
      font-size: 1.1rem;
      font-weight: 700;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 4px 8px;
      &:focus {
        outline: 2px solid #3b82f6;
        border-color: transparent;
      }
    }
  }

  .desc {
    color: #4b5563;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 2rem;
    min-height: 2.7rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .edit-input-desc {
    width: 100%;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    resize: none;
    &:focus {
      outline: 2px solid #3b82f6;
      border-color: transparent;
    }
  }

  .footer {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    .edit-actions {
      display: flex;
      gap: 8px;
      button {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-cancel {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
        &:hover {
          background: #e5e7eb;
        }
      }
      .btn-save {
        background: #111827;
        color: white;
        border: none;
        &:hover {
          background: black;
        }
      }
    }
    .view-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      .btn-icon {
        background: none;
        border: none;
        font-size: 0.8rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        transition: all 0.2s;
        &:hover {
          background: #f3f4f6;
          color: #374151;
        }
        &.delete:hover {
          background: #fee2e2;
          color: #ef4444;
        }
      }
      .arrow {
        font-size: 0.75rem;
        color: #9ca3af;
      }
    }
  }
`;
