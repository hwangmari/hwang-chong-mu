import React from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  StInput,
  StTextarea,
  StButton,
  StIconButton,
} from "./ServiceCard.styles";

// --- 수정 모드 UI ---
interface EditViewProps {
  title: string;
  desc: string;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onSave: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
}

export const EditView = ({
  title,
  desc,
  onTitleChange,
  onDescChange,
  onSave,
  onCancel,
}: EditViewProps) => (
  <>
    <div className="card-header">
      <StInput
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="제목 입력"
        autoFocus
      />
    </div>
    <StTextarea
      value={desc}
      onChange={(e) => onDescChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      placeholder="설명 입력"
      rows={2}
    />
    <div className="footer">
      <div className="actions">
        <StButton $variant="secondary" onClick={onCancel}>
          취소
        </StButton>
        <StButton $variant="primary" onClick={onSave}>
          저장
        </StButton>
      </div>
    </div>
  </>
);

// --- 조회 모드 UI ---
interface ReadViewProps {
  title: string;
  desc: string | null;
  onStartEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ReadView = ({
  title,
  desc,
  onStartEdit,
  onDelete,
}: ReadViewProps) => (
  <>
    <div className="card-header">
      <h3>{title}</h3>
    </div>
    <p className="desc">{desc || "설명 없음"}</p>
    <div className="footer">
      <div className="view-actions">
        <span className="arrow">
          입장하기 <ArrowForwardIcon fontSize="inherit" />
        </span>
        <div className="btn-group">
          <StIconButton onClick={onStartEdit}>수정</StIconButton>
          <StIconButton $isDelete onClick={onDelete}>
            삭제
          </StIconButton>
        </div>
      </div>
    </div>
  </>
);
