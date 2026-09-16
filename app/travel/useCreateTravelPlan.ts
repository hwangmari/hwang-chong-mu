"use client";

// 여행 만들기 화면의 입력·저장을 한 곳에 모은 훅. (hooks/useCreateRoom.ts 와 같은 얼개)
// 안내 문구는 브라우저 기본 alert 대신 앱 모달(useModal)로 띄운다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/common/ModalProvider";
import { createTravelPlan } from "@/services/travel";
import { validateTripInput } from "./lib/plan";
import { rememberMyPlan } from "./myPlans";

export default function useCreateTravelPlan() {
  const router = useRouter();
  const { openAlert } = useModal();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // 지도·장소 검색을 좁힐 나라. 대부분 국내 여행이라 한국을 기본으로 둔다.
  const [region, setRegion] = useState("KR");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;

    const message = validateTripInput({ title, startDate, endDate });
    if (message) {
      await openAlert(message);
      return;
    }

    setSubmitting(true);
    try {
      const plan = await createTravelPlan({
        title: title.trim(),
        startDate,
        endDate,
        region,
      });
      // 이 브라우저(그리고 로그인했다면 내 계정)의 목록에 기억해 둔다
      rememberMyPlan({
        id: plan.id,
        title: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
      });
      router.push(`/travel/${plan.id}`);
    } catch (error) {
      console.error("여행 만들기 실패:", error);
      await openAlert("여행을 만들지 못했어요. 잠시 후 다시 눌러 주세요.");
      setSubmitting(false);
    }
  }

  return {
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    region,
    setRegion,
    submitting,
    submit,
  };
}
