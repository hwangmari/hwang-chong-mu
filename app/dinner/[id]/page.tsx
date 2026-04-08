"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { Button, Input } from "@hwangchongmu/ui";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
  StSection,
  StLoadingWrapper,
} from "@/components/styled/layout.styled";
import {
  fetchDinnerRoom,
  fetchDinnerPlaces,
  fetchVotes,
  submitVote,
  deleteVotesByVoter,
  addDinnerPlaces,
  deleteDinnerPlace,
} from "@/services/dinner";
import { DinnerRoom, DinnerPlace, DinnerVote, NaverLocalItem } from "@/types/dinner";
import { supabase } from "@/lib/supabase";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { isUuid, parseShortCode, toSlug } from "@/lib/slug";

export default function DinnerVotePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(null);

  const [room, setRoom] = useState<DinnerRoom | null>(null);
  const [places, setPlaces] = useState<DinnerPlace[]>([]);
  const [votes, setVotes] = useState<DinnerVote[]>([]);
  const [voterName, setVoterName] = useState("");
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [memberNames, setMemberNames] = useState<string[]>([]);

  // 편집 모드
  const [isEditing, setIsEditing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<NaverLocalItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      let roomData: DinnerRoom | null = null;
      let actualRoomId = roomId;

      // UUID인지 slug-shortcode인지 판별
      if (isUuid(roomId)) {
        roomData = await fetchDinnerRoom(roomId);
        // UUID 접근 시 slug URL로 리다이렉트
        if (roomData?.slug && roomData?.short_code) {
          router.replace(`/dinner/${roomData.slug}-${roomData.short_code}`);
          return;
        }
      } else {
        const parsed = parseShortCode(roomId);
        if (parsed) {
          const { data } = await supabase
            .from("dinner_rooms")
            .select("*")
            .eq("short_code", parsed.code)
            .single();
          roomData = data;
          if (roomData) actualRoomId = roomData.id;
        }
      }

      if (!roomData) {
        setLoading(false);
        return;
      }

      setRoom(roomData);
      setResolvedRoomId(roomData.id);

      const [placesData, votesData] = await Promise.all([
        fetchDinnerPlaces(roomData.id),
        fetchVotes(roomData.id),
      ]);
      setPlaces(placesData);
      setVotes(votesData);

      // 연결된 meeting room이 있으면 참여자 이름 불러오기
      if (roomData?.meeting_room_id) {
        const { data: partData } = await supabase
          .from("participants")
          .select("name, is_absent")
          .eq("room_id", roomData.meeting_room_id);
        if (partData) {
          setMemberNames(
            partData
              .filter((p: any) => !p.is_absent)
              .map((p: any) => p.name),
          );
        }
      }

      setLoading(false);
    };
    load();
  }, [roomId, router]);

  // 장소별 투표 수 집계
  const voteCountMap = useMemo(() => {
    const map: Record<string, { count: number; voters: string[] }> = {};
    places.forEach((p) => {
      map[p.id] = { count: 0, voters: [] };
    });
    votes.forEach((v) => {
      if (map[v.place_id]) {
        map[v.place_id].count++;
        map[v.place_id].voters.push(v.voter_name);
      }
    });
    return map;
  }, [places, votes]);

  // 투표 수 기준 정렬된 장소
  const sortedPlaces = useMemo(() => {
    return [...places].sort((a, b) => {
      const countA = voteCountMap[a.id]?.count || 0;
      const countB = voteCountMap[b.id]?.count || 0;
      return countB - countA;
    });
  }, [places, voteCountMap]);

  const maxVotes = useMemo(() => {
    return Math.max(...Object.values(voteCountMap).map((v) => v.count), 0);
  }, [voteCountMap]);

  const totalVoters = useMemo(() => {
    const names = new Set(votes.map((v) => v.voter_name));
    return names.size;
  }, [votes]);

  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "");

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/naver-search?query=${encodeURIComponent(searchKeyword)}`,
      );
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch {
      alert("검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddPlace = async (item: NaverLocalItem) => {
    try {
      const newPlaces = await addDinnerPlaces(resolvedRoomId || roomId, [
        {
          name: stripHtml(item.title),
          category: item.category,
          address: item.address,
          road_address: item.roadAddress,
          link: item.link,
          map_x: item.mapx,
          map_y: item.mapy,
        },
      ]);
      setPlaces((prev) => [...prev, ...newPlaces]);
      setSearchResults((prev) =>
        prev.filter((r) => r.title !== item.title),
      );
    } catch {
      alert("장소 추가에 실패했습니다.");
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm("이 장소를 삭제하시겠습니까? 해당 장소에 대한 투표도 함께 삭제됩니다.")) return;
    try {
      await deleteDinnerPlace(placeId);
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      setVotes((prev) => prev.filter((v) => v.place_id !== placeId));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const togglePlaceSelection = (placeId: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  };

  const handleVote = async () => {
    if (!voterName.trim()) {
      alert("이름을 입력해주세요!");
      return;
    }
    if (selectedPlaceIds.size === 0) {
      alert("장소를 하나 이상 선택해주세요!");
      return;
    }
    setSubmitting(true);
    try {
      // 기존 투표 삭제 후 새로 투표
      await deleteVotesByVoter(resolvedRoomId || roomId, voterName.trim());
      const newVotes: DinnerVote[] = [];
      for (const placeId of selectedPlaceIds) {
        const v = await submitVote(resolvedRoomId || roomId, placeId, voterName.trim());
        newVotes.push(v);
      }
      setVotes((prev) => [
        ...prev.filter((v) => v.voter_name !== voterName.trim()),
        ...newVotes,
      ]);
      setHasVoted(true);
      setSelectedPlaceIds(new Set());
    } catch {
      alert("투표에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <StLoadingWrapper>로딩중...🍻</StLoadingWrapper>;
  }

  if (!room) {
    return (
      <StLoadingWrapper>투표를 찾을 수 없습니다 😢</StLoadingWrapper>
    );
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

        {/* 후보 편집 */}
        <StSection>
          <StSectionHeader>
            <StSectionTitle>후보 장소</StSectionTitle>
            <StEditButton onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "편집 완료" : "편집"}
            </StEditButton>
          </StSectionHeader>

          {isEditing && (
            <StEditPanel>
              <StSearchRow>
                <Input
                  placeholder="예) 강남 맛집, 홍대 고기집"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  color="primary"
                  size="medium"
                  onClick={handleSearch}
                  loading={searching}
                >
                  검색
                </Button>
              </StSearchRow>

              {searchResults.length > 0 && (
                <StSearchResultList>
                  {searchResults.map((item, i) => (
                    <StSearchResultItem key={i}>
                      <StSearchResultInfo>
                        <StSearchResultName>
                          {stripHtml(item.title)}
                        </StSearchResultName>
                        <StSearchResultMeta>
                          {item.category} · {item.roadAddress || item.address}
                        </StSearchResultMeta>
                      </StSearchResultInfo>
                      <Button
                        color="primary"
                        variant="weak"
                        size="small"
                        onClick={() => handleAddPlace(item)}
                      >
                        추가
                      </Button>
                    </StSearchResultItem>
                  ))}
                </StSearchResultList>
              )}

              {places.length > 0 && (
                <StCurrentPlaces>
                  <StSubTitle>현재 후보 ({places.length}곳)</StSubTitle>
                  {places.map((place) => (
                    <StCurrentPlaceItem key={place.id}>
                      <span>{place.name}</span>
                      <StDeleteButton onClick={() => handleDeletePlace(place.id)}>
                        삭제
                      </StDeleteButton>
                    </StCurrentPlaceItem>
                  ))}
                </StCurrentPlaces>
              )}
            </StEditPanel>
          )}
        </StSection>

        {/* 투표 현황 */}
        <StSection>
          <StSectionHeader>
            <StSectionTitle>투표 현황</StSectionTitle>
            <StVoterCount>참여 {totalVoters}명</StVoterCount>
          </StSectionHeader>

          <StPlaceList>
            {sortedPlaces.map((place) => {
              const info = voteCountMap[place.id];
              const isLeading =
                maxVotes > 0 && info?.count === maxVotes;
              const percentage =
                totalVoters > 0
                  ? Math.round((info.count / totalVoters) * 100)
                  : 0;

              return (
                <StPlaceCard
                  key={place.id}
                  $isLeading={isLeading}
                  $isSelectable={!hasVoted}
                  $isSelected={selectedPlaceIds.has(place.id)}
                  onClick={() => {
                    if (!hasVoted) togglePlaceSelection(place.id);
                  }}
                >
                  <StPlaceTop>
                    <StPlaceInfo>
                      {isLeading && maxVotes > 0 && (
                        <StCrown>👑</StCrown>
                      )}
                      <StPlaceName>{place.name}</StPlaceName>
                    </StPlaceInfo>
                    <StVoteCount $isLeading={isLeading}>
                      {info.count}표
                    </StVoteCount>
                  </StPlaceTop>

                  <StPlaceMeta>
                    <span>{place.category}</span>
                    <span>·</span>
                    <span>{place.road_address || place.address}</span>
                  </StPlaceMeta>

                  {/* 투표 바 */}
                  <StBarWrapper>
                    <StBar
                      $width={percentage}
                      $isLeading={isLeading}
                    />
                  </StBarWrapper>

                  {/* 투표한 사람들 */}
                  {info.voters.length > 0 && (
                    <StVoters>
                      {info.voters.map((name, i) => (
                        <StVoterChip key={i}>{name}</StVoterChip>
                      ))}
                    </StVoters>
                  )}

                  {/* 네이버 지도 링크 */}
                  <StNaverLink
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name + " " + (place.road_address || place.address).split(" ").slice(0, 3).join(" "))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    네이버 지도에서 보기 →
                  </StNaverLink>
                </StPlaceCard>
              );
            })}
          </StPlaceList>
        </StSection>

        {/* 투표하기 */}
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
                onClick={() => {
                  setHasVoted(false);
                  setSelectedPlaceIds(new Set());
                }}
              >
                다시 투표하기
              </Button>
            </StDoneMessage>
          ) : (
            <>
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
                                setHasVoted(false);
                                setSelectedPlaceIds(new Set());
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
                  onClick={handleVote}
                  loading={submitting}
                  disabled={!voterName.trim() || selectedPlaceIds.size === 0}
                >
                  투표하기
                </Button>
              </StVoteForm>
            </>
          )}
        </StSection>

        {/* 공유 안내 */}
        <StShareInfo>
          이 페이지 링크를 공유하면 누구나 투표에 참여할 수 있어요!
        </StShareInfo>
      </StWrapper>
    </StContainer>
  );
}

const StSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StVoterCount = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StPlaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StPlaceCard = styled.div<{
  $isLeading: boolean;
  $isSelectable: boolean;
  $isSelected: boolean;
}>`
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid
    ${({ $isSelected, $isLeading, theme }) =>
      $isSelected
        ? theme.colors.blue500
        : $isLeading
          ? theme.colors.amber200
          : theme.colors.gray100};
  background: ${({ $isSelected, $isLeading, theme }) =>
    $isSelected
      ? theme.colors.blue50
      : $isLeading
        ? theme.colors.amber50
        : theme.colors.white};
  cursor: ${({ $isSelectable }) => ($isSelectable ? "pointer" : "default")};
  transition: all 0.15s;

  ${({ $isSelectable, theme }) =>
    $isSelectable &&
    `
    &:hover {
      border-color: ${theme.colors.blue200};
    }
  `}
