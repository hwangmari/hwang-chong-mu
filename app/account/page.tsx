"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBlock } from "@/components/common/Skeleton";
import {
  ROOM_SECRET_NOTICE,
  ROOM_SERVICE_META,
  ROOM_SERVICES,
  isRoomService,
  toRoomLabel,
  type RoomService,
} from "@/lib/roomServices";
import { loadMyEvents } from "@/app/tennis/myEvents";
import { STORAGE_ROOM_KEY } from "@/app/overtime/constants";

type LinkRow = {
  service: string;
  resourceRef: Record<string, unknown>;
  label: string;
};

// 각 서비스의 기존 localStorage에서 "이 기기의 진입 정보"를 읽어 연결 후보를 만든다.
function readLocalCandidate(service: string): {
  resourceRef: Record<string, unknown>;
  label: string;
} | null {
  try {
    if (service === "workout") {
      const raw = localStorage.getItem("hwang-workout-session");
      if (!raw) return null;
      // 방 비밀번호는 계정에 저장하지 않는다(ROOM_SECRET_NOTICE 와 같은 원칙).
      const s = JSON.parse(raw) as {
        roomId?: string;
        roomName?: string;
      };
      if (!s.roomId) return null;
      return {
        resourceRef: {
          roomId: s.roomId,
          roomName: s.roomName ?? "",
        },
        label: s.roomName || "운동방",
      };
    }
    if (service === "account-book") {
      const activeUserId = localStorage.getItem(
        "hwang-account-book-active-user",
      );
      const workspaceId = localStorage.getItem(
        "hwang-account-book-last-workspace",
      );
      if (!activeUserId) return null;
      return {
        resourceRef: { activeUserId, workspaceId: workspaceId ?? "" },
        label: "내 가계부",
      };
    }
  } catch {
    return null;
  }
  return null;
}

const SERVICE_META: Record<
  string,
  {
    icon: string;
    name: string;
    local: boolean;
    hint: string;
    // 방 URL/번호로 연결하는 서비스의 resourceRef 키 (기본 goalId)
    refKey?: "goalId" | "roomId";
  }
> = {
  "account-book": {
    icon: "💰",
    name: "가계부",
    local: true,
    hint: "가계부에 한 번 들어갔다 오면 이 기기의 진입 정보로 연결할 수 있어요.",
  },
  workout: {
    icon: "🏋️",
    name: "운동",
    local: true,
    hint: "운동방에 입장한 뒤 이 기기의 방 정보로 연결할 수 있어요.",
  },
  habit: {
    icon: "🌱",
    name: "습관",
    local: false,
    refKey: "goalId",
    hint: "습관 방 주소(URL)나 방 번호를 붙여넣어 연결하세요.",
  },
  diet: {
    icon: "🥗",
    name: "다이어트",
    local: false,
    refKey: "goalId",
    hint: "다이어트 방 주소(URL)나 방 번호를 붙여넣어 연결하세요.",
  },
};

// "내 방"은 서비스당 여러 개일 수 있어 rooms 시스템으로 관리한다.
// 아이콘·이름·링크는 lib/roomServices.ts에서 가져와 /my와 똑같이 보이게 한다.
type RoomRow = {
  id: string;
  service: RoomService;
  roomId: string;
  label: string;
  createdAt: string;
};

// 이 기기의 localStorage에 남아 있는 방을 찾아 "바로 등록" 후보로 보여준다.
// 비밀번호·접근 코드는 읽지도, 보내지도 않는다.
function readLocalRoomCandidates(
  service: RoomService,
): { roomId: string; label: string }[] {
  try {
    if (service === "tennis") {
      return loadMyEvents()
        .filter((event) => event.id)
        .slice(0, 5)
        .map((event) => ({
          roomId: event.id,
          label: toRoomLabel(event.title) || "교류전",
        }));
    }
    if (service === "overtime") {
      const roomRef = localStorage.getItem(STORAGE_ROOM_KEY);
      if (!roomRef) return [];
      return [{ roomId: roomRef, label: roomRef }];
    }
  } catch {
    return [];
  }
  // 장소·게임·일일 기록은 이 기기에 방 정보를 남기지 않아 주소를 붙여넣어 등록한다.
  return [];
}

