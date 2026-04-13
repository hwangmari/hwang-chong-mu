"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@hwangchongmu/ui";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StLoadingWrapper,
  StSection,
  StWrapper,
} from "@/components/styled/layout.styled";
import ShareButton from "@/components/common/KakaoCalendarShare";
import PlaceCard from "./components/PlaceCard";
import PlaceEditPanel from "./components/PlaceEditPanel";
import VotingForm from "./components/VotingForm";
import {
  StDoneMessage,
  StEditButton,
  StPlaceList,
  StSectionHeader,
  StSectionTitle,
  StShareInfo,
  StTitleRow,
  StVoterCount,
} from "./page.styles";
import { usePlaceVote } from "./usePlaceVote";

export default function DinnerVotePage() {
  const params = useParams();
  const roomId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const {
    room,
    places,
    votes,
    voterName,
    setVoterName,
    selectedPlaceIds,
    loading,
    submitting,
    hasVoted,
    memberNames,
    voteCountMap,
    sortedPlaces,
    maxVotes,
    totalVoters,
    addPlace,
    removePlace,
    togglePlaceSelection,
    submitMyVote,
    resetVoteState,
  } = usePlaceVote(roomId);

  if (loading) {
    return <StLoadingWrapper>로딩중...🍻</StLoadingWrapper>;
  }

  if (!room) {
    return <StLoadingWrapper>투표를 찾을 수 없습니다 😢</StLoadingWrapper>;
  }

  return (
    <StContainer>
      <StWrapper>
        <StTitleRow>
          <PageIntro icon="🍻" title={room.title} />
          <ShareButton
            title={`[황총무] ${room.title}`}
            description={`${room.title} 장소 투표에 참여해주세요! 📍`}
          />
        </StTitleRow>

        <StSection>
          <StSectionHeader>
            <StSectionTitle>후보 장소</StSectionTitle>
            <StEditButton onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "편집 완료" : "편집"}
            </StEditButton>
          </StSectionHeader>

          {isEditing && (
            <PlaceEditPanel
              places={places}
              onAddPlace={addPlace}
              onDeletePlace={removePlace}
            />
          )}
        </StSection>

        <StSection>
          <StSectionHeader>
            <StSectionTitle>투표 현황</StSectionTitle>
            <StVoterCount>참여 {totalVoters}명</StVoterCount>
          </StSectionHeader>

          <StPlaceList>
            {sortedPlaces.map((place) => {
              const info = voteCountMap[place.id];
              const isLeading = maxVotes > 0 && info?.count === maxVotes;
              return (
                <PlaceCard
                  key={place.id}
                  place={place}
                  count={info?.count ?? 0}
                  voters={info?.voters ?? []}
                  totalVoters={totalVoters}
                  isLeading={isLeading}
                  isSelectable={!hasVoted}
                  isSelected={selectedPlaceIds.has(place.id)}
                  onSelect={() => togglePlaceSelection(place.id)}
                />
              );
            })}
          </StPlaceList>
        </StSection>

        <StSection>
          <StSectionTitle>
            {hasVoted ? "투표 완료! 🎉" : "투표하기"}
          </StSectionTitle>

          {hasVoted ? (
            <StDoneMessage>
              <p>
                <b>{voterName}</b>님의 투표가 반영되었습니다!
              </p>
              <Button
                color="light"
                size="medium"
                onClick={resetVoteState}
              >
                다시 투표하기
              </Button>
            </StDoneMessage>
          ) : (
            <VotingForm
              voterName={voterName}
              setVoterName={setVoterName}
              memberNames={memberNames}
              votes={votes}
              places={places}
              selectedPlaceIds={selectedPlaceIds}
              submitting={submitting}
              onSubmit={submitMyVote}
              onResetVoteState={resetVoteState}
            />
          )}
        </StSection>

        <StShareInfo>
          이 페이지 링크를 공유하면 누구나 투표에 참여할 수 있어요!
        </StShareInfo>
      </StWrapper>
    </StContainer>
  );
}
