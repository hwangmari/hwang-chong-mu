import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import { OvertimeRecord, StorageMode } from "@/app/overtime/types";
import { formatMonthLabel } from "@/app/overtime/utils";
import {
  AccordionHeader,
  AccordionHint,
  AccordionSection,
  AccordionToggleButton,
  EmptyItem,
  RecordList,
  SectionTitle,
} from "@/app/overtime/components/styles";
import RecordItemRow from "@/app/overtime/components/RecordItemRow";

interface MonthlyRecordsAccordionProps {
  currentMonth: Date;
  isExpanded: boolean;
  displayedRecords: OvertimeRecord[];
  storageMode: StorageMode;
  serverRoom: OvertimeRoomInfo | null;
  isServerLoading: boolean;
  onToggleExpanded: () => void;
  onEditRecord: (record: OvertimeRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export default function MonthlyRecordsAccordion({
  currentMonth,
  isExpanded,
  displayedRecords,
  storageMode,
  serverRoom,
  isServerLoading,
  onToggleExpanded,
  onEditRecord,
  onDeleteRecord,
}: MonthlyRecordsAccordionProps) {
  return (
    <AccordionSection>
      <AccordionHeader>
        <SectionTitle>
          {formatMonthLabel(currentMonth)} 저장된 야근 기록
        </SectionTitle>
        <AccordionToggleButton type="button" onClick={onToggleExpanded}>
          {isExpanded ? "접기" : "더보기"}
        </AccordionToggleButton>
      </AccordionHeader>
      {isExpanded ? (
        <RecordList>
          {displayedRecords.length === 0 ? (
            <EmptyItem>
              {storageMode === "server" && !serverRoom
                ? "먼저 서버 저장 방을 연결해주세요."
                : "저장된 야근 기록이 없습니다."}
            </EmptyItem>
          ) : (
            displayedRecords.map((record) => (
              <RecordItemRow
                key={record.id}
                record={record}
                showDate
                isDisabled={isServerLoading}
                onEdit={onEditRecord}
                onDelete={onDeleteRecord}
              />
            ))
          )}
        </RecordList>
      ) : (
        <AccordionHint>
          현재 월 기록은 더보기로 펼쳐서 확인할 수 있어요.
        </AccordionHint>
      )}
    </AccordionSection>
  );
}
