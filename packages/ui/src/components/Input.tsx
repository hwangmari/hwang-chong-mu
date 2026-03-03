"use client";

import React from "react";
import styled from "styled-components";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  rightLabel?: React.ReactNode;
  isError?: boolean;
}

export function Input({
  label,
  rightLabel,
  isError = false,
  className,
  ...props
}: InputProps) {
  return (
    <Container className={className}>
      {label && (
        <LabelRow>
          <span className="label-text">{label}</span>
          {rightLabel && <span className="right-label">{rightLabel}</span>}
        </LabelRow>
      )}
      <StyledInput $isError={isError} {...props} />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  & + div {
    margin-top: 1rem;
  }
`;

const LabelRow = styled.label`
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
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 500;
  }
`;

const StyledInput = styled.input<{ $isError: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid
    ${({ theme, $isError }) =>
      $isError ? theme.colors.rose200 : theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray900};
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

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

  &[type="date"] {
    width: 220px;
    text-align: left;
  }
`;
