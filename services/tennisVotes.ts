// 테니스 대회 익명 투표 — 베스트드레서(남성부·여성부)와 우승팀 토토.
//
// 익명을 지키면서 중복을 막는 방법: 이름 대신 폰마다 한 번 만들어 보관하는 임의 문자열만 보낸다.
// 같은 폰이면 같은 줄을 덮어쓰므로(마음이 바뀌면 고칠 수 있다) 분야마다 한 표가 된다.
import { supabase } from "@/lib/supabase";
import { playerNameFromKey } from "@/app/tennis/voterKey";

export type VoteKind = "dresser_m" | "dresser_f" | "champion";

export const VOTE_LABEL: Record<VoteKind, string> = {
  dresser_m: "베스트드레서 남성부",
  dresser_f: "베스트드레서 여성부",
  champion: "우승팀 토토",
};

/** 한 분야의 집계: 고른 것별 표 수와, 내가 무엇을 골랐는지 */
export type VoteTally = {
  kind: VoteKind;
  total: number;
  counts: { choice: string; votes: number }[]; // 많이 받은 순
  mine: string | null;
  /**
   * 고른 것별로 "누가 골랐는지". 식별값이 사람 이름인 투표(우승팀 토토)에서만 채워진다.
   * 베스트드레서는 익명이라 늘 빈 배열이다.
   */
  names: Record<string, string[]>;
};

type Row = { kind: VoteKind; voter_key: string; choice: string };

/** 대회의 모든 투표를 읽어 분야별로 집계한다 */
export async function fetchVoteTallies(
  eventId: string,
  voterKey: string,
): Promise<Record<VoteKind, VoteTally>> {
  const { data, error } = await supabase
    .from("tennis_votes")
    .select("kind, voter_key, choice")
    .eq("event_id", eventId);
  if (error) throw error;

  // 이름을 고르기 전(익명 방식)에 들어온 표는 세지 않는다.
  // 같은 사람이 예전 방식과 새 방식으로 각각 한 줄씩 남기면 두 명으로 세어진다.
  const rows = ((data ?? []) as Row[]).filter((r) => playerNameFromKey(r.voter_key) !== null);
  const empty = (kind: VoteKind): VoteTally => ({
    kind,
    total: 0,
    counts: [],
    mine: null,
    names: {},
  });
  const out: Record<VoteKind, VoteTally> = {
    dresser_m: empty("dresser_m"),
    dresser_f: empty("dresser_f"),
    champion: empty("champion"),
  };

  for (const kind of Object.keys(out) as VoteKind[]) {
    const mine = rows.find((r) => r.kind === kind && r.voter_key === voterKey)?.choice ?? null;
    const byChoice = new Map<string, number>();
    const names: Record<string, string[]> = {};
    for (const row of rows) {
      if (row.kind !== kind) continue;
      byChoice.set(row.choice, (byChoice.get(row.choice) ?? 0) + 1);
      const who = playerNameFromKey(row.voter_key);
      if (who) (names[row.choice] ??= []).push(who);
    }
    for (const list of Object.values(names)) list.sort((a, b) => a.localeCompare(b, "ko"));
    out[kind] = {
      kind,
      total: [...byChoice.values()].reduce((n, v) => n + v, 0),
      // 표가 같으면 이름 순서로 — 새로고침할 때마다 줄 순서가 바뀌지 않게
      counts: [...byChoice.entries()]
        .map(([choice, votes]) => ({ choice, votes }))
        .sort((a, b) => b.votes - a.votes || a.choice.localeCompare(b.choice, "ko")),
      mine,
      names,
    };
  }
  return out;
}

/** 한 표 넣기(또는 고치기). 같은 폰·같은 분야면 덮어쓴다 */
export async function castVote(
  eventId: string,
  kind: VoteKind,
  voterKey: string,
  choice: string,
): Promise<void> {
  const { error } = await supabase.from("tennis_votes").upsert(
    {
      event_id: eventId,
      kind,
      voter_key: voterKey,
      choice,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,kind,voter_key" },
  );
  if (error) throw error;
}

// ───── 본인 확인용 4자리 비번 ─────
// 이름만 고르면 남의 이름을 골라 그 사람이 무엇을 찍었는지 볼 수 있다.
// 베스트드레서를 익명으로 두려면 본인 확인이 꼭 필요하다 (주인 지적 2026-10-06).
// 비번 자체는 저장하지 않고, 대회·이름·비번을 섞어 되돌릴 수 없게 만든 값만 저장한다.

async function hashPin(eventId: string, name: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${eventId}|${name}|${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type PinCheck = "created" | "ok" | "wrong";

/**
 * 비번을 확인한다.
 * 이 이름으로 처음이면 넣은 비번을 그 사람 것으로 정하고 "created",
 * 이미 있으면 맞는지 보고 "ok" 또는 "wrong" 을 돌려준다.
 */
export async function checkOrCreatePin(
  eventId: string,
  name: string,
  pin: string,
): Promise<PinCheck> {
  const hash = await hashPin(eventId, name, pin);
  const { data, error } = await supabase
    .from("tennis_vote_pins")
    .select("pin_hash")
    .eq("event_id", eventId)
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;

  if (data) return data.pin_hash === hash ? "ok" : "wrong";

  const { error: insErr } = await supabase
    .from("tennis_vote_pins")
    .insert({ event_id: eventId, name, pin_hash: hash });
  if (!insErr) return "created";

  // 두 기기에서 동시에 처음 넣으면 한쪽이 중복으로 막힌다. 그땐 맞는지 다시 본다
  const { data: again } = await supabase
    .from("tennis_vote_pins")
    .select("pin_hash")
    .eq("event_id", eventId)
    .eq("name", name)
    .maybeSingle();
  return again?.pin_hash === hash ? "ok" : "wrong";
}
