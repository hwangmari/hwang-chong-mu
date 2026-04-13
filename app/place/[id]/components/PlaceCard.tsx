"use client";

import { DinnerPlace } from "@/types/dinner";
import {
  StBar,
  StBarWrapper,
  StCrown,
  StNaverLink,
  StPlaceCard,
  StPlaceInfo,
  StPlaceMeta,
  StPlaceName,
  StPlaceTop,
  StVoteCount,
  StVoterChip,
  StVoters,
} from "../page.styles";

interface PlaceCardProps {
  place: DinnerPlace;
  count: number;
  voters: string[];
  totalVoters: number;
  isLeading: boolean;
  isSelectable: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export default function PlaceCard({
  place,
  count,
  voters,
  totalVoters,
  isLeading,
  isSelectable,
  isSelected,
  onSelect,
}: PlaceCardProps) {
  const percentage =
    totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;

  const naverMapQuery = encodeURIComponent(
    `${place.name} ${(place.road_address || place.address).split(" ").slice(0, 3).join(" ")}`,
  );

  return (
    <StPlaceCard
      $isLeading={isLeading}
      $isSelectable={isSelectable}
      $isSelected={isSelected}
      onClick={() => {
        if (isSelectable) onSelect();
      }}
    >
      <StPlaceTop>
        <StPlaceInfo>
          {isLeading && count > 0 && <StCrown>👑</StCrown>}
          <StPlaceName>{place.name}</StPlaceName>
        </StPlaceInfo>
        <StVoteCount $isLeading={isLeading}>{count}표</StVoteCount>
      </StPlaceTop>

      <StPlaceMeta>
        <span>{place.category}</span>
        <span>·</span>
        <span>{place.road_address || place.address}</span>
      </StPlaceMeta>

      <StBarWrapper>
        <StBar $width={percentage} $isLeading={isLeading} />
      </StBarWrapper>

      {voters.length > 0 && (
        <StVoters>
          {voters.map((name, i) => (
            <StVoterChip key={i}>{name}</StVoterChip>
          ))}
        </StVoters>
      )}

      <StNaverLink
        href={`https://map.naver.com/v5/search/${naverMapQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        네이버 지도에서 보기 →
      </StNaverLink>
    </StPlaceCard>
  );
}
