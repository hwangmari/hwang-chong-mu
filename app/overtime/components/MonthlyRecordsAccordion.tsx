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
          {isExpanded ? "접기" : "펼치기"}
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
        <AccordionHint>지금은 목록을 접어 둔 상태예요.</AccordionHint>
      )}
    </AccordionSection>
  );
}
