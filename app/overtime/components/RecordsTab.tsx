import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import {
  CalendarDay,
  DayBucket,
  OvertimeRecord,
  OvertimeSummary,
  StorageMode,
} from "@/app/overtime/types";
import {
  AccordionHeader,
  AccordionHint,
  AccordionSection,
  AccordionToggleButton,
  CalendarCellButton,
  CalendarDayNumber,
  CalendarDaySummary,
  CalendarGrid,
  CalendarMonthLabel,
  CalendarNavButton,
  CalendarPlaceholder,
  CalendarToolbar,
  CalendarToolbarMain,
  CompactInput,
  DangerButton,
  DeleteButton,
  DurationCard,
  DurationInputs,
  EditButton,
  EditCancelButton,
  EmptyItem,
  FieldLabel,
  PrimaryButton,
  QuickAddCard,
  QuickAddHeader,
  QuickAddTitle,
  RecordActions,
  RecordInfo,
  RecordItem,
  RecordList,
  ResultBox,
  SectionDivider,
  SectionHeader,
  SectionTitle,
  SelectedDatePanel,
  SplitGrid,
  StatCard,
  StatsRow,
  TabPanel,
  TodayButton,
  UnitText,
  WeekdayCell,
  WeekdayRow,
  WeekendToggleButton,
  MutedPrefix,
} from "@/app/overtime/components/styles";
import {
  formatCompactDuration,
  formatDayValue,
  formatDisplayDate,
  formatMonthLabel,
  formatRawDuration,
} from "@/app/overtime/utils";
import StorageModeCard from "@/app/overtime/components/StorageModeCard";
import TargetGuideCard from "@/app/overtime/components/TargetGuideCard";

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
  recordsLength: number;
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
  recordsLength,
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
      <StatsRow>
        <StatCard>
          <span>{formatMonthLabel(currentMonth)} 기록</span>
          <strong>{monthlyRecordCount}건</strong>
        </StatCard>
        <StatCard>
          <span>누적 야근시간</span>
          <strong>{formatRawDuration(recordSummary.totalRawMinutes)}</strong>
        </StatCard>
        <StatCard>
          <span>사용 가능 일수</span>
          <strong>{formatDayValue(recordSummary.usableDays)}</strong>
        </StatCard>
      </StatsRow>

      {recordSummary.totalRawMinutes > 0 && (
        <TargetGuideCard
          targetDays={targetUsableDays}
          before10Minutes={targetDayGuide.before10Minutes}
          after10Minutes={targetDayGuide.after10Minutes}
          isReached={targetDayGuide.isReached}
          onChangeTargetDays={onChangeTargetUsableDays}
        />
      )}

      <ResultBox>{recordResult}</ResultBox>

      <SectionDivider />

      <SectionHeader>
        <SectionTitle>야근 기록 캘린더</SectionTitle>
        <CalendarToolbar>
          <CalendarToolbarMain>
            <CalendarNavButton type="button" onClick={() => onMoveMonth(-1)}>
              이전
            </CalendarNavButton>
            <CalendarMonthLabel>{formatMonthLabel(currentMonth)}</CalendarMonthLabel>
            <CalendarNavButton type="button" onClick={() => onMoveMonth(1)}>
              다음
            </CalendarNavButton>
            <TodayButton type="button" onClick={onGoToday}>
              오늘
            </TodayButton>
          </CalendarToolbarMain>
          <WeekendToggleButton
            type="button"
            $isActive={showWeekends}
            onClick={onToggleWeekends}
          >
            주말 {showWeekends ? "ON" : "OFF"}
          </WeekendToggleButton>
        </CalendarToolbar>
      </SectionHeader>

      <WeekdayRow $columns={visibleWeekdays.length}>
        {visibleWeekdays.map((weekday) => (
          <WeekdayCell key={weekday}>{weekday}</WeekdayCell>
        ))}
      </WeekdayRow>

      <CalendarGrid $columns={visibleWeekdays.length}>
        {calendarWeeks.flatMap((week, weekIndex) =>
          week
            .filter(
              (_, weekdayIndex) =>
                showWeekends || (weekdayIndex !== 0 && weekdayIndex !== 6),
            )
            .map((day, dayIndex) => {
              if (!day) {
                return (
                  <CalendarPlaceholder key={`empty-${weekIndex}-${dayIndex}`} />
                );
              }

              const bucket = recordsByDate.get(day.dateKey);

              return (
                <CalendarCellButton
                  key={day.dateKey}
                  type="button"
                  $isCurrentMonth={true}
                  $isSelected={selectedDate === day.dateKey}
                  $isToday={day.isToday}
                  onClick={() => {
                    onSelectDate(day.dateKey);
                    onResetQuickAddForm();
                  }}
                >
                  <CalendarDayNumber>{day.dayNumber}</CalendarDayNumber>
                  {bucket && (
                    <CalendarDaySummary>
                      {bucket.before10Minutes > 0 && (
                        <span>{formatCompactDuration(bucket.before10Minutes)}</span>
                      )}
                      {bucket.after10Minutes > 0 && (
                        <span>{formatCompactDuration(bucket.after10Minutes)}</span>
                      )}
                    </CalendarDaySummary>
                  )}
                </CalendarCellButton>
              );
            }),
        )}
      </CalendarGrid>

      <SelectedDatePanel>
        <QuickAddHeader>
          <QuickAddTitle>
            {formatDisplayDate(selectedDate)} - {editingRecordId ? "수정 중" : "새 기록 추가"}
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
                <RecordItem key={record.id}>
                  <RecordInfo>
                    <span>
                      <MutedPrefix>10시 전</MutedPrefix>
                      {formatRawDuration(record.before10Minutes)}
                    </span>
                    <span>
                      <MutedPrefix>10시 이후</MutedPrefix>
                      {formatRawDuration(record.after10Minutes)}
                    </span>
                  </RecordInfo>
                  <RecordActions>
                    <EditButton
                      type="button"
                      onClick={() => onEditRecord(record)}
                      disabled={isServerLoading}
                    >
                      수정
                    </EditButton>
                    <DeleteButton
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      disabled={isServerLoading}
                    >
                      삭제
                    </DeleteButton>
                  </RecordActions>
                </RecordItem>
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
            disabled={isServerLoading || (storageMode === "server" && !serverRoom)}
          >
            {editingRecordId
              ? `${formatDisplayDate(selectedDate)} 수정 저장하기`
              : `${formatDisplayDate(selectedDate)}에 추가하기`}
          </PrimaryButton>
        </QuickAddCard>
      </SelectedDatePanel>

      <SectionDivider />

      <AccordionSection>
        <AccordionHeader>
          <SectionTitle>{formatMonthLabel(currentMonth)} 저장된 야근 기록</SectionTitle>
          <AccordionToggleButton type="button" onClick={onToggleRecordsExpanded}>
            {isRecordsExpanded ? "접기" : "더보기"}
          </AccordionToggleButton>
        </AccordionHeader>
        {isRecordsExpanded ? (
          <RecordList>
            {displayedRecords.length === 0 ? (
              <EmptyItem>
                {storageMode === "server" && !serverRoom
                  ? "먼저 서버 저장 방을 연결해주세요."
                  : "저장된 야근 기록이 없습니다."}
              </EmptyItem>
            ) : (
              displayedRecords.map((record) => (
                <RecordItem key={record.id}>
                  <RecordInfo>
                    <strong>{record.date}</strong>
                    <span>
                      <MutedPrefix>10시 전</MutedPrefix>
                      {formatRawDuration(record.before10Minutes)}
                    </span>
                    <span>
                      <MutedPrefix>10시 이후</MutedPrefix>
                      {formatRawDuration(record.after10Minutes)}
                    </span>
                  </RecordInfo>
                  <RecordActions>
                    <EditButton
                      type="button"
                      onClick={() => onEditRecord(record)}
                      disabled={isServerLoading}
                    >
                      수정
                    </EditButton>
                    <DeleteButton
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      disabled={isServerLoading}
                    >
                      삭제
                    </DeleteButton>
                  </RecordActions>
                </RecordItem>
              ))
            )}
          </RecordList>
        ) : (
          <AccordionHint>현재 월 기록은 더보기로 펼쳐서 확인할 수 있어요.</AccordionHint>
        )}
      </AccordionSection>

      <DangerButton
        type="button"
        onClick={onClearRecords}
        disabled={recordsLength === 0 || isServerLoading}
      >
        전체 기록 초기화
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
