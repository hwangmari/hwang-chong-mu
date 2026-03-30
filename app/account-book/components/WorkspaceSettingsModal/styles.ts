"use client";

import styled from "styled-components";

export const StBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 60;
`;

export const StModalCard = styled.section`
  width: min(100%, 72rem);
  max-height: min(88vh, 58rem);
  overflow-y: auto;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #d9e4ef;
  padding: 1.1rem;
`;

export const StHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;
`;

export const StTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 900;
  color: #1f2937;
`;

export const StDescription = styled.p`
  margin-top: 0.25rem;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #6e7c90;
`;

export const StCloseButton = styled.button`
  border: none;
  background: #f4f7fb;
  color: #607086;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 800;
`;

export const StSection = styled.section`
  margin-top: 1rem;
`;

export const StSectionTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 900;
  color: #314157;
  margin-bottom: 0.65rem;
`;

export const StCardList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const StCard = styled.div`
  border: 1px solid #dce5f0;
  border-radius: 18px;
  background: #f9fbff;
  padding: 0.85rem;
  display: grid;
  gap: 0.55rem;
`;

export const StInput = styled.input`
  width: 100%;
  border: 1px solid #d5deea;
  border-radius: 12px;
  background: #fff;
  padding: 0.75rem 0.85rem;
  font-size: 0.86rem;
  color: #1f2937;
`;

export const StMemberGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const StMemberChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#8aa7fb" : "#d9e4f1")};
  background: ${({ $active }) => ($active ? "#eaf1ff" : "#fff")};
  color: ${({ $active }) => ($active ? "#3657b5" : "#66758b")};
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.76rem;
  font-weight: 800;
`;

export const StApplyButton = styled.button`
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #607de0, #4b69c8);
  color: #fff;
  padding: 0.75rem 0.9rem;
  font-size: 0.84rem;
  font-weight: 800;
`;

export const StDangerButton = styled.button`
  border: 1px solid #f1c8d6;
  border-radius: 12px;
  background: #fff5f8;
  color: #c44d76;
  padding: 0.75rem 0.9rem;
  font-size: 0.84rem;
  font-weight: 800;
`;
