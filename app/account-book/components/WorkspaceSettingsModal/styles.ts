"use client";

import styled from "styled-components";
import {
  StAbModalBackdrop,
  StAbModalCard as AbModalCard,
  StAbCard,
  StAbSettingsInput,
  StAbApplyButton,
  StAbDangerButton,
  StAbBadge,
  StAbChip,
  StAbCardGrid,
  StAbButtonRow,
  abTokens,
  media,
} from "../shared";

// Re-export shared components with local aliases for backward compatibility
export const StBackdrop = styled(StAbModalBackdrop)`
  z-index: 60;
  backdrop-filter: none;
  background: ${abTokens.color.bgBackdropDark};
  padding: 1rem;
`;

export const StModalCard = styled(AbModalCard)`
  width: min(100%, 72rem);
  max-height: min(88vh, 58rem);
  overflow-y: auto;
  border-radius: ${abTokens.radius.xxl};
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
  color: ${abTokens.color.textDark};
`;

export const StDescription = styled.p`
  margin-top: 0.25rem;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #6e7c90;
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

export const StCardList = StAbCardGrid;

export const StCard = StAbCard;

export const StInput = StAbSettingsInput;

export const StSubTitle = styled.h4`
  font-size: 0.86rem;
  font-weight: 900;
  color: #314157;
`;

export const StMetaText = styled.p`
  font-size: 0.78rem;
  line-height: 1.5;
  color: #6d7b8f;
`;

export const StInlineLabel = styled(StAbBadge).attrs({ $tone: "blue" as const })``;

export const StButtonRow = StAbButtonRow;

export const StParticipantList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;

  ${media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const StParticipantCard = styled.div`
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  background: #fff;
  padding: 0.75rem;
  display: grid;
  gap: 0.5rem;
`;

export const StMemberGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const StMemberChip = StAbChip;

export const StApplyButton = StAbApplyButton;

export const StDangerButton = StAbDangerButton;
