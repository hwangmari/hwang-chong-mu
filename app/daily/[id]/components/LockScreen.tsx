"use client";

import { Typography } from "@hwangchongmu/ui";
import {
  BackButton,
  LockActions,
  LockCard,
  LockDescription,
  LockError,
  LockInput,
  NotebookIdText,
  PageContainer,
  UnlockButton,
} from "../page.styles";

interface LockScreenProps {
  notebookId: string;
  accessInput: string;
  accessError: string;
  loadError: string;
  onChangeInput: (value: string) => void;
  onUnlock: () => void;
  onBack: () => void;
}

export default function LockScreen({
  notebookId,
  accessInput,
  accessError,
  loadError,
  onChangeInput,
  onUnlock,
  onBack,
}: LockScreenProps) {
  return (
    <PageContainer>
      <LockCard>
        <Typography variant="h2" className="mb-2">
          🔒 서버 기록장 열기
        </Typography>
        <LockDescription>
          기록장 ID에 연결된 비밀번호를 입력하면 서버에 저장된 기록을 불러옵니다.
        </LockDescription>
        <NotebookIdText>ID: {notebookId}</NotebookIdText>
        <LockInput
          type="password"
          value={accessInput}
          onChange={(event) => onChangeInput(event.target.value)}
          placeholder="비밀번호 입력"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onUnlock();
            }
          }}
        />
        {(accessError || loadError) && (
          <LockError>{accessError || loadError}</LockError>
        )}
        <LockActions>
          <UnlockButton type="button" onClick={onUnlock}>
            기록장 열기
          </UnlockButton>
          <BackButton type="button" onClick={onBack}>
            돌아가기
          </BackButton>
        </LockActions>
      </LockCard>
    </PageContainer>
  );
}
