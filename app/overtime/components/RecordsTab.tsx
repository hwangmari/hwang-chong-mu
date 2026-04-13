import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import {
  CalendarDay,
  DayBucket,
  OvertimeRecord,
  OvertimeSummary,
  StorageMode,
} from "@/app/overtime/types";
import {
  DangerButton,
  SectionDivider,
  TabPanel,
} from "@/app/overtime/components/styles";
import MonthlyRecordsAccordion from "@/app/overtime/components/MonthlyRecordsAccordion";
import MonthlySummaryStats from "@/app/overtime/components/MonthlySummaryStats";
import OvertimeCalendar from "@/app/overtime/components/OvertimeCalendar";
import SelectedDayPanel from "@/app/overtime/components/SelectedDayPanel";
import StorageModeCard from "@/app/overtime/components/StorageModeCard";

interface RecordsTabProps {
  currentMonth: Date;
  monthlyRecordCount: number;
  recordSummary: OvertimeSummary;
  recordResult: string;
  targetUsableDays: number;
  targetDayGuide: {
    before10Minutes: number;
    after10Minutes: number;
    isReached: boolean;
  };
  visibleWeekdays: string[];
  calendarWeeks: Array<Array<CalendarDay | null>>;
  recordsByDate: Map<string, DayBucket>;
  showWeekends: boolean;
  selectedDate: string;
  selectedDateBucket?: DayBucket;
  quickBefore10Hours: string;
  quickBefore10Minutes: string;
  quickAfter10Hours: string;
  quickAfter10Minutes: string;
  editingRecordId: string | null;
  isRecordsExpanded: boolean;
  displayedRecords: OvertimeRecord[];
  storageMode: StorageMode;
  serverRoom: OvertimeRoomInfo | null;
  roomNameInput: string;
  roomCodeInput: string;
  isServerLoading: boolean;
  onChangeTargetUsableDays: (days: number) => void;
  onMoveMonth: (amount: number) => void;
  onGoToday: () => void;
  onToggleWeekends: () => void;
  onSelectDate: (dateKey: string) => void;
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
  onToggleRecordsExpanded: () => void;
  onClearRecords: () => void;
  onChangeStorageMode: (mode: StorageMode) => void;
  onChangeRoomNameInput: (value: string) => void;
  onChangeRoomCodeInput: (value: string) => void;
  onCreateServerRoom: () => void;
  onConnectServerRoom: () => void;
  onCopyRoomCode: () => void;
  onDisconnectServerRoom: () => void;
}

export default function RecordsTab({
  currentMonth,
  monthlyRecordCount,
  recordSummary,
  recordResult,
  targetUsableDays,
  targetDayGuide,
  visibleWeekdays,
  calendarWeeks,
  recordsByDate,
  showWeekends,
  selectedDate,
  selectedDateBucket,
  quickBefore10Hours,
  quickBefore10Minutes,
  quickAfter10Hours,
  quickAfter10Minutes,
  editingRecordId,
  isRecordsExpanded,
  displayedRecords,
  storageMode,
  serverRoom,
  roomNameInput,
  roomCodeInput,
  isServerLoading,
  onChangeTargetUsableDays,
  onMoveMonth,
  onGoToday,
  onToggleWeekends,
  onSelectDate,
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
  onToggleRecordsExpanded,
  onClearRecords,
  onChangeStorageMode,
  onChangeRoomNameInput,
  onChangeRoomCodeInput,
  onCreateServerRoom,
  onConnectServerRoom,
  onCopyRoomCode,
  onDisconnectServerRoom,
}: RecordsTabProps) {
  return (
    <TabPanel>
      <MonthlySummaryStats
        currentMonth={currentMonth}
        monthlyRecordCount={monthlyRecordCount}
        recordSummary={recordSummary}
        recordResult={recordResult}
        targetUsableDays={targetUsableDays}
        targetDayGuide={targetDayGuide}
        onChangeTargetUsableDays={onChangeTargetUsableDays}
      />

      <SectionDivider />

      <OvertimeCalendar
        currentMonth={currentMonth}
        visibleWeekdays={visibleWeekdays}
        calendarWeeks={calendarWeeks}
        recordsByDate={recordsByDate}
        showWeekends={showWeekends}
        selectedDate={selectedDate}
        onMoveMonth={onMoveMonth}
        onGoToday={onGoToday}
        onToggleWeekends={onToggleWeekends}
        onSelectDate={onSelectDate}
        onResetQuickAddForm={onResetQuickAddForm}
      />

      <SelectedDayPanel
        selectedDate={selectedDate}
        selectedDateBucket={selectedDateBucket}
        editingRecordId={editingRecordId}
        quickBefore10Hours={quickBefore10Hours}
        quickBefore10Minutes={quickBefore10Minutes}
        quickAfter10Hours={quickAfter10Hours}
        quickAfter10Minutes={quickAfter10Minutes}
        storageMode={storageMode}
        serverRoom={serverRoom}
        isServerLoading={isServerLoading}
        onResetQuickAddForm={onResetQuickAddForm}
        onEditRecord={onEditRecord}
        onDeleteRecord={onDeleteRecord}
        onChangeQuickBefore10Hours={onChangeQuickBefore10Hours}
        onChangeQuickBefore10Minutes={onChangeQuickBefore10Minutes}
        onChangeQuickAfter10Hours={onChangeQuickAfter10Hours}
        onChangeQuickAfter10Minutes={onChangeQuickAfter10Minutes}
        onNormalizeQuickBefore10={onNormalizeQuickBefore10}
        onNormalizeQuickAfter10={onNormalizeQuickAfter10}
        onSaveQuickRecord={onSaveQuickRecord}
      />

      <SectionDivider />

      <MonthlyRecordsAccordion
        currentMonth={currentMonth}
        isExpanded={isRecordsExpanded}
        displayedRecords={displayedRecords}
        storageMode={storageMode}
        serverRoom={serverRoom}
        isServerLoading={isServerLoading}
        onToggleExpanded={onToggleRecordsExpanded}
        onEditRecord={onEditRecord}
        onDeleteRecord={onDeleteRecord}
      />

      <DangerButton
        type="button"
        onClick={onClearRecords}
        disabled={monthlyRecordCount === 0 || isServerLoading}
      >
        현재 월 기록 초기화
      </DangerButton>

      <StorageModeCard
        storageMode={storageMode}
        serverRoom={serverRoom}
        roomNameInput={roomNameInput}
        roomCodeInput={roomCodeInput}
        isServerLoading={isServerLoading}
        onChangeStorageMode={onChangeStorageMode}
        onChangeRoomNameInput={onChangeRoomNameInput}
        onChangeRoomCodeInput={onChangeRoomCodeInput}
        onCreateServerRoom={onCreateServerRoom}
        onConnectServerRoom={onConnectServerRoom}
        onCopyRoomCode={onCopyRoomCode}
        onDisconnectServerRoom={onDisconnectServerRoom}
      />
    </TabPanel>
  );
}
