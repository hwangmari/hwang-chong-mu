"use client";

// 여행 만들기 화면. 이름·기간·나라만 받아서 여행 주소를 하나 만들어 준다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@hwangchongmu/ui";
import ServiceLayout from "@/components/common/ServiceLayout";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { useModal } from "@/components/common/ModalProvider";
import { TRAVEL_GUIDE_DATA } from "@/data/footerGuides";
import { byId } from "@/lib/services";
import useCreateTravelPlan from "./useCreateTravelPlan";
import { nightsLabel, rangeLabel } from "./lib/plan";
import { forgetMyPlan, loadMyPlans, type MyPlanItem } from "./myPlans";
import { REGIONS } from "./types";
import {
  StCard,
  StCardTitle,
  StDateRow,
  StEmpty,
  StField,
  StGhostBtn,
  StHint,
  StInput,
  StLabel,
  StMyLink,
  StMyList,
  StMyMeta,
  StMyRow,
  StMyTitle,
  StNights,
  StSelect,
  StSkeletonRow,
} from "./page.styles";

const service = byId("travel");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function TravelHomePage() {
  const { openConfirm } = useModal();
  const {
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
  } = useCreateTravelPlan();

  const [myPlans, setMyPlans] = useState<MyPlanItem[]>([]);
  // localStorage 는 브라우저에서만 읽히므로 첫 그림 뒤에 채운다(그 전에는 스켈레톤)
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 첫 그림이 끝난 뒤에 읽는다 (app/tennis/page.tsx 와 같은 방식)
    const timer = window.setTimeout(() => {
      setMyPlans(loadMyPlans());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rangeReady =
    DATE_PATTERN.test(startDate) && DATE_PATTERN.test(endDate) && endDate >= startDate;

  async function removePlan(id: string) {
    const ok = await openConfirm(
      "내 여행 목록에서만 지워요. 여행 자체는 남아요. 지울까요?",
    );
    if (!ok) return;
    forgetMyPlan(id);
    setMyPlans(loadMyPlans());
  }

  return (
    <ServiceLayout
      width="narrow"
      intro={{ icon: service.icon, title: service.name, description: service.desc }}
      guide={{
        title: TRAVEL_GUIDE_DATA.title,
        story: TRAVEL_GUIDE_DATA.story,
        tips: TRAVEL_GUIDE_DATA.tips,
      }}
    >
      <StCard>
        <StField>
          <StLabel>여행 이름</StLabel>
          <StInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 도쿄 3박 4일"
            maxLength={40}
          />
        </StField>

        <StDateRow>
          <StField>
            <StLabel>시작일</StLabel>
            <StInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </StField>
          <StField>
            <StLabel>종료일</StLabel>
            <StInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </StField>
        </StDateRow>

        {rangeReady ? <StNights>{nightsLabel(startDate, endDate)}</StNights> : null}

        <StField>
          <StLabel>지역 (지도·검색 기준)</StLabel>
          <StSelect value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((item) => (
              <option key={item.label} value={item.code}>
                {item.label}
              </option>
            ))}
          </StSelect>
        </StField>

        <Button
          color="primary"
          display="full"
          size="large"
          onClick={submit}
          loading={submitting}
        >
          여행 만들기
        </Button>

        <StHint>
          링크 하나로 같이 고쳐요. 만들면 주소가 생기고, 로그인해 두면 내 계정에도 자동으로
          붙어요.
        </StHint>
      </StCard>

      <StCard>
        <StCardTitle>내 여행</StCardTitle>
        {!hydrated ? (
          <div>
            <StSkeletonRow>
              <SkeletonBlock width="55%" height="0.95rem" />
              <SkeletonBlock width="35%" height="0.8rem" />
            </StSkeletonRow>
            <StSkeletonRow>
              <SkeletonBlock width="45%" height="0.95rem" />
              <SkeletonBlock width="30%" height="0.8rem" />
            </StSkeletonRow>
          </div>
        ) : myPlans.length === 0 ? (
          <StEmpty>아직 만든 여행이 없어요</StEmpty>
        ) : (
          <StMyList>
            {myPlans.map((plan) => (
              <StMyRow key={plan.id}>
                <StMyLink as={Link} href={`/travel/${plan.id}`}>
                  <StMyTitle>🧳 {plan.title}</StMyTitle>
                  <StMyMeta>
                    {rangeLabel(plan.startDate, plan.endDate)} ·{" "}
                    {nightsLabel(plan.startDate, plan.endDate)}
                  </StMyMeta>
                </StMyLink>
                <StGhostBtn type="button" onClick={() => removePlan(plan.id)}>
                  지우기
                </StGhostBtn>
              </StMyRow>
            ))}
          </StMyList>
        )}
      </StCard>
    </ServiceLayout>
  );
}
