"use client";

import { Typography } from "@hwangchongmu/ui";
import { THEME_COLOR } from "../helpers";
import {
  NotebookIdText,
  OpenSettingsButton,
  Subtitle,
  SummaryCard,
  SummaryTitle,
  SummaryValue,
  TopActions,
  TopSection,
} from "../page.styles";

interface NotebookHeaderProps {
  title: string;
  notebookId: string;
  monthLabel: string;
  avgScore: number;
  onOpenSettings: () => void;
}

export default function NotebookHeader({
  title,
  notebookId,
  monthLabel,
  avgScore,
  onOpenSettings,
}: NotebookHeaderProps) {
  return (
    <TopSection>
      <div>
        <Typography variant="h1">{title}</Typography>
        <Subtitle>월별 한 줄 일기와 체크 완료율을 서버에서 관리합니다.</Subtitle>
        <NotebookIdText>ID: {notebookId}</NotebookIdText>
      </div>
      <TopActions>
        <SummaryCard>
          <SummaryTitle>{monthLabel} 평균 달성률</SummaryTitle>
          <SummaryValue $color={THEME_COLOR}>{avgScore}%</SummaryValue>
        </SummaryCard>
        <OpenSettingsButton
          type="button"
          $color={THEME_COLOR}
          onClick={onOpenSettings}
        >
          설정
        </OpenSettingsButton>
      </TopActions>
    </TopSection>
  );
}
