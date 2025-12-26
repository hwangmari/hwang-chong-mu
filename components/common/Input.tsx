"use client";

import styled, { css } from "styled-components";

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode; // 라벨 텍스트 (옵션)
  rightLabel?: React.ReactNode; // 라벨 우측에 들어갈 부가 정보 (예: 자동 3주 설정됨)
  isError?: boolean; // 에러 상태 여부
}

export default function Input({
  label,
  rightLabel,
  isError = false,
  className,
  ...props
}: BaseInputProps) {
  return (
    <StContainer className={className}>
      {/* 라벨이 있을 때만 렌더링 */}
      {label && (
        <StLabelRow>
          <span className="label-text">{label}</span>
          {rightLabel && <span className="right-label">{rightLabel}</span>}
        </StLabelRow>
      )}

      <StInput $isError={isError} {...props} />
    </StContainer>
  );
}

// ✨ 스타일 정의

const StContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 라벨과 인풋 사이 간격 */
`;

const StLabelRow = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray500};
  }

  .right-label {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray200}; /* 포인트 컬러 */
    font-weight: 500;
  }
`;

const StInput = styled.input<{ $isError: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid
    ${({ theme, $isError }) =>
      $isError ? theme.colors.rose200 : theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray900};
  outline: none;
  transition: all 0.2s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.gray500};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.gray100};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray50};
    color: ${({ theme }) => theme.colors.gray400};
    cursor: not-allowed;
  }

  /* 날짜 입력(date)일 때 텍스트 높이 보정 */
  &[type="date"] {
    font-family: var(--font-pretendard); /* 숫자 폰트 정렬 */
  }
`;