function AccountContent() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [idInputs, setIdInputs] = useState<Record<string, string>>({});
  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/auth/links", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { links?: LinkRow[] };
      setLinks(data.links ?? []);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    const res = await fetch("/api/auth/rooms", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { rooms?: RoomRow[] };
      setRooms(data.rooms ?? []);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/account");
      return;
    }
    // 마운트/로그인 후 연결 목록 로드(내부에서 async 후 setState) — 표준 데이터 페치 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLinks();
    void loadRooms();
  }, [user, loading, router, loadLinks, loadRooms]);

  const linkByService = useMemo(() => {
    const map: Record<string, LinkRow> = {};
    for (const l of links) map[l.service] = l;
    return map;
  }, [links]);

  const connect = async (
    service: string,
    resourceRef: Record<string, unknown>,
    label: string,
  ) => {
    setBusy(service);
    const res = await fetch("/api/auth/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service, resourceRef, label }),
    });
    if (res.ok) {
      const data = (await res.json()) as { links?: LinkRow[] };
      setLinks(data.links ?? []);
    }
    setBusy(null);
  };

  const disconnect = async (service: string) => {
    setBusy(service);
    const res = await fetch(`/api/auth/links?service=${service}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const data = (await res.json()) as { links?: LinkRow[] };
      setLinks(data.links ?? []);
    }
    setBusy(null);
  };

  const roomsByService = useMemo(() => {
    const map = Object.fromEntries(
      ROOM_SERVICES.map((service) => [service, [] as RoomRow[]]),
    ) as Record<RoomService, RoomRow[]>;
    for (const r of rooms) {
      if (isRoomService(r.service)) map[r.service].push(r);
    }
    return map;
  }, [rooms]);

  const disconnectRoom = async (service: string, roomId: string) => {
    const key = `${service}:${roomId}`;
    setBusy(key);
    const res = await fetch(
      `/api/auth/rooms?service=${service}&roomId=${encodeURIComponent(roomId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      const data = (await res.json()) as { rooms?: RoomRow[] };
      setRooms(data.rooms ?? []);
    }
    setBusy(null);
  };

  // 방 주소(URL)나 방 번호를 붙여넣어 직접 등록
  const addRoom = async (service: RoomService) => {
    const raw = (roomInputs[service] || "").trim();
    // URL이면 마지막 경로 조각을 방 id로 사용(habit/diet와 동일)
    const segment = raw.includes("/")
      ? raw.split(/[/?#]/).filter(Boolean).pop()
      : raw;
    if (!segment) return;
    // 주소창 URL은 한글이 %XX로 인코딩돼 있어 디코딩(예: %EC%97%AC... → 여행가자)
    let roomId = segment;
    try {
      roomId = decodeURIComponent(segment);
    } catch {
      // 잘못된 인코딩이면 원문 사용
    }
    const key = `${service}:add`;
    setBusy(key);
    const res = await fetch("/api/auth/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service, roomId, label: roomId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { rooms?: RoomRow[] };
      setRooms(data.rooms ?? []);
      setRoomInputs((prev) => ({ ...prev, [service]: "" }));
    }
    setBusy(null);
  };

  // 이 기기에서 찾은 방을 그대로 등록 (비밀번호·접근 코드는 보내지 않는다)
  const addRoomDirect = async (
    service: RoomService,
    roomId: string,
    label: string,
  ) => {
    const key = `${service}:add`;
    setBusy(key);
    const res = await fetch("/api/auth/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service, roomId, label: toRoomLabel(label) }),
    });
    if (res.ok) {
      const data = (await res.json()) as { rooms?: RoomRow[] };
      setRooms(data.rooms ?? []);
    }
    setBusy(null);
  };

  const connectByRoomId = (service: string) => {
    const raw = (idInputs[service] || "").trim();
    // URL이면 마지막 경로 조각을 방 id로 사용
    const id = raw.includes("/") ? raw.split(/[/?#]/).filter(Boolean).pop() : raw;
    if (!id) return;
    const refKey = SERVICE_META[service].refKey ?? "goalId";
    void connect(service, { [refKey]: id }, SERVICE_META[service].name);
    setIdInputs((prev) => ({ ...prev, [service]: "" }));
  };

  if (loading || !user) {
    return (
      <StPage>
        <StCard aria-busy="true">
          <StHead>
            <div>
              <SkeletonBlock width="9rem" height="1.1rem" radius="0.6rem" />
            </div>
            <SkeletonBlock width="4.5rem" height="1.9rem" radius="999px" />
          </StHead>
          <StList>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} height="4.4rem" radius="1rem" />
            ))}
          </StList>
        </StCard>
      </StPage>
    );
  }

  return (
    <StPage>
      <StCard>
        <StHead>
          <div>
            <StHello>👤 {user.nickname}</StHello>
            <StSub>서비스를 계정에 연결하면 다시 로그인 없이 바로 열려요.</StSub>
          </div>
          <StLogout type="button" onClick={() => void logout()}>
            로그아웃
          </StLogout>
        </StHead>

        <StList>
          {Object.entries(SERVICE_META).map(([service, meta]) => {
            const linked = linkByService[service];
            const candidate = meta.local ? readLocalCandidate(service) : null;
            return (
              <StServiceRow key={service}>
                <StServiceHead>
                  <StServiceName>
                    <span className="icon">{meta.icon}</span>
                    {meta.name}
                  </StServiceName>
                  {linked ? (
                    <StLinkedTag>연결됨 · {linked.label}</StLinkedTag>
                  ) : null}
                </StServiceHead>

                {linked ? (
                  <StActions>
                    <StGhostBtn
                      type="button"
                      disabled={busy === service}
                      onClick={() => void disconnect(service)}
                    >
                      연결 해제
                    </StGhostBtn>
                  </StActions>
                ) : meta.local ? (
                  candidate ? (
                    <StActions>
                      <StPrimaryBtn
                        type="button"
                        disabled={busy === service}
                        onClick={() =>
                          void connect(
                            service,
                            candidate.resourceRef,
                            candidate.label,
                          )
                        }
                      >
                        이 기기의 진입 정보로 연결
                      </StPrimaryBtn>
                    </StActions>
                  ) : (
                    <StHint>{meta.hint}</StHint>
                  )
                ) : (
                  <StActions>
                    <StRoomInput
                      value={idInputs[service] || ""}
                      onChange={(e) =>
                        setIdInputs((prev) => ({
                          ...prev,
                          [service]: e.target.value,
                        }))
                      }
                      placeholder="방 주소(URL) 또는 방 번호"
                    />
                    <StPrimaryBtn
                      type="button"
                      disabled={busy === service}
                      onClick={() => connectByRoomId(service)}
                    >
                      연결
                    </StPrimaryBtn>
                  </StActions>
                )}
              </StServiceRow>
            );
          })}
        </StList>

        <StRoomsSection>
          <StRoomsTitle>내 방</StRoomsTitle>
          <StRoomsSub>
            방은 만들거나 들어갈 때 자동으로 여기에 등록돼요.
          </StRoomsSub>
          <StRoomsSub>{ROOM_SECRET_NOTICE}</StRoomsSub>

          {ROOM_SERVICES.map((service) => {
            const meta = ROOM_SERVICE_META[service];
            const group = roomsByService[service];
            const registered = new Set(group.map((room) => room.roomId));
            const candidates = readLocalRoomCandidates(service).filter(
              (candidate) => !registered.has(candidate.roomId),
            );
            return (
              <StRoomGroup key={service}>
                <StRoomGroupHead>
                  <span className="icon">{meta.icon}</span>
                  {meta.name}
                </StRoomGroupHead>
                {group.length === 0 ? (
                  <StHint>아직 없어요. {meta.emptyHint}</StHint>
                ) : (
                  group.map((room) => {
                    const busyKey = `${service}:${room.roomId}`;
                    return (
                      <StRoomCard key={room.id}>
                        <StRoomLabel>{room.label || meta.name}</StRoomLabel>
                        <StActions>
                          <StPrimaryBtn
                            type="button"
                            onClick={() => router.push(meta.href(room.roomId))}
                          >
                            열기
                          </StPrimaryBtn>
                          <StGhostBtn
                            type="button"
                            disabled={busy === busyKey}
                            onClick={() =>
                              void disconnectRoom(service, room.roomId)
                            }
                          >
                            연결 해제
                          </StGhostBtn>
                        </StActions>
                      </StRoomCard>
                    );
                  })
                )}
                {candidates.length > 0 ? (
                  <StCandidateHead>이 기기에서 찾은 방</StCandidateHead>
                ) : null}
                {candidates.map((candidate) => (
                  <StRoomCard key={candidate.roomId}>
                    <StRoomLabel>{candidate.label}</StRoomLabel>
                    <StActions>
                      <StPrimaryBtn
                        type="button"
                        disabled={busy === `${service}:add`}
                        onClick={() =>
                          void addRoomDirect(
                            service,
                            candidate.roomId,
                            candidate.label,
                          )
                        }
                      >
                        등록
                      </StPrimaryBtn>
                    </StActions>
                  </StRoomCard>
                ))}
                <StRoomAddRow>
                  <StRoomInput
                    value={roomInputs[service] || ""}
                    onChange={(e) =>
                      setRoomInputs((prev) => ({
                        ...prev,
                        [service]: e.target.value,
                      }))
                    }
                    placeholder="방 주소(URL) 또는 방 번호"
                  />
                  <StPrimaryBtn
                    type="button"
                    disabled={busy === `${service}:add`}
                    onClick={() => void addRoom(service)}
                  >
                    추가
                  </StPrimaryBtn>
                </StRoomAddRow>
              </StRoomGroup>
            );
          })}
        </StRoomsSection>
      </StCard>
    </StPage>
  );
}

