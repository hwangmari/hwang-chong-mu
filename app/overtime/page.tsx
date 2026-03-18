"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
} from "@/components/styled/layout.styled";

type TabKey = "calculator" | "records";

interface OvertimeRecord {
  id: string;
  date: string;
  hours: number;
  minutes: number;
  createdAt: string;
}

const STORAGE_KEY = "nightOvertimeRecords";
const THRESHOLD_MINUTES = 15 * 60;
const QUARTER_DAY_MINUTES = 120;

function createRecordId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayDateInputValue() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
}

function parseNumberInput(value: string) {
  if (!value.trim()) {
    return NaN;
  }

  return Number.parseInt(value, 10);
}

function normalizeDuration(totalMinutes: number) {
  const roundedMinutes = Math.round(totalMinutes);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return { hours, minutes, totalMinutes: roundedMinutes };
}

function formatDuration(totalMinutes: number) {
  const { hours, minutes } = normalizeDuration(totalMinutes);
  return `${hours}시간 ${minutes}분`;
}

function buildRewardMessage(totalWorkedMinutes: number, title: string) {
  if (totalWorkedMinutes <= THRESHOLD_MINUTES) {
    return "💤 아직 보상휴가가 발생하지 않습니다.\n(15시간 초과분부터 적용됩니다.)";
  }

  const rewardMinutes = (totalWorkedMinutes - THRESHOLD_MINUTES) * 1.5;
  const rewardDuration = normalizeDuration(rewardMinutes);
  const rewardDays =
    Math.floor(rewardMinutes / QUARTER_DAY_MINUTES) * 0.25;

  let message = `✅ ${title}:\n📌 총 보상시간: ${rewardDuration.hours}시간 ${rewardDuration.minutes}분\n📌 총 일수 기준: ${rewardDays.toFixed(
    2,
  )}일`;

  const remain = rewardMinutes % QUARTER_DAY_MINUTES;
  if (remain > 0) {
    const needRewardMinutes = QUARTER_DAY_MINUTES - remain;
    const needWorkedMinutes = needRewardMinutes / 1.5;
    const nextDuration = normalizeDuration(needWorkedMinutes);
    message += `\n🕐 다음 ${(rewardDays + 0.25).toFixed(
      2,
    )}일을 채우려면 야근 ${nextDuration.hours}시간 ${nextDuration.minutes}분이 추가로 필요합니다.`;
  }

  return message;
}

function parseStoredRecords(storedValue: string | null) {
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as Array<
      Partial<OvertimeRecord> & {
        date?: string;
        hours?: number;
        minutes?: number;
      }
    >;

    return parsed
      .filter(
        (item) =>
          typeof item?.date === "string" &&
          Number.isFinite(item?.hours) &&
          Number.isFinite(item?.minutes),
      )
      .map((item) => ({
        id: item.id || createRecordId(),
        date: item.date!,
        hours: Number(item.hours),
        minutes: Number(item.minutes),
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
      }));
  } catch (error) {
    console.error("야근 기록을 불러오지 못했습니다.", error);
    return [];
  }
}

const LEAVE_REQUIREMENTS = Array.from({ length: 6 }, (_, index) => {
  const days = index + 1;
  const totalWorkedMinutes = THRESHOLD_MINUTES + (days * 8 * 60) / 1.5;

  return {
    days,
    text: formatDuration(totalWorkedMinutes),
  };
});

