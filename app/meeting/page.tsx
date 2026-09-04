"use client";

import RoomForm from "@/app/meeting/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";
import ServiceLayout from "@/components/common/ServiceLayout"; // ✅ 공통 레이아웃

import { StSection } from "@/components/styled/layout.styled";
import { StHighlight } from "@/components/common/PageIntro";
import { MEETING_GUIDE_DATA } from "@/data/footerGuides";

export default function CreateRoomPage() {
  const {
    formData,
    loading,
    handleChange,
    createRoom,
    isCustomPeriod,
    setIsCustomPeriod,
    members,
    memberInput,
    setMemberInput,
    addMember,
    removeMember,
  } = useCreateRoom();

  return (
    <ServiceLayout
      width="narrow"
      intro={{
        icon: "📅",
        title: "황총무의 약속 잡기",
        description: (
          <>
            여러명이서 약속 잡기 힘드시죠? 황총무가 깔끔하게 정리해드려요!
            소거법으로 <StHighlight $color="red">안 되는 날</StHighlight> 빼고{" "}
            <StHighlight $color="blue">되는 날</StHighlight>을 정해보세욥
            &apos;ㅅ&apos;/
          </>
        ),
      }}
      /* 가이드는 아래에 전체 폭으로 — 팁 카드가 3열로 펼쳐진다 */
      guide={{
        title: MEETING_GUIDE_DATA.title,
        story: MEETING_GUIDE_DATA.story,
        tips: MEETING_GUIDE_DATA.tips,
        blogGuideId: "meeting-guide",
      }}
    >
      <StSection>
        <RoomForm
          formData={formData}
          loading={loading}
          onChange={handleChange}
          onSubmit={createRoom}
          isCustomPeriod={isCustomPeriod}
          setIsCustomPeriod={setIsCustomPeriod}
          members={members}
          memberInput={memberInput}
          setMemberInput={setMemberInput}
          addMember={addMember}
          removeMember={removeMember}
        />
      </StSection>

      {/* <AdBanner /> */}
    </ServiceLayout>
  );
}
