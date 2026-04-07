import { supabase } from "@/lib/supabase";
import { DinnerRoom, DinnerPlace, DinnerVote } from "@/types/dinner";

// === Room ===

export const createDinnerRoom = async (
  title: string,
  area: string,
): Promise<DinnerRoom> => {
  const { data, error } = await supabase
    .from("dinner_rooms")
    .insert({ title, area })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchDinnerRoom = async (
  roomId: string,
): Promise<DinnerRoom | null> => {
  const { data, error } = await supabase
    .from("dinner_rooms")
    .select("*")
    .eq("id", roomId)
    .single();
  if (error) return null;
  return data;
};

// === Places ===

export const addDinnerPlaces = async (
  roomId: string,
  places: Omit<DinnerPlace, "id" | "room_id">[],
): Promise<DinnerPlace[]> => {
  const rows = places.map((p) => ({ ...p, room_id: roomId }));
  const { data, error } = await supabase
    .from("dinner_places")
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
};

export const fetchDinnerPlaces = async (
  roomId: string,
): Promise<DinnerPlace[]> => {
  const { data, error } = await supabase
    .from("dinner_places")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const deleteDinnerPlace = async (placeId: string): Promise<void> => {
  const { error } = await supabase
    .from("dinner_places")
    .delete()
    .eq("id", placeId);
  if (error) throw error;
};

// === Votes ===

export const submitVote = async (
  roomId: string,
  placeId: string,
  voterName: string,
): Promise<DinnerVote> => {
  const { data, error } = await supabase
    .from("dinner_votes")
    .insert({ room_id: roomId, place_id: placeId, voter_name: voterName })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchVotes = async (roomId: string): Promise<DinnerVote[]> => {
  const { data, error } = await supabase
    .from("dinner_votes")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const deleteVotesByVoter = async (
  roomId: string,
  voterName: string,
): Promise<void> => {
  const { error } = await supabase
    .from("dinner_votes")
    .delete()
    .eq("room_id", roomId)
    .eq("voter_name", voterName);
  if (error) throw error;
};
