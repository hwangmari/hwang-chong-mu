"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDinnerPlaces,
  deleteDinnerPlace,
  deleteVotesByVoter,
  fetchDinnerPlaces,
  fetchDinnerRoom,
  fetchVotes,
  submitVote,
} from "@/services/dinner";
import { supabase } from "@/lib/supabase";
import { isUuid, parseShortCode } from "@/lib/slug";
import {
  DinnerPlace,
  DinnerRoom,
  DinnerVote,
  NaverLocalItem,
} from "@/types/dinner";

export function usePlaceVote(roomId: string) {
  const router = useRouter();
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<DinnerRoom | null>(null);
  const [places, setPlaces] = useState<DinnerPlace[]>([]);
  const [votes, setVotes] = useState<DinnerVote[]>([]);
  const [voterName, setVoterName] = useState("");
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [memberNames, setMemberNames] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      let roomData: DinnerRoom | null = null;

      if (isUuid(roomId)) {
        roomData = await fetchDinnerRoom(roomId);
        if (roomData?.slug && roomData?.short_code) {
          router.replace(`/place/${roomData.slug}-${roomData.short_code}`);
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

      if (roomData?.meeting_room_id) {
        const { data: partData } = await supabase
          .from("participants")
          .select("name, is_absent")
          .eq("room_id", roomData.meeting_room_id);
        if (partData) {
          setMemberNames(
            partData
              .filter((participant) => !participant.is_absent)
              .map((participant) => participant.name),
          );
        }
      }

      setLoading(false);
    };
    void load();
  }, [roomId, router]);

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

  const addPlace = useCallback(
    async (item: NaverLocalItem) => {
      try {
        const newPlaces = await addDinnerPlaces(resolvedRoomId || roomId, [
          {
            name: item.title.replace(/<[^>]*>/g, ""),
            category: item.category,
            address: item.address,
            road_address: item.roadAddress,
            link: item.link,
            map_x: item.mapx,
            map_y: item.mapy,
          },
        ]);
        setPlaces((prev) => [...prev, ...newPlaces]);
        return true;
      } catch {
        alert("장소 추가에 실패했습니다.");
        return false;
      }
    },
    [resolvedRoomId, roomId],
  );

  const removePlace = useCallback(async (placeId: string) => {
    if (
      !confirm(
        "이 장소를 삭제하시겠습니까? 해당 장소에 대한 투표도 함께 삭제됩니다.",
      )
    ) {
      return;
    }
    try {
      await deleteDinnerPlace(placeId);
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      setVotes((prev) => prev.filter((v) => v.place_id !== placeId));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }, []);

  const togglePlaceSelection = useCallback((placeId: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }, []);

  const submitMyVote = useCallback(async () => {
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
      await deleteVotesByVoter(resolvedRoomId || roomId, voterName.trim());
      const newVotes: DinnerVote[] = [];
      for (const placeId of selectedPlaceIds) {
        const vote = await submitVote(
          resolvedRoomId || roomId,
          placeId,
          voterName.trim(),
        );
        newVotes.push(vote);
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
  }, [resolvedRoomId, roomId, selectedPlaceIds, voterName]);

  const resetVoteState = useCallback(() => {
    setHasVoted(false);
    setSelectedPlaceIds(new Set());
  }, []);

  return {
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
  };
}
