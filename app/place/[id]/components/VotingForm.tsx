"use client";

import { Button, Input } from "@hwangchongmu/ui";
import { DinnerPlace, DinnerVote } from "@/types/dinner";
import {
  StChipLabel,
  StMemberChip,
  StMemberChipList,
  StMemberChipSection,
  StSelectedInfo,
  StVoteForm,
} from "../page.styles";

interface VotingFormProps {
  voterName: string;
  setVoterName: (name: string) => void;
  memberNames: string[];
  votes: DinnerVote[];
  places: DinnerPlace[];
  selectedPlaceIds: Set<string>;
  submitting: boolean;
  onSubmit: () => void;
  onResetVoteState: () => void;
}

export default function VotingForm({
  voterName,
  setVoterName,
  memberNames,
  votes,
  places,
  selectedPlaceIds,
  submitting,
  onSubmit,
  onResetVoteState,
}: VotingFormProps) {
  return (
    <StVoteForm>
      {memberNames.length > 0 ? (
        <StMemberChipSection>
          <StChipLabel>이름을 선택하세요</StChipLabel>
          <StMemberChipList>
            {memberNames.map((name) => {
              const isActive = voterName === name;
              const hasVotedAlready = votes.some(
                (v) => v.voter_name === name,
              );
              return (
                <StMemberChip
                  key={name}
                  $isActive={isActive}
                  $hasVoted={hasVotedAlready}
                  onClick={() => {
                    setVoterName(isActive ? "" : name);
                    if (!isActive) {
                      onResetVoteState();
                    }
                  }}
                >
                  {name}
                  {hasVotedAlready && !isActive && " ✓"}
                </StMemberChip>
              );
            })}
          </StMemberChipList>
        </StMemberChipSection>
      ) : (
        <Input
          label="이름"
          placeholder="이름을 입력하세요"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
        />
      )}
      <StSelectedInfo>
        {selectedPlaceIds.size > 0 ? (
          <>
            선택:{" "}
            <b>
              {[...selectedPlaceIds]
                .map((id) => places.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(", ")}
            </b>{" "}
            ({selectedPlaceIds.size}곳)
          </>
        ) : (
          "👆 위에서 장소를 선택해주세요 (복수 선택 가능)"
        )}
      </StSelectedInfo>
      <Button
        color="primary"
        display="full"
        size="large"
        onClick={onSubmit}
        loading={submitting}
        disabled={!voterName.trim() || selectedPlaceIds.size === 0}
      >
        투표하기
      </Button>
    </StVoteForm>
  );
}
