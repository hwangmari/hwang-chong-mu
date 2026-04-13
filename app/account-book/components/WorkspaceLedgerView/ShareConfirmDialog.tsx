"use client";

import {
  StShareConfirmActions,
  StShareConfirmBackdrop,
  StShareConfirmCard,
  StShareConfirmDescription,
  StShareConfirmEyebrow,
  StShareConfirmTitle,
  StShareGhostButton,
  StSharePrimaryButton,
} from "./WorkspaceLedgerView.styles";

type ShareConfirmDialogProps = {
  targetWorkspaceName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ShareConfirmDialog({
  targetWorkspaceName,
  onCancel,
  onConfirm,
}: ShareConfirmDialogProps) {
  return (
    <StShareConfirmBackdrop onClick={onCancel}>
      <StShareConfirmCard onClick={(event) => event.stopPropagation()}>
        <StShareConfirmEyebrow>Share</StShareConfirmEyebrow>
        <StShareConfirmTitle>공유하겠습니까?</StShareConfirmTitle>
        <StShareConfirmDescription>
          이 내역을 {targetWorkspaceName}에 공유하면 공용방에서도 바로 확인할 수
          있습니다.
        </StShareConfirmDescription>
        <StShareConfirmActions>
          <StShareGhostButton type="button" onClick={onCancel}>
            취소
          </StShareGhostButton>
          <StSharePrimaryButton type="button" onClick={onConfirm}>
            공유하기
          </StSharePrimaryButton>
        </StShareConfirmActions>
      </StShareConfirmCard>
    </StShareConfirmBackdrop>
  );
}
