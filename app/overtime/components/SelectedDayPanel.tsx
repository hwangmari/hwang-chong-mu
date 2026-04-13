import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import {
  DayBucket,
  OvertimeRecord,
  StorageMode,
} from "@/app/overtime/types";
import { formatDisplayDate } from "@/app/overtime/utils";
import {
  CompactInput,
  DurationCard,
  DurationInputs,
  EditCancelButton,
  EmptyItem,
  FieldLabel,
  PrimaryButton,
  QuickAddCard,
  QuickAddHeader,
  QuickAddTitle,
  RecordList,
  SelectedDatePanel,
  SplitGrid,
  UnitText,
} from "@/app/overtime/components/styles";
import RecordItemRow from "@/app/overtime/components/RecordItemRow";

interface SelectedDayPanelProps {
  selectedDate: string;
  selectedDateBucket?: DayBucket;
  editingRecordId: string | null;
  quickBefore10Hours: string;
  quickBefore10Minutes: string;
  quickAfter10Hours: string;
  quickAfter10Minutes: string;
  storageMode: StorageMode;
  serverRoom: OvertimeRoomInfo | null;
  isServerLoading: boolean;
  onResetQuickAddForm: () => void;
  onEditRecord: (record: OvertimeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onChangeQuickBefore10Hours: (value: string) => void;
  onChangeQuickBefore10Minutes: (value: string) => void;
  onChangeQuickAfter10Hours: (value: string) => void;
  onChangeQuickAfter10Minutes: (value: string) => void;
  onNormalizeQuickBefore10: () => void;
  onNormalizeQuickAfter10: () => void;
  onSaveQuickRecord: () => void;
}

export default function SelectedDayPanel({
  selectedDate,
  selectedDateBucket,
  editingRecordId,
  quickBefore10Hours,
  quickBefore10Minutes,
  quickAfter10Hours,
  quickAfter10Minutes,
  storageMode,
  serverRoom,
  isServerLoading,
  onResetQuickAddForm,
  onEditRecord,
  onDeleteRecord,
  onChangeQuickBefore10Hours,
  onChangeQuickBefore10Minutes,
  onChangeQuickAfter10Hours,
  onChangeQuickAfter10Minutes,
  onNormalizeQuickBefore10,
  onNormalizeQuickAfter10,
  onSaveQuickRecord,
}: SelectedDayPanelProps) {
  return (
    <SelectedDatePanel>
      <QuickAddHeader>
        <QuickAddTitle>
          {formatDisplayDate(selectedDate)} -{" "}
          {editingRecordId ? "수정 중" : "새 기록 추가"}
        </QuickAddTitle>
        {editingRecordId && (
          <EditCancelButton type="button" onClick={onResetQuickAddForm}>
            수정 취소
          </EditCancelButton>
        )}
      </QuickAddHeader>
      <QuickAddCard>
        {selectedDateBucket ? (
          <RecordList>
            {selectedDateBucket.records.map((record) => (
              <RecordItemRow
                key={record.id}
                record={record}
                isDisabled={isServerLoading}
                onEdit={onEditRecord}
                onDelete={onDeleteRecord}
              />
            ))}
          </RecordList>
        ) : (
          <EmptyItem>
            {storageMode === "server" && !serverRoom
              ? "먼저 서버 저장 방을 연결해주세요."
              : "선택한 날짜에 저장된 야근 기록이 없습니다."}
          </EmptyItem>
        )}

        <SplitGrid>
          <DurationCard>
            <FieldLabel>10시 전 야근</FieldLabel>
            <DurationInputs>
              <CompactInput
                type="text"
                min="0"
                placeholder="시간"
                value={quickBefore10Hours}
                onChange={(event) =>
                  onChangeQuickBefore10Hours(event.target.value)
                }
              />
              <UnitText>시간</UnitText>
              <CompactInput
                type="text"
                min="0"
                placeholder="분"
                value={quickBefore10Minutes}
                onChange={(event) =>
                  onChangeQuickBefore10Minutes(event.target.value)
                }
                onBlur={onNormalizeQuickBefore10}
              />
              <UnitText>분</UnitText>
            </DurationInputs>
          </DurationCard>

          <DurationCard>
            <FieldLabel>10시 이후 야근</FieldLabel>
            <DurationInputs>
              <CompactInput
                type="text"
                min="0"
                placeholder="시간"
                value={quickAfter10Hours}
                onChange={(event) =>
                  onChangeQuickAfter10Hours(event.target.value)
                }
              />
              <UnitText>시간</UnitText>
              <CompactInput
                type="text"
                min="0"
                placeholder="분"
                value={quickAfter10Minutes}
                onChange={(event) =>
                  onChangeQuickAfter10Minutes(event.target.value)
                }
                onBlur={onNormalizeQuickAfter10}
              />
              <UnitText>분</UnitText>
            </DurationInputs>
          </DurationCard>
        </SplitGrid>

        <PrimaryButton
          type="button"
          onClick={onSaveQuickRecord}
          disabled={
            isServerLoading || (storageMode === "server" && !serverRoom)
          }
        >
          {editingRecordId
            ? `${formatDisplayDate(selectedDate)} 수정 저장하기`
            : `${formatDisplayDate(selectedDate)}에 추가하기`}
        </PrimaryButton>
      </QuickAddCard>
    </SelectedDatePanel>
  );
}
