"use client";
import styled from "styled-components";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

interface Props {
  onSave?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
}

export default function CalcHeader({ onSave, onShare, isLoading }: Props) {
  return (
    <StHeader>
      <Link href="/">
        <StBackButton>
          <ArrowBackIosNewIcon style={{ fontSize: "1.2rem" }} />
        </StBackButton>
      </Link>
      <StTitle>💸 황총무 N빵 계산기</StTitle>

      {onShare ? (
        <StShareButton onClick={onShare}>공유</StShareButton>
      ) : onSave ? (
        <StSaveButton onClick={onSave} disabled={isLoading}>
          {isLoading ? "저장 중..." : "저장"}
        </StSaveButton>
      ) : null}
    </StHeader>
  );
}

const StHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 2.5rem; /* 높이 확보 */
`;

const StBackButton = styled.span`
  position: absolute;
  left: 0;
  display: flex; /* 아이콘 중앙 정렬 */
  align-items: center;
  justify-content: center;

  /* ✅ 컬러 및 호버 효과 */
  color: ${({ theme }) => theme.colors.gray400};
  padding: 0.5rem; /* 터치 영역 확보 */
  margin-left: -0.5rem; /* 패딩만큼 왼쪽으로 이동 */
  border-radius: 50%;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
    background-color: ${({ theme }) =>
      theme.colors.gray100}; /* 은은한 배경 추가 */
  }
`;

const StTitle = styled.h1`
  font-size: 1.25rem; /* 헤더에 맞게 살짝 줄임 */
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  margin: 0; /* 기본 마진 제거 */
`;

// ✅ [저장 버튼] - 톤 다운 (더 차분하게)
const StSaveButton = styled.button`
  position: absolute;
  right: 0;
  background-color: ${({ theme }) => theme.colors.gray100}; /* 200 -> 100 */
  color: ${({ theme }) => theme.colors.gray700};
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.gray200}; /* 테두리 추가로 디테일 업 */
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray900};
  }
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

// ✅ [공유 버튼] - 톤 다운 (차분한 고급스러움)
const StShareButton = styled.button`
  position: absolute;
  right: 0;
  /* 쨍한 Teal 대신 차분한 Slate/Indigo 계열 사용 (테마에 slate가 없다면 gray700 or indigo800 대체) */
  background-color: #475569; /* Slate 600 (직접 지정 예시) */
  /* 또는 테마를 사용한다면: background-color: ${({ theme }) =>
    theme.colors.gray700}; */

  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover {
    background-color: #334155; /* Slate 700 */
    /* 또는 테마: background-color: ${({ theme }) => theme.colors.gray800}; */
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: translateY(0);
  }
`;
