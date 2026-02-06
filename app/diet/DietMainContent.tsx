"use client";

import { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addMonths,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import FooterGuide from "@/components/common/FooterGuide";
import { DIET_GUIDE_DATA } from "@/data/footerGuides";
import WeightChart from "./WeightChart";
import DietMealInput from "./DietMealInput";
import { StFlexBox } from "@/components/styled/layout.styled";
import { useModal } from "@/components/common/ModalProvider"; // ✅ 공통 모달 훅
import AnalysisCard from "./AnalysisCard";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface LogData {
  id?: number;
  date: string;
  morning: string;
  lunch: string;
  dinner: string;
  weight_morning: string;
  weight_lunch: string;
  weight_dinner: string;
  memo: string;
}

export default function DietMainContent({ goalId }: { goalId: number }) {
  const { openConfirm, openAlert } = useModal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");

  const [log, setLog] = useState<LogData>({
    date: format(new Date(), "yyyy-MM-dd"),
    morning: "",
    lunch: "",
    dinner: "",
    weight_morning: "",
    weight_lunch: "",
    weight_dinner: "",
    memo: "",
  });

  const [initialLog, setInitialLog] = useState<LogData | null>(null);

  const [yesterdayLog, setYesterdayLog] = useState<LogData | null>(null);
  const [chartLogs, setChartLogs] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(false);

  const isDirty =
    initialLog && JSON.stringify(log) !== JSON.stringify(initialLog);

  useEffect(() => {
    fetchLogAndYesterday(currentDate);
    fetchChartLogs(currentDate, viewMode);
  }, [currentDate, viewMode]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const fetchLogAndYesterday = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const prevDateStr = format(subDays(date, 1), "yyyy-MM-dd");

    const { data: todayData } = await supabase
      .from("diet_logs")
      .select("*")
      .eq("goal_id", goalId)
      .eq("date", dateStr)
      .single();

    let newLog: LogData;
    if (todayData) {
      newLog = {
        ...todayData,
        weight_morning: todayData.weight_morning || "",
        weight_lunch: todayData.weight_lunch || "",
        weight_dinner: todayData.weight_dinner || "",
        morning: todayData.morning || "",
        lunch: todayData.lunch || "",
        dinner: todayData.dinner || "",
      };
    } else {
      newLog = {
        date: dateStr,
        morning: "",
        lunch: "",
        dinner: "",
        weight_morning: "",
        weight_lunch: "",
        weight_dinner: "",
        memo: "",
      };
    }

    setLog(newLog);
    setInitialLog(newLog); // ✅ 기준점 설정 (저장된 상태)

    const { data: prevData } = await supabase
      .from("diet_logs")
      .select("*")
      .eq("goal_id", goalId)
      .eq("date", prevDateStr)
      .single();
    setYesterdayLog(prevData || null);
  };

  const fetchChartLogs = async (date: Date, mode: "weekly" | "monthly") => {
    let start, end;
    if (mode === "weekly") {
      start = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      end = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else {
      start = format(startOfMonth(date), "yyyy-MM-dd");
      end = format(endOfMonth(date), "yyyy-MM-dd");
    }

    const { data } = await supabase
      .from("diet_logs")
      .select("*")
      .eq("goal_id", goalId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (data) setChartLogs(data);
  };

  const handleDateMove = async (direction: "prev" | "next") => {
    const targetDate =
      direction === "prev"
        ? viewMode === "monthly"
          ? subMonths(currentDate, 1)
          : subDays(currentDate, 1)
        : viewMode === "monthly"
          ? addMonths(currentDate, 1)
          : addDays(currentDate, 1);

    if (isDirty) {
      const confirmed = await openConfirm(
        "작성 중인 내용이 저장되지 않았습니다.\n저장하지 않고 이동하시겠습니까?",
      );
      if (confirmed) {
        setCurrentDate(targetDate);
      }
    } else {
      setCurrentDate(targetDate);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      goal_id: goalId,
      date: log.date,
      morning: log.morning,
      lunch: log.lunch,
      dinner: log.dinner,
      weight_morning: log.weight_morning,
      weight_lunch: log.weight_lunch,
      weight_dinner: log.weight_dinner,
      memo: log.memo,
    };

    const { error } = await supabase
      .from("diet_logs")
      .upsert(payload, { onConflict: "goal_id, date" });

    if (error) {
      await openAlert("저장에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
    } else {
      await openAlert("오늘의 기록이 성공적으로 저장되었습니다! 💪");

      fetchChartLogs(currentDate, viewMode);
      fetchLogAndYesterday(currentDate); // initialLog도 함께 업데이트됨
    }
    setLoading(false);
  };

  const toTags = (str: string) => (str ? str.split(",") : []);
  const fromTags = (tags: string[]) => tags.join(",");

  const parseWeight = (str: string | undefined) => {
    const val = parseFloat(str || "");
    return isNaN(val) ? null : val;
  };

  const w_prev_dinner = parseWeight(yesterdayLog?.weight_dinner); // 전날 저녁
  const w_curr_morning = parseWeight(log.weight_morning); // 오늘 아침
  const w_curr_dinner = parseWeight(log.weight_dinner); // 오늘 저녁

  const overnightDiff =
    w_curr_morning !== null && w_prev_dinner !== null
      ? w_curr_morning - w_prev_dinner
      : null;

  const daytimeDiff =
    w_curr_dinner !== null && w_curr_morning !== null
      ? w_curr_dinner - w_curr_morning
      : null;

  const totalDiff =
    w_curr_dinner !== null && w_prev_dinner !== null
      ? w_curr_dinner - w_prev_dinner
      : null;

  return (
    <>
      <DateNav>
        <NavBtn onClick={() => handleDateMove("prev")}>
          <ChevronLeftIcon fontSize="small" />
        </NavBtn>
        <CurrentDate>
          {viewMode === "monthly"
            ? format(currentDate, "yyyy년 M월")
            : format(currentDate, "M월 d일 (EEE)", { locale: ko })}
        </CurrentDate>
        <NavBtn onClick={() => handleDateMove("next")}>
          <ChevronRightIcon fontSize="small" />
        </NavBtn>
      </DateNav>

      <StFlexBox>
        <div className="flex-lft-box">
          <SectionCard>
            <ChartHeader>
              <SectionTitle style={{ marginBottom: 0 }}>
                📉 체중 변화
              </SectionTitle>
              <ToggleWrapper>
                <ToggleBtn
                  $isActive={viewMode === "weekly"}
                  onClick={() => setViewMode("weekly")}
                >
                  주간
                </ToggleBtn>
                <ToggleBtn
                  $isActive={viewMode === "monthly"}
                  onClick={() => setViewMode("monthly")}
                >
                  월간
                </ToggleBtn>
              </ToggleWrapper>
            </ChartHeader>

            <WeightChart
              logs={chartLogs}
              currentDate={currentDate}
              viewMode={viewMode}
            />
          </SectionCard>

          {/* ✅ [수정] 컴포넌트로 깔끔하게 교체! */}
          <AnalysisCard
            overnightDiff={overnightDiff}
            daytimeDiff={daytimeDiff}
            totalDiff={totalDiff}
          />
        </div>

        <div className="flex-rgt-box">
          <FormGrid>
            {/* ✅ 통합된 입력 카드 스타일 유지 */}
            <SectionCard>
              <SectionTitle>몸무게와 식단을 기록해주세요</SectionTitle>
              <DietMealInput
                weightLabel="☀️ 아침"
                weightPlaceholder="공복"
                weightValue={log.weight_morning}
                onWeightChange={(val) =>
                  setLog({ ...log, weight_morning: val })
                }
                dietTags={toTags(log.morning)}
                onDietChange={(tags) =>
                  setLog({ ...log, morning: fromTags(tags) })
                }
                dietPlaceholder="예: 사과, 계란 (엔터)"
              />
              <DietMealInput
                weightLabel="🥗 점심"
                weightPlaceholder="식전"
                weightValue={log.weight_lunch}
                onWeightChange={(val) => setLog({ ...log, weight_lunch: val })}
                dietTags={toTags(log.lunch)}
                onDietChange={(tags) =>
                  setLog({ ...log, lunch: fromTags(tags) })
                }
                dietPlaceholder="예: 일반식 1/2 (엔터)"
              />
              <DietMealInput
                weightLabel="🌙 저녁"
                weightPlaceholder="자기 전"
                weightValue={log.weight_dinner}
                onWeightChange={(val) => setLog({ ...log, weight_dinner: val })}
                dietTags={toTags(log.dinner)}
                onDietChange={(tags) =>
                  setLog({ ...log, dinner: fromTags(tags) })
                }
                dietPlaceholder="예: 샐러드 (엔터)"
              />
            </SectionCard>

            <SectionCard>
              <SectionTitle>하루 메모</SectionTitle>
              <TextArea
                placeholder="오늘의 운동, 기분, 특이사항을 자유롭게 남겨주세요."
                value={log.memo}
                onChange={(e) => setLog({ ...log, memo: e.target.value })}
              />
            </SectionCard>
          </FormGrid>

          <ButtonWrapper>
            <CreateButton
              onClick={handleSave}
              isLoading={loading}
              bgColor="#10b981"
            >
              기록 저장하기
            </CreateButton>
          </ButtonWrapper>
        </div>
      </StFlexBox>

      <GuideWrapper>
        <FooterGuide
          title={DIET_GUIDE_DATA.title}
          tips={DIET_GUIDE_DATA.tips}
        />
      </GuideWrapper>
    </>
  );
}

const DateNav = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;
const NavBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  &:hover {
    color: #111;
  }
`;
const CurrentDate = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
  min-width: 140px;
  text-align: center;
`;
const SectionCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  border: 1px solid #f3f4f6;
`;
const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;
const ToggleWrapper = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
`;
const ToggleBtn = styled.button<{ $isActive: boolean }>`
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $isActive }) => ($isActive ? "white" : "transparent")};
  color: ${({ $isActive }) => ($isActive ? "#10b981" : "#94a3b8")};
  box-shadow: ${({ $isActive }) =>
    $isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none"};
`;
const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1rem;
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const TextArea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  resize: none;
  font-size: 0.95rem;
  outline: none;
  &:focus {
    border-color: #64748b;
  }
`;
const ButtonWrapper = styled.div`
  margin-top: 1rem;
  position: sticky;
  bottom: 1rem;
  z-index: 10;
`;
const GuideWrapper = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px dashed #e2e8f0;
`;
