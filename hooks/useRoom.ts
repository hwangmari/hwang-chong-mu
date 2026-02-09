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
import { toSlug } from "@/lib/slug";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );

const parseShortCode = (value: string) => {
  const match = value.match(/^(.*)-([A-Za-z0-9]{6})$/);
  if (!match) return null;
  return { slug: match[1], code: match[2] };
};

export function useRoom(roomId: string) {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"VOTING" | "CONFIRM">("VOTING");
  const [room, setRoom] = useState<any>(null);
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    if (!roomId) return;
    try {
      let roomQuery = supabase.from("rooms").select("*");
      if (isUuid(roomId)) {
        roomQuery = roomQuery.eq("id", roomId);
      } else {
        const parsed = parseShortCode(roomId);
        if (!parsed) throw new Error("잘못된 방 주소입니다.");
        roomQuery = roomQuery.eq("short_code", parsed.code);
      }
      const { data: roomData } = await roomQuery.single();

      if (roomData) {
        if (!roomData.slug) {
          roomData.slug = toSlug(roomData.name);
        }
        setRoom(roomData);
        setResolvedRoomId(roomData.id);
        setIncludeWeekend(roomData.include_weekend);
        if (roomData.confirmed_date) {
          setFinalDate(parseISO(roomData.confirmed_date));
          setStep("CONFIRM");
        }
      }

      const { data: partData } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomData?.id ?? roomId);

      const formattedParticipants = (partData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  const upsertParticipant = async (
    name: string,
    dates: Date[],
    isAbsent: boolean
  ) => {
    try {
      const targetRoomId = resolvedRoomId ?? roomId;
      const dateStrings = dates.map((d) => format(d, "yyyy-MM-dd"));

      await supabase
        .from("participants")
        .delete()
        .eq("room_id", targetRoomId)
        .eq("name", name);

      const { error } = await supabase.from("participants").insert([
        {
          room_id: targetRoomId,
          name: name,
          unavailable_dates: dateStrings,
          is_absent: isAbsent, // DB 컬럼: is_absent
        },
      ]);

      if (error) throw error;

      showAlert(`${name}님 ${isAbsent ? "불참 알림" : "일정 저장"} 완료!`);

      setCurrentName("");
      setCurrentUnavailable([]);
      setIsEditing(false);
      fetchData(); // 즉시 새로고침
    } catch (e) {
      console.error(e);
      showAlert("저장 중 오류가 발생했어요 😢");
    }
  };


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
      const dbDateStr = format(date, "yyyy-MM-dd");

      showConfirm(`${dateStr}로\n최종 확정하시겠습니까?`, async () => {
        const targetRoomId = resolvedRoomId ?? roomId;
        const { error } = await supabase
          .from("rooms")
          .update({ confirmed_date: dbDateStr })
          .eq("id", targetRoomId);
        if (!error) {
          setFinalDate(date);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  };

  const handleSubmitVote = () => {
    if (!currentName.trim()) return showAlert("이름을 입력해주세요!");

    if (currentUnavailable.length === 0) {
      showConfirm(
        "선택한 '안되는 날'이 없어요.\n모두 가능하신가요?",
        () => upsertParticipant(currentName, [], false) // isAbsent = false
      );
    } else {
      upsertParticipant(currentName, currentUnavailable, false); // isAbsent = false
    }
  };

  const handleSubmitAbsent = () => {
    if (!currentName.trim()) return showAlert("이름을 입력해주세요!");

    showConfirm(
      `${currentName}님,\n이번 모임은 참석이 어려우신가요? 😢`,
      () => upsertParticipant(currentName, [], true) // isAbsent = true, 날짜는 빈 배열
    );
  };

  const handleResetDates = () => setCurrentUnavailable([]);

  const handleSelectAllDates = () => {
    const allDates = calendarGrid.filter((d): d is Date => d !== null);
    setCurrentUnavailable(allDates);
  };

  const handleEditUser = (user: UserVote) => {
    showConfirm(`${user.name}님의 일정을\n수정하시겠습니까?`, () => {
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates || []);
      setIsEditing(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleDeleteUser = (user: UserVote) => {
    showConfirm(`정말 ${user.name}님의 정보를\n삭제하시겠습니까?`, async () => {
      const targetRoomId = resolvedRoomId ?? roomId;
      await supabase
        .from("participants")
        .delete()
        .eq("room_id", targetRoomId)
        .eq("name", user.name);

      if (currentName === user.name) setIsEditing(false);
      fetchData();
    });
  };

  const cancelEdit = () => {
    setCurrentName("");
    setCurrentUnavailable([]);
    setIsEditing(false);
  };

  const handleReset = () => {
    showConfirm("확정을 취소하고\n다시 투표화면으로 갈까요?", async () => {
      const targetRoomId = resolvedRoomId ?? roomId;
      await supabase
        .from("rooms")
        .update({ confirmed_date: null })
        .eq("id", targetRoomId);
      setStep("VOTING");
      setFinalDate(null);
    });
  };

  const handleRescueUser = (user: UserVote) => {
    showConfirm(
      `${user.name}님을 위해\n약속 확정을 취소하고 재조율할까요?`,
      async () => {
        const targetRoomId = resolvedRoomId ?? roomId;
        await supabase
          .from("rooms")
          .update({ confirmed_date: null })
          .eq("id", targetRoomId);
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
    showConfirm("투표를 마감하고\n추천 날짜를 선택하시겠습니까?", () =>
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