export default function OvertimePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const [calcHours, setCalcHours] = useState("");
  const [calcMinutes, setCalcMinutes] = useState("0");
  const [calcTotalMinutes, setCalcTotalMinutes] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [recordDate, setRecordDate] = useState(getTodayDateInputValue);
  const [recordHours, setRecordHours] = useState("");
  const [recordMinutes, setRecordMinutes] = useState("0");
  const [records, setRecords] = useState<OvertimeRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return parseStoredRecords(localStorage.getItem(STORAGE_KEY));
  });

  const totalRecordedMinutes = useMemo(
    () =>
      records.reduce((sum, record) => sum + record.hours * 60 + record.minutes, 0),
    [records],
  );

  const recordResult = useMemo(() => {
    if (records.length === 0) {
      return "저장된 야근 기록이 없습니다.";
    }

    return buildRewardMessage(totalRecordedMinutes, "누적 보상휴가");
  }, [records.length, totalRecordedMinutes]);

  const totalRecordedDuration = useMemo(
    () => formatDuration(totalRecordedMinutes),
    [totalRecordedMinutes],
  );

  const persistRecords = (nextRecords: OvertimeRecord[]) => {
    setRecords(nextRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  };

  const handleCalculate = () => {
    const directMinutes = parseNumberInput(calcTotalMinutes);
    const hours = parseNumberInput(calcHours);
    const minutes = parseNumberInput(calcMinutes);

    const totalMinutes = Number.isNaN(directMinutes)
      ? (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
      : directMinutes;

    if (totalMinutes < 0 || (!Number.isNaN(minutes) && (minutes < 0 || minutes > 59))) {
      alert("유효한 시간을 입력해주세요.");
      return;
    }

    setCalcResult(buildRewardMessage(totalMinutes, "보상휴가"));
  };

  const handleAddRecord = () => {
    const hours = parseNumberInput(recordHours);
    const minutes = parseNumberInput(recordMinutes);

    if (!recordDate) {
      alert("날짜를 입력해주세요.");
      return;
    }

    if (
      Number.isNaN(hours) ||
      hours < 0 ||
      Number.isNaN(minutes) ||
      minutes < 0 ||
      minutes > 59
    ) {
      alert("유효한 시간을 입력해주세요.");
      return;
    }

    if (hours === 0 && minutes === 0) {
      alert("야근 시간은 0보다 커야 합니다.");
      return;
    }

    const nextRecords = [
      ...records,
      {
        id: createRecordId(),
        date: recordDate,
        hours,
        minutes,
        createdAt: new Date().toISOString(),
      },
    ].sort((a, b) => b.date.localeCompare(a.date));

    persistRecords(nextRecords);
    setRecordHours("");
    setRecordMinutes("0");
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) {
      return;
    }

    persistRecords(records.filter((record) => record.id !== id));
  };

  const handleClearRecords = () => {
    if (!window.confirm("모든 기록을 삭제하시겠습니까?")) {
      return;
    }

    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="🌙"
          title="야근 계산기"
          description={
            <>
              15시간 초과분부터 1.5배로 환산해서
              <br />
              보상휴가 기준을 빠르게 확인할 수 있어요.
            </>
          }
        />

        <SurfaceCard>
          <TabList>
            <TabButton
              type="button"
              $isActive={activeTab === "calculator"}
              onClick={() => setActiveTab("calculator")}
            >
              계산기
            </TabButton>
            <TabButton
              type="button"
              $isActive={activeTab === "records"}
              onClick={() => setActiveTab("records")}
            >
              기록
            </TabButton>
          </TabList>

          {activeTab === "calculator" ? (
            <TabPanel>
              <GuideText>
                🕒 15시간 초과분부터 1.5배 환산
                <br />
                8시간 = 1일 기준으로 보상휴가가 부여됩니다.
              </GuideText>

              <FieldGroup>
                <FieldLabel>시간 / 분 입력</FieldLabel>
                <InlineFields>
                  <NumberInput
                    type="number"
                    min="0"
                    placeholder="시간"
                    value={calcHours}
                    onChange={(event) => setCalcHours(event.target.value)}
                  />
                  <UnitText>시간</UnitText>
                  <NumberInput
                    type="number"
                    min="0"
                    max="59"
                    placeholder="분"
                    value={calcMinutes}
                    onChange={(event) => setCalcMinutes(event.target.value)}
                  />
                  <UnitText>분</UnitText>
                </InlineFields>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>또는 총 분 입력</FieldLabel>
                <WideInput
                  type="number"
                  min="0"
                  placeholder="총 분"
                  value={calcTotalMinutes}
                  onChange={(event) => setCalcTotalMinutes(event.target.value)}
                />
              </FieldGroup>

              <PrimaryButton type="button" onClick={handleCalculate}>
                계산하기
              </PrimaryButton>

              <ResultBox>{calcResult || "입력 후 계산하기를 눌러주세요."}</ResultBox>
            </TabPanel>
          ) : (
            <TabPanel>
              <StatsRow>
                <StatCard>
                  <span>저장된 기록</span>
                  <strong>{records.length}건</strong>
                </StatCard>
                <StatCard>
                  <span>누적 야근시간</span>
                  <strong>{totalRecordedDuration}</strong>
                </StatCard>
              </StatsRow>

              <FieldGroup>
                <FieldLabel>날짜</FieldLabel>
                <DateInput
                  type="date"
                  value={recordDate}
                  onChange={(event) => setRecordDate(event.target.value)}
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>야근 시간</FieldLabel>
                <InlineFields>
                  <NumberInput
                    type="number"
                    min="0"
                    placeholder="시간"
                    value={recordHours}
                    onChange={(event) => setRecordHours(event.target.value)}
                  />
                  <UnitText>시간</UnitText>
                  <NumberInput
                    type="number"
                    min="0"
                    max="59"
                    placeholder="분"
                    value={recordMinutes}
                    onChange={(event) => setRecordMinutes(event.target.value)}
                  />
                  <UnitText>분</UnitText>
                </InlineFields>
              </FieldGroup>

              <PrimaryButton type="button" onClick={handleAddRecord}>
                기록 저장하기
              </PrimaryButton>

              <ResultBox>{recordResult}</ResultBox>

              <SectionDivider />

              <SectionTitle>저장된 야근 기록</SectionTitle>
              <RecordList>
                {records.length === 0 ? (
                  <EmptyItem>저장된 야근 기록이 없습니다.</EmptyItem>
                ) : (
                  records.map((record) => (
                    <RecordItem key={record.id}>
                      <RecordInfo>
                        <strong>{record.date}</strong>
                        <span>
                          {record.hours}시간 {record.minutes}분
                        </span>
                      </RecordInfo>
                      <DeleteButton
                        type="button"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        삭제
                      </DeleteButton>
                    </RecordItem>
                  ))
                )}
              </RecordList>

              <DangerButton
                type="button"
                onClick={handleClearRecords}
                disabled={records.length === 0}
              >
                전체 기록 초기화
              </DangerButton>
            </TabPanel>
          )}

          <SectionDivider />

          <SectionTitle>보상휴가 일수별 필요 야근시간</SectionTitle>
          <SubText>※ 아래 시간은 15시간 초과 이후 누적 야근 기준입니다.</SubText>
          <RequirementList>
            {LEAVE_REQUIREMENTS.map((item) => (
              <RequirementItem key={item.days}>
                <span>{item.days}일 휴가</span>
                <strong>{item.text} 야근 필요</strong>
              </RequirementItem>
            ))}
          </RequirementList>
        </SurfaceCard>
      </StWrapper>
    </StContainer>
  );
}

