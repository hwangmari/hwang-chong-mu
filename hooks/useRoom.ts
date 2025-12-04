import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  addDays,
  parseISO,
  startOfDay,
  getDay,
  isSameDay,
  format,
  eachDayOfInterval,
  isWeekend,
} from "date-fns";
import { ko } from "date-fns/locale";
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

  // ⭐ 추가: 수정 모드인지 확인하는 상태
  const [isEditing, setIsEditing] = useState(false);

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

  // --- [달력 데이터 계산] ---
  let calendarGrid: (Date | null)[] = [];
  if (room) {
    const startDate = startOfDay(parseISO(room.start_date));
    const endDate = room.end_date
      ? startOfDay(parseISO(room.end_date))
      : addDays(startDate, 20);

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const displayDates = includeWeekend
      ? allDays
      : allDays.filter((d) => !isWeekend(d));

    if (displayDates.length > 0) {
      const firstDayIndex = getDay(displayDates[0]);
      const emptyCount = includeWeekend
        ? firstDayIndex
        : firstDayIndex === 0
        ? 6
        : firstDayIndex - 1;
      const emptySlots = Array(emptyCount).fill(null);
      calendarGrid = [...emptySlots, ...displayDates];
    }
  }

  // --- [핸들러 함수들] ---
  const showAlert = (msg: string) =>
    setModal({ isOpen: true, type: "alert", message: msg });

  // ⭐ 모달 함수 수정 (함수 전달 안전하게)
  const showConfirm = (msg: string, action: () => void) =>
    setModal({
      isOpen: true,
      type: "confirm",
      message: msg,
      onConfirm: () => action(),
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
        // 기존 데이터 삭제 후 재입력 (Upsert 방식)
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
        // ⭐ 저장 후 초기화 (수정 모드 해제)
        setCurrentName("");
        setCurrentUnavailable([]);
        setIsEditing(false);
        fetchData();
      } catch {
        showAlert("저장 중 에러가 발생했어요!");
      }
    };

    if (currentUnavailable.length === 0) {
      showConfirm("선택한 '안되는 날'이 없어요.\n모두 가능하신가요?", save);
    } else {
      await save();
    }
  };

  // ⭐ 수정 모드 취소 함수
  const cancelEdit = () => {
    setCurrentName("");
    setCurrentUnavailable([]);
    setIsEditing(false);
  };

  const handleGoToConfirm = () => {
    const savedCount = participants.length;
    const isWriting =
      currentName.trim() !== "" && currentUnavailable.length > 0;

    // 수정 중일 때는 카운트에서 제외하거나 포함하는 로직이 필요할 수 있으나,
    // 여기서는 단순하게 기 저장된 인원 기준으로 체크합니다.
    if (savedCount < 2) {
      return showAlert("최소 2명 이상 참여해야\n날짜를 정할 수 있어요! 👯‍♂️");
    }

    if (isWriting) {
      showConfirm(
        "작성 중인 내용이 저장되지 않았어요!\n무시하고 마감할까요?",
        () => {
          setStep("CONFIRM");
        }
      );
      return;
    }
    showConfirm("투표를 마감하고\n최종 날짜를 정하시겠습니까?", () =>
      setStep("CONFIRM")
    );
  };

  // ⭐ 수정 버튼 핸들러 (수정 모드 ON)
  const handleEditUser = (user: UserVote) =>
    showConfirm(`${user.name}님의 일정을\n수정하시겠습니까?`, () => {
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      setIsEditing(true); // 수정 모드 켜기
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  // ⭐ [신규 기능] 삭제 버튼 핸들러
  const handleDeleteUser = (user: UserVote) => {
    showConfirm(
      `정말 ${user.name}님의 정보를\n삭제하시겠습니까? 🗑️`,
      async () => {
        try {
          await supabase
            .from("participants")
            .delete()
            .eq("room_id", roomId)
            .eq("name", user.name);

          showAlert("삭제되었습니다.");

          // 만약 수정 중이던 사람을 삭제했다면 입력폼도 초기화
          if (currentName === user.name) {
            cancelEdit();
          }
          fetchData();
        } catch (e) {
          showAlert("삭제 실패!");
        }
      }
    );
  };

  const handleRescueUser = (user: UserVote) =>
    showConfirm(`${user.name}님 일정을 재조율할까요?`, () => {
      setStep("VOTING");
      setFinalDate(null);
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      setIsEditing(true); // 재조율도 일종의 수정이므로 true
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const handleReset = () =>
    showConfirm("다시 투표화면으로 갈까요?", () => {
      setStep("VOTING");
      setFinalDate(null);
      setIsEditing(false);
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
    isEditing, // ⭐ UI에서 사용하기 위해 반환
    setIncludeWeekend,
    setCurrentName,
    setFinalDate,
    setStep,
    handleToggleDate,
    handleSubmitVote,
    handleGoToConfirm,
    handleEditUser,
    handleDeleteUser, // ⭐ 반환
    handleRescueUser,
    handleReset,
    cancelEdit, // ⭐ 반환
    closeModal,
    showAlert,
    showConfirm,
  };
}
