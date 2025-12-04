import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  addDays,
  parseISO,
  startOfDay,
  getDay,
  isSameDay,
  format,
  eachDayOfInterval, // ⭐ 추가: 기간 내 모든 날짜 생성
  isWeekend, // ⭐ 추가: 주말 판별
} from "date-fns";
import { ko } from "date-fns/locale";
import { UserVote, ModalState } from "@/types";

export function useRoom(roomId: string) {
  // --- [상태 관리] ---
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"VOTING" | "CONFIRM">("VOTING");
  const [room, setRoom] = useState<any>(null);

  // 초기값은 false지만, DB 데이터 로드 시 방 설정값으로 업데이트됩니다.
  const [includeWeekend, setIncludeWeekend] = useState(false);

  const [participants, setParticipants] = useState<UserVote[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentUnavailable, setCurrentUnavailable] = useState<Date[]>([]);
  const [finalDate, setFinalDate] = useState<Date | null>(null);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
  });

  // --- [데이터 불러오기] ---
  const fetchData = useCallback(async () => {
    if (!roomId) return;
    try {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomData) {
        setRoom(roomData);
        // ⭐ 방장이 설정한 주말 포함 여부를 초기 상태로 적용
        setIncludeWeekend(roomData.include_weekend);
      }

      const { data: partData } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId);

      const formattedParticipants = (partData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        unavailableDates: (p.unavailable_dates || []).map((d: string) =>
          startOfDay(parseISO(d))
        ),
      }));
      setParticipants(formattedParticipants);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- [달력 데이터 계산] ⭐ 핵심 수정 로직 ---
  let calendarGrid: (Date | null)[] = [];

  if (room) {
    const startDate = startOfDay(parseISO(room.start_date));

    // ⭐ 종료 날짜가 있으면 사용하고, 없으면(구버전 데이터 대비) 3주 뒤로 설정
    const endDate = room.end_date
      ? startOfDay(parseISO(room.end_date))
      : addDays(startDate, 20);

    // 1. 시작일부터 종료일까지 모든 날짜 생성
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // 2. 주말 포함 여부에 따른 필터링
    const displayDates = includeWeekend
      ? allDays
      : allDays.filter((d) => !isWeekend(d));

    // 3. 앞쪽 빈칸(Padding) 채우기
    if (displayDates.length > 0) {
      const firstDayIndex = getDay(displayDates[0]); // 0(일) ~ 6(토)

      // 주말 포함(일요일 시작): 일(0) -> 0칸
      // 주말 미포함(월요일 시작): 월(1) -> 0칸, 화(2) -> 1칸 ...
      const emptyCount = includeWeekend
        ? firstDayIndex
        : firstDayIndex === 0
        ? 6
        : firstDayIndex - 1;

      const emptySlots = Array(emptyCount).fill(null);
      calendarGrid = [...emptySlots, ...displayDates];
    }
  }

  // --- [핸들러 함수들 (기존 유지)] ---
  const showAlert = (msg: string) =>
    setModal({ isOpen: true, type: "alert", message: msg });
  const showConfirm = (msg: string, action: () => void) =>
    setModal({
      isOpen: true,
      type: "confirm",
      message: msg,
      onConfirm: action,
    });
  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const handleToggleDate = (date: Date) => {
    if (step === "VOTING") {
      if (!currentName) return showAlert("이름을 먼저 입력해주세요! 🐰");
      setCurrentUnavailable((prev) =>
        prev.some((d) => isSameDay(d, date))
          ? prev.filter((d) => !isSameDay(d, date))
          : [...prev, date]
      );
    } else {
      const dateStr = format(date, "M월 d일 (E)", { locale: ko });
      showConfirm(`${dateStr}로\n최종 확정하시겠습니까?`, () => {
        setFinalDate(date);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const handleSubmitVote = async () => {
    if (!currentName) return showAlert("이름을 입력해주세요!");
    const save = async () => {
      try {
        const dateStrings = currentUnavailable.map((d) =>
          format(d, "yyyy-MM-dd")
        );
        await supabase
          .from("participants")
          .delete()
          .eq("room_id", roomId)
          .eq("name", currentName);
        await supabase.from("participants").insert([
          {
            room_id: roomId,
            name: currentName,
            unavailable_dates: dateStrings,
          },
        ]);
        showAlert(`${currentName}님 일정 저장 완료! 📝`);
        setCurrentName("");
        setCurrentUnavailable([]);
        fetchData();
      } catch {
        showAlert("저장 중 에러가 발생했어요!");
      }
    };
    if (currentUnavailable.length === 0) {
      return new Promise<void>((resolve) => {
        showConfirm(
          "선택한 '안되는 날'이 없어요.\n모두 가능하신가요?",
          async () => {
            await save();
            resolve();
          }
        );
      });
    } else {
      await save();
    }
  };

  const handleGoToConfirm = () => {
    const savedCount = participants.length;
    const isWriting =
      currentName.trim() !== "" && currentUnavailable.length > 0;
    const totalCount = savedCount + (isWriting ? 1 : 0);

    if (totalCount < 2) {
      return showAlert("최소 2명 이상 참여해야\n날짜를 정할 수 있어요! 👯‍♂️");
    }

    if (isWriting) {
      showConfirm(
        "작성 중인 내용이 저장되지 않았어요! 😮\n저장하고 바로 넘어갈까요?",
        async () => {
          await handleSubmitVote();
          setStep("CONFIRM");
        }
      );
      return;
    }

    showConfirm("투표를 마감하고\n최종 날짜를 정하시겠습니까?", () =>
      setStep("CONFIRM")
    );
  };

  const handleEditUser = (user: UserVote) =>
    showConfirm(`${user.name}님 일정을 수정할까요?`, () => {
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const handleRescueUser = (user: UserVote) =>
    showConfirm(`${user.name}님 일정을 재조율할까요?`, () => {
      setStep("VOTING");
      setFinalDate(null);
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const handleReset = () =>
    showConfirm("다시 투표화면으로 갈까요?", () => {
      setStep("VOTING");
      setFinalDate(null);
    });

  return {
    loading,
    room,
    step,
    includeWeekend,
    participants,
    currentName,
    currentUnavailable,
    finalDate,
    modal,
    calendarGrid, // ⭐ 새로 계산된 그리드 반환
    setIncludeWeekend,
    setCurrentName,
    setFinalDate,
    setStep,
    handleToggleDate,
    handleSubmitVote,
    handleGoToConfirm,
    handleEditUser,
    handleRescueUser,
    handleReset,
    closeModal,
    showAlert,
    showConfirm,
  };
}
