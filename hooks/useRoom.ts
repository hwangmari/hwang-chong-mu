import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  addDays,
  parseISO,
  startOfDay,
  getDay,
  isSameDay,
  format,
} from "date-fns";
import { ko } from "date-fns/locale"; // 한국어 날짜 포맷용
import { UserVote, ModalState } from "@/types";

export function useRoom(roomId: string) {
  // --- [상태 관리] ---
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"VOTING" | "CONFIRM">("VOTING");
  const [room, setRoom] = useState<any>(null);
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [participants, setParticipants] = useState<UserVote[]>([]);

  const [currentName, setCurrentName] = useState("");
  const [currentUnavailable, setCurrentUnavailable] = useState<Date[]>([]);
  const [finalDate, setFinalDate] = useState<Date | null>(null);

  // ★ candidateDate(바텀시트용) 삭제됨
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
      setRoom(roomData);
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

  // --- [달력 데이터 계산] ---
  const startDate = room?.start_date
    ? startOfDay(parseISO(room.start_date))
    : startOfDay(new Date());
  const rawDates = Array.from({ length: 21 }, (_, i) => addDays(startDate, i));
  const displayDates = includeWeekend
    ? rawDates
    : rawDates.filter((d) => getDay(d) !== 0 && getDay(d) !== 6);

  let emptyCount = 0;
  if (displayDates.length > 0) {
    const firstDay = getDay(displayDates[0]);
    emptyCount = includeWeekend
      ? firstDay
      : firstDay - 1 < 0
      ? 0
      : firstDay - 1;
  }
  const calendarGrid = [...Array(emptyCount).fill(null), ...displayDates];

  // --- [핸들러 함수들] ---
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
      // ★ CONFIRM 모드 수정: 바텀시트 대신 바로 팝업 띄워서 확정
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
    // 1. 현재 저장된 인원
    const savedCount = participants.length;

    // 2. 지금 작성 중인 사람이 있는지? (이름도 있고 날짜도 찍었으면 1명으로 칩니다)
    const isWriting =
      currentName.trim() !== "" && currentUnavailable.length > 0;

    // 3. 총 예상 인원 계산
    const totalCount = savedCount + (isWriting ? 1 : 0);

    // [방어 로직] 혼자서는 약속을 잡을 수 없어요! (최소 2명 체크)
    if (totalCount < 2) {
      return showAlert("최소 2명 이상 참여해야\n날짜를 정할 수 있어요! 👯‍♂️");
    }

    // 4. 작성 중인 내용이 있다면? -> 저장하고 넘어가기
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

    // 5. 정상 진행
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
    calendarGrid,
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
