/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
/** 분리된 파일 임포트 */
import { StCard } from "./ServiceCard.styles";
import { EditView, ReadView } from "./ServiceCardViews";

type BoardData = {
  id: string;
  title: string;
  description: string | null;
};

interface ServiceCardProps {
  board: BoardData;
  isEditing: boolean;
  onEnter: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: string, title: string, desc: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const useCardForm = (
  initialTitle: string,
  initialDesc: string | null,
  isEditing: boolean,
) => {
  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc || "");

  useEffect(() => {
    if (isEditing) {
      setTitle(initialTitle);
      setDesc(initialDesc || "");
    }
  }, [isEditing, initialTitle, initialDesc]);

  return { title, setTitle, desc, setDesc };
};

export default function ServiceCard({
  board,
  isEditing,
  onEnter,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ServiceCardProps) {
  const { title, setTitle, desc, setDesc } = useCardForm(
    board.title,
    board.description,
    isEditing,
  );

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!title.trim()) return alert("제목을 입력해주세요.");
    await onSave(board.id, title, desc);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(board.id);
  };

  return (
    <StCard $isEditing={isEditing} onClick={() => !isEditing && onEnter()}>
      {isEditing ? (
        <EditView
          title={title}
          desc={desc}
          onTitleChange={setTitle}
          onDescChange={setDesc}
          onSave={handleSave}
          onCancel={(e) => {
            e.stopPropagation();
            onCancelEdit();
          }}
        />
      ) : (
        <ReadView
          title={board.title}
          desc={board.description}
          onStartEdit={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          onDelete={handleDelete}
        />
      )}
    </StCard>
  );
}