const SurfaceCard = styled.section`
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f4;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 22px;
  }
`;

const TabList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  border: 1px solid ${({ $isActive }) => ($isActive ? "#234f8d" : "#d2dceb")};
  background: ${({ $isActive }) =>
    $isActive ? "#234f8d" : "#f8fbff"};
  color: ${({ $isActive }) => ($isActive ? "#ffffff" : "#4a5d78")};
  border-radius: 16px;
  padding: 0.85rem 1rem;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.14);
  }
`;

const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuideText = styled.p`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #eef5ff;
  color: #39506c;
  line-height: 1.7;
  font-size: 0.95rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const FieldLabel = styled.label`
  font-size: 0.92rem;
  font-weight: 700;
  color: #2d3b4f;
`;

const InlineFields = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const NumberInput = styled.input`
  width: 96px;
  padding: 0.85rem 0.9rem;
  border: 1px solid #d3deed;
  border-radius: 14px;
  background: #ffffff;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }
`;

const WideInput = styled(NumberInput)`
  width: 100%;
`;

const DateInput = styled(WideInput)`
  min-height: 52px;
`;

const UnitText = styled.span`
  color: #64748b;
  font-weight: 600;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 16px;
  background: #234f8d;
  color: #ffffff;
  padding: 0.95rem 1.15rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #1c4277;
  box-shadow: 0 8px 18px rgba(35, 79, 141, 0.14);
  transition:
    background-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: #1d457d;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(35, 79, 141, 0.18);
  }
`;

const DangerButton = styled(PrimaryButton)`
  background: #c53b3b;
  border-color: #b43333;
  box-shadow: 0 8px 16px rgba(197, 59, 59, 0.12);

  &:hover {
    background: #b43333;
    box-shadow: 0 10px 18px rgba(197, 59, 59, 0.16);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const ResultBox = styled.pre`
  margin: 0;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #0f172a;
  color: #f8fafc;
  font-family: inherit;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.95rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid #dbe7f4;

  span {
    color: #64748b;
    font-size: 0.85rem;
  }

  strong {
    color: #0f172a;
    font-size: 1.1rem;
  }
`;

const SectionDivider = styled.hr`
  margin: 1.75rem 0 1.25rem;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.35rem;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 800;
`;

const SubText = styled.p`
  margin: 0 0 0.85rem;
  color: #64748b;
  font-size: 0.9rem;
`;

const RecordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const RecordItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const EmptyItem = styled.li`
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  color: #64748b;
  border: 1px dashed #cbd5e1;
`;

const RecordInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;
  }
`;

const DeleteButton = styled.button`
  border: none;
  border-radius: 12px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const RequirementList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const RequirementItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid #dbe7f4;
  color: #334155;

  strong {
    color: #0f172a;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.3rem;
  }
`;
