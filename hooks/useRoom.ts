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

  // UserVote 타입에 isAbsent가 포함되어 있어야 합니다.
  const [participants, setParticipants] = useState<UserVote[]>([]);

  const [currentName, setCurrentName] = useState("");
  const [currentUnavailable, setCurrentUnavailable] = useState<Date[]>([]);
  const [finalDate, setFinalDate] = useState<Date | null>(null);
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
      // 1. 방 정보 가져오기
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomData) {
        setRoom(roomData);
        setIncludeWeekend(roomData.include_weekend);
        if (roomData.confirmed_date) {
          setFinalDate(parseISO(roomData.confirmed_date));
          setStep("CONFIRM");
        }
      }

      // 2. 참여자 정보 가져오기
      const { data: partData } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId);

      const formattedParticipants = (partData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        // DB의 is_absent 컬럼을 가져옴 (없으면 false)
        isAbsent: p.is_absent || false,
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
    // 실시간성을 위해 폴링 (3초)
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- [달력 그리드 계산] ---
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

  // --- [공통 헬퍼 함수] ---
  const showAlert = (msg: string) =>
    setModal({ isOpen: true, type: "alert", message: msg });

  const showConfirm = (msg: string, action: () => void) =>
    setModal({
      isOpen: true,
      type: "confirm",
      message: msg,
      onConfirm: () => action(),
    });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  // 🔥 [핵심] DB 저장 공통 함수 (참석/불참 모두 이걸 씁니다)
  const upsertParticipant = async (
    name: string,
    dates: Date[],
    isAbsent: boolean
  ) => {
    try {
      const dateStrings = dates.map((d) => format(d, "yyyy-MM-dd"));

      // 기존 데이터 삭제 (이름 중복 방지)
      await supabase
        .from("participants")
        .delete()
        .eq("room_id", roomId)
        .eq("name", name);

      // 데이터 삽입
      const { error } = await supabase.from("participants").insert([
        {
          room_id: roomId,
          name: name,
          unavailable_dates: dateStrings,
          is_absent: isAbsent, // DB 컬럼: is_absent
        },
      ]);

      if (error) throw error;

      showAlert(`${name}님 ${isAbsent ? "불참 알림" : "일정 저장"} 완료!`);

      // 상태 초기화
      setCurrentName("");
      setCurrentUnavailable([]);
      setIsEditing(false);
      fetchData(); // 즉시 새로고침
    } catch (e) {
      console.error(e);
      showAlert("저장 중 오류가 발생했어요 😢");
    }
  };

  // --- [이벤트 핸들러] ---

  // 1. 날짜 토글
  const handleToggleDate = (date: Date) => {
    if (step === "VOTING") {
      if (!currentName) return showAlert("이름을 먼저 입력해주세요! 🐰");
      setCurrentUnavailable((prev) =>
        prev.some((d) => isSameDay(d, date))
          ? prev.filter((d) => !isSameDay(d, date))
          : [...prev, date]
      );
    } else {
      // 확정 모드일 때
      const dateStr = format(date, "M월 d일 (E)", { locale: ko });
      const dbDateStr = format(date, "yyyy-MM-dd");

      showConfirm(`${dateStr}로\n최종 확정하시겠습니까?`, async () => {
        const { error } = await supabase
          .from("rooms")
          .update({ confirmed_date: dbDateStr })
          .eq("id", roomId);
        if (!error) {
          setFinalDate(date);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  };

  // 2. [저장] 일정 저장 버튼 클릭
  const handleSubmitVote = () => {
    if (!currentName.trim()) return showAlert("이름을 입력해주세요!");

    // 안 되는 날이 하나도 없으면 물어봄
    if (currentUnavailable.length === 0) {
      showConfirm(
        "선택한 '안되는 날'이 없어요.\n모두 가능하신가요?",
        () => upsertParticipant(currentName, [], false) // isAbsent = false
      );
    } else {
      upsertParticipant(currentName, currentUnavailable, false); // isAbsent = false
    }
  };

  // 3. [저장] 불참 버튼 클릭
  const handleSubmitAbsent = () => {
    if (!currentName.trim()) return showAlert("이름을 입력해주세요!");

    showConfirm(
      `${currentName}님,\n이번 모임은 참석이 어려우신가요? 😢`,
      () => upsertParticipant(currentName, [], true) // isAbsent = true, 날짜는 빈 배열
    );
  };

  // 4. [기능] 다 돼요 (초기화)
  const handleResetDates = () => setCurrentUnavailable([]);

  // 5. [기능] 다 안 돼요 (전체 선택)
  const handleSelectAllDates = () => {
    const allDates = calendarGrid.filter((d): d is Date => d !== null);
    setCurrentUnavailable(allDates);
  };

  // 6. [기능] 수정 모드 진입
  const handleEditUser = (user: UserVote) => {
    showConfirm(`${user.name}님의 일정을\n수정하시겠습니까?`, () => {
      setCurrentName(user.name);
      // 불참자였어도 수정 누르면 날짜 선택 모드로 오되, 날짜는 비어있음
      setCurrentUnavailable(user.unavailableDates || []);
      setIsEditing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // 7. [기능] 삭제
  const handleDeleteUser = (user: UserVote) => {
    showConfirm(`정말 ${user.name}님의 정보를\n삭제하시겠습니까?`, async () => {
      await supabase
        .from("participants")
        .delete()
        .eq("room_id", roomId)
        .eq("name", user.name);

      if (currentName === user.name) setIsEditing(false);
      fetchData();
    });
  };

  // 8. [기능] 수정 취소
  const cancelEdit = () => {
    setCurrentName("");
    setCurrentUnavailable([]);
    setIsEditing(false);
  };

  // 9. [기능] 확정 취소 (재조율)
  const handleReset = () => {
    showConfirm("확정을 취소하고\n다시 투표화면으로 갈까요?", async () => {
      await supabase
        .from("rooms")
        .update({ confirmed_date: null })
        .eq("id", roomId);
      setStep("VOTING");
      setFinalDate(null);
    });
  };

  // 10. [기능] 구조 요청 (불참자/불가능자 살리기)
  const handleRescueUser = (user: UserVote) => {
    showConfirm(
      `${user.name}님을 위해\n약속 확정을 취소하고 재조율할까요?`,
      async () => {
        await supabase
          .from("rooms")
          .update({ confirmed_date: null })
          .eq("id", roomId);
        setStep("VOTING");
        setFinalDate(null);
        setCurrentName(user.name);
        setCurrentUnavailable(user.unavailableDates);
        setIsEditing(true);
      }
    );
  };

  const handleGoToConfirm = () => {
    if (participants.length < 2)
      return showAlert("최소 2명 이상 참여해야 합니다.");
    showConfirm("투표를 마감하고\n최종 날짜를 정하시겠습니까?", () =>
      setStep("CONFIRM")
    );
  };

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
    isEditing,
    setCurrentName,
    setIncludeWeekend,
    handleToggleDate,
    handleSubmitVote,
    handleSubmitAbsent, // ✅ 내보내기 필수
    handleResetDates,
    handleSelectAllDates, // ✅ 내보내기 필수
    handleGoToConfirm,
    handleEditUser,
    handleDeleteUser,
    handleRescueUser,
    handleReset,
    cancelEdit,
    closeModal,
  };
}
