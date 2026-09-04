"use client";

import RoomForm from "@/app/meeting/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";
import FooterGuide from "@/components/common/FooterGuide"; // ✅ 공통 컴포넌트

import {
  StPageWrapper,
  StContainer,
  StSection,
  StToolColumn,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";
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
    <StContainer>
      <StPageWrapper $width="narrow">
        <PageIntro
          align="center"
          icon="📅"
          title="황총무의 약속 잡기"
          description={
            <>
              여러명이서 약속 잡기 힘드시죠? 황총무가 깔끔하게 정리해드려요!
              소거법으로 <StHighlight $color="red">안 되는 날</StHighlight> 빼고{" "}
              <StHighlight $color="blue">되는 날</StHighlight>을 정해보세욥
              &apos;ㅅ&apos;/
            </>
          }
        />
        <StToolColumn>
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
        </StToolColumn>

        {/* 가이드는 아래에 전체 폭으로 — 팁 카드가 3열로 펼쳐진다 */}
        <FooterGuide
          title={MEETING_GUIDE_DATA.title}
          story={MEETING_GUIDE_DATA.story}
          tips={MEETING_GUIDE_DATA.tips}
          blogGuideId="meeting-guide"
          layout="compact"
        />

        {/* <AdBanner /> */}
      </StPageWrapper>
    </StContainer>
  );
}