export default function AccountPage() {
  return <AccountContent />;
}

const StPage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: start center;
  padding: 1.25rem;
  background: #f6f6f6;
`;

const StCard = styled.section`
  width: min(100%, 30rem);
  padding: 1.4rem;
  border-radius: 1.4rem;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(56, 58, 61, 0.1);
`;

const StHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StHello = styled.h1`
  font-size: 1.2rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StSub = styled.p`
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.5;
`;

const StLogout = styled.button`
  flex-shrink: 0;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const StServiceRow = styled.div`
  border: 1px solid #edeeef;
  border-radius: 14px;
  padding: 0.85rem;
`;

const StServiceHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
`;

const StServiceName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  .icon {
    font-size: 1.05rem;
  }
`;

const StLinkedTag = styled.span`
  flex-shrink: 0;
  font-size: 0.74rem;
  font-weight: 800;
  color: #3182f6;
`;

const StActions = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const StPrimaryBtn = styled.button`
  border: none;
  background: #3182f6;
  color: #ffffff;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    background: #cdd2d9;
  }
`;

const StGhostBtn = styled.button`
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #8a8e95;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
`;

const StRoomInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 1px solid #e2e3e5;
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: #a9c0f5;
  }
`;

const StHint = styled.p`
  font-size: 0.78rem;
  color: #979ba1;
  line-height: 1.5;
`;

const StRoomsSection = styled.div`
  margin-top: 1.4rem;
  padding-top: 1.2rem;
  border-top: 1px solid #edeeef;
`;

const StRoomsTitle = styled.h2`
  font-size: 1.02rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StRoomsSub = styled.p`
  margin-top: 0.25rem;
  margin-bottom: 0.9rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.5;
`;

const StRoomGroup = styled.div`
  & + & {
    margin-top: 1rem;
  }
`;

const StRoomGroupHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  .icon {
    font-size: 1.05rem;
  }
`;

const StRoomCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border: 1px solid #edeeef;
  border-radius: 14px;
  padding: 0.7rem 0.85rem;

  & + & {
    margin-top: 0.5rem;
  }
`;

const StCandidateHead = styled.p`
  margin-top: 0.7rem;
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StRoomAddRow = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
`;

const StRoomLabel = styled.span`
  min-width: 0;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