`;

const StPlaceTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const StPlaceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const StCrown = styled.span`
  font-size: 1rem;
`;

const StPlaceName = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StVoteCount = styled.span<{ $isLeading: boolean }>`
  font-weight: 800;
  font-size: 1rem;
  color: ${({ $isLeading, theme }) =>
    $isLeading ? theme.colors.amber500 : theme.colors.gray500};
`;

const StPlaceMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StBarWrapper = styled.div`
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const StBar = styled.div<{ $width: number; $isLeading: boolean }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $isLeading, theme }) =>
    $isLeading ? theme.colors.amber500 : theme.colors.blue500};
  border-radius: 9999px;
  transition: width 0.3s ease;
`;

const StVoters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
`;

const StVoterChip = styled.span`
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 600;
`;

const StNaverLink = styled.a`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.green600};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const StTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StMemberChipSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StChipLabel = styled.span`
  font-size: 0.813rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StMemberChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StMemberChip = styled.button<{ $isActive: boolean; $hasVoted: boolean }>`
  height: 36px;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 800;
  border: 2px solid transparent;
  transition: all 0.2s;

  ${({ $isActive, $hasVoted, theme }) =>
    $isActive
      ? `
        background-color: ${theme.colors.gray900};
        color: ${theme.colors.white};
        border-color: ${theme.colors.gray900};
      `
      : $hasVoted
        ? `
        background-color: ${theme.colors.white};
        color: #f59e0b;
        border-color: #fde68a;
      `
        : `
        background-color: ${theme.colors.white};
        color: ${theme.colors.gray600};
        border-color: ${theme.colors.gray200};
      `}

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const StVoteForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StSelectedInfo = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  text-align: center;

  b {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StDoneMessage = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1rem;
  }
`;

const StShareInfo = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.5rem;
  padding-bottom: 2rem;
`;

const StEditButton = styled.button`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  border-radius: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

const StEditPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StSearchRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;

  & > div {
    flex: 1;
  }
`;

const StSearchResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StSearchResultItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  background: ${({ theme }) => theme.colors.white};
`;

const StSearchResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StSearchResultName = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StSearchResultMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StCurrentPlaces = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  padding-top: 1rem;
`;

const StSubTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  margin-bottom: 0.5rem;
`;

const StCurrentPlaceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray50};
`;

const StDeleteButton = styled.button`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.rose600};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;
