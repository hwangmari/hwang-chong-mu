"use client";

import { THEME_COLOR } from "../helpers";
import {
  AccessButton,
  AccessHeader,
  AccessInput,
  AccessModal,
  AccessModalActions,
  AccessModalCancel,
  AccessModalDesc,
  AccessModalOverlay,
  AccessModalTitle,
  AccessNotice,
  AccessStatus,
  AccessTitle,
  AddItemButton,
  ChecklistEditGrid,
  ChecklistEditRow,
  ChecklistInput,
  DeleteItemButton,
  EditorActions,
  EditorHeader,
  EditorTitle,
  SaveChecklistButton,
  SettingsSection,
} from "../page.styles";

interface SettingsModalProps {
  monthLabel: string;
  monthKey: string;
  draftChecklist: string[];
  hasChecklistChanges: boolean;
  nextAccessCode: string;
  accessNotice: string;
  accessNoticeType: "success" | "error" | "";
  onChangeNextAccessCode: (value: string) => void;
  onSubmitAccessCode: () => void;
  onSaveChecklist: () => void;
  onAddChecklistItem: () => void;
  onUpdateChecklistItem: (index: number, value: string) => void;
  onRemoveChecklistItem: (index: number) => void;
  onClose: () => void;
}

export default function SettingsModal({
  monthLabel,
  monthKey,
  draftChecklist,
  hasChecklistChanges,
  nextAccessCode,
  accessNotice,
  accessNoticeType,
  onChangeNextAccessCode,
  onSubmitAccessCode,
  onSaveChecklist,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onRemoveChecklistItem,
  onClose,
}: SettingsModalProps) {
  return (
    <AccessModalOverlay role="presentation" onClick={onClose}>
      <AccessModal
        role="dialog"
        aria-modal="true"
        aria-label="기록장 설정 모달"
        onClick={(event) => event.stopPropagation()}
      >
        <AccessModalTitle>기록장 설정</AccessModalTitle>
        <SettingsSection>
          <AccessHeader>
            <AccessTitle>접근 비밀번호 변경</AccessTitle>
            <AccessStatus $locked>서버 보호 중</AccessStatus>
          </AccessHeader>
          <AccessModalDesc>
            서버 저장소를 사용하므로 비밀번호는 항상 필요합니다. 새 비밀번호는 4자
            이상으로 입력해주세요.
          </AccessModalDesc>
          <AccessInput
            autoFocus
            type="password"
            value={nextAccessCode}
            onChange={(event) => onChangeNextAccessCode(event.target.value)}
            placeholder="새 비밀번호 입력"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmitAccessCode();
              }
            }}
          />
          <AccessModalActions>
            <AccessButton type="button" onClick={onSubmitAccessCode}>
              변경 저장
            </AccessButton>
          </AccessModalActions>
          {accessNotice && (
            <AccessNotice $type={accessNoticeType}>{accessNotice}</AccessNotice>
          )}
        </SettingsSection>

        <SettingsSection>
          <EditorHeader>
            <EditorTitle>{monthLabel} 체크리스트</EditorTitle>
            <EditorActions>
              <AddItemButton type="button" onClick={onAddChecklistItem}>
                + 항목 추가
              </AddItemButton>
              <SaveChecklistButton
                type="button"
                $color={THEME_COLOR}
                onClick={onSaveChecklist}
                disabled={!hasChecklistChanges}
              >
                체크리스트 저장
              </SaveChecklistButton>
            </EditorActions>
          </EditorHeader>

          <ChecklistEditGrid>
            {draftChecklist.map((item, index) => (
              <ChecklistEditRow key={`${monthKey}-${index}`}>
                <ChecklistInput
                  value={item}
                  onChange={(event) =>
                    onUpdateChecklistItem(index, event.target.value)
                  }
                  placeholder={`항목 ${index + 1}`}
                />
                <DeleteItemButton
                  type="button"
                  onClick={() => onRemoveChecklistItem(index)}
                  disabled={draftChecklist.length <= 1}
                >
                  삭제
                </DeleteItemButton>
              </ChecklistEditRow>
            ))}
          </ChecklistEditGrid>
        </SettingsSection>

        <AccessModalActions>
          <AccessModalCancel type="button" onClick={onClose}>
            닫기
          </AccessModalCancel>
        </AccessModalActions>
      </AccessModal>
    </AccessModalOverlay>
  );
}
