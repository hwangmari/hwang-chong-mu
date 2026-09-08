"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useOvertimePersistence,
  type OvertimeRoomInfo,
} from "@/hooks/useOvertimePersistence";
import {
  STORAGE_KEY,
  STORAGE_MODE_KEY,
  STORAGE_ROOM_KEY,
} from "./constants";
import { OvertimeRecord, StorageMode } from "./types";
import { mergeRecordsByDate, parseStoredRecords } from "./utils";
import { useModal } from "@/components/common/ModalProvider";
import { linkRoomToAccount, type RoomService } from "@/lib/roomServices";
import { useAuth } from "@/hooks/useAuth";

// 계정에 등록된 방 한 줄 (/api/auth/rooms)
type LinkedRoom = { id: string; service: RoomService; roomId: string; label: string };

export function useOvertimeStorage() {
  const { openAlert } = useModal();
  const { user, loading: authLoading } = useAuth();
  const {
    createRoom,
    fetchRoomData,
    replaceRoomRecords,
    loading: isServerLoading,
  } = useOvertimePersistence();

  const hasLoadedClientStateRef = useRef(false);
  const [storageMode, setStorageMode] = useState<StorageMode>("local");
  const [serverRoom, setServerRoom] = useState<OvertimeRoomInfo | null>(null);
  const [localRecords, setLocalRecords] = useState<OvertimeRecord[]>([]);
  const [serverRecords, setServerRecords] = useState<OvertimeRecord[]>([]);
  // 계정 자동 연결이 진행 중인지 (로그인 직후 방을 찾거나 만드는 동안)
  const [isLinking, setIsLinking] = useState(false);
  const linkedUserIdRef = useRef<string | null>(null);

  const records = storageMode === "server" ? serverRecords : localRecords;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStorageMode(
        localStorage.getItem(STORAGE_MODE_KEY) === "server" ? "server" : "local",
      );
      setLocalRecords(parseStoredRecords(localStorage.getItem(STORAGE_KEY)));
      hasLoadedClientStateRef.current = true;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedRoomRef = localStorage.getItem(STORAGE_ROOM_KEY);
    if (!savedRoomRef) {
      return;
    }

    let cancelled = false;

    const restoreRoom = async () => {
      try {
        const loaded = await fetchRoomData(savedRoomRef);
        if (cancelled) {
          return;
        }

        setServerRoom(loaded.room);
        setServerRecords(mergeRecordsByDate(loaded.records));
      } catch (error) {
        console.error("저장된 서버 방을 불러오지 못했습니다.", error);
        if (!cancelled) {
          localStorage.removeItem(STORAGE_ROOM_KEY);
          setStorageMode("local");
        }
      }
    };

    void restoreRoom();

    return () => {
      cancelled = true;
    };
  }, [fetchRoomData]);

  useEffect(() => {
    if (typeof window !== "undefined" && hasLoadedClientStateRef.current) {
      localStorage.setItem(STORAGE_MODE_KEY, storageMode);
    }
  }, [storageMode]);

  const persistLocalRecords = useCallback((nextRecords: OvertimeRecord[]) => {
    const mergedRecords = mergeRecordsByDate(nextRecords);
    setLocalRecords(mergedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
  }, []);

  const persistServerRecords = useCallback(
    async (nextRecords: OvertimeRecord[]) => {
      if (!serverRoom) {
        await openAlert("계정 연결이 아직 안 끝났어요. 잠시 후 다시 저장해 주세요.");
        return false;
      }

      const mergedRecords = mergeRecordsByDate(nextRecords);
      await replaceRoomRecords(serverRoom.id, mergedRecords);
      setServerRecords(mergedRecords);
      return true;
    },
    [openAlert, replaceRoomRecords, serverRoom],
  );

  const persistRecords = useCallback(
    async (nextRecords: OvertimeRecord[]) => {
      if (storageMode === "server") {
        return persistServerRecords(nextRecords);
      }

      persistLocalRecords(nextRecords);
      return true;
    },
    [persistLocalRecords, persistServerRecords, storageMode],
  );

  const connectServerRoom = useCallback(
    async (roomRef: string) => {
      const loaded = await fetchRoomData(roomRef);
      const mergedRecords = mergeRecordsByDate(loaded.records);

      setServerRoom(loaded.room);
      setServerRecords(mergedRecords);
      setStorageMode("server");

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROOM_KEY, loaded.room.roomRef);
      }

      // 방을 새로 만들었을 때도, 방 코드로 연결했을 때도 여기를 지난다.
      // 로그인 사용자면 내 계정의 "내 방"에 방 코드만 등록한다(비로그인은 서버가 401 → 무시).
      linkRoomToAccount("overtime", loaded.room.roomRef, loaded.room.roomName);
    },
    [fetchRoomData],
  );

  // 로그인하면 계정의 야근 방을 자동으로 찾아 연결하고, 없으면 만든다.
  // 방 이름·방 코드를 사람이 다룰 일이 없다 (2026-09-08 통합 로그인 방식으로 전환).
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // 로그아웃: 이 브라우저에만 남는 로컬 기록으로 돌아간다 (같은 기기의 다른 사람에게 내 기록이 보이지 않게)
      if (linkedUserIdRef.current) {
        linkedUserIdRef.current = null;
        setServerRoom(null);
        setServerRecords([]);
        setStorageMode("local");
        localStorage.removeItem(STORAGE_ROOM_KEY);
      }
      return;
    }

    if (linkedUserIdRef.current === user.id) return;
    linkedUserIdRef.current = user.id;

    let cancelled = false;
    const link = async () => {
      setIsLinking(true);
      try {
        const res = await fetch("/api/auth/rooms");
        const data: { rooms?: LinkedRoom[] } = res.ok ? await res.json() : { rooms: [] };
        const mine = (data.rooms ?? []).filter((room) => room.service === "overtime");

        let roomRef = mine[0]?.roomId ?? "";
        if (!roomRef) {
          const created = await createRoom(`${user.nickname}의 야근 기록`);
          roomRef = created.roomRef;
        }
        if (cancelled) return;

        // 이 브라우저에 로컬로만 적어 둔 기록이 있으면 계정 방에 합쳐서 잃어버리지 않게 한다
        const localOnly = parseStoredRecords(localStorage.getItem(STORAGE_KEY));
        const loaded = await fetchRoomData(roomRef);
        if (cancelled) return;
        let merged = mergeRecordsByDate(loaded.records);
        if (localOnly.length > 0) {
          const known = new Set(merged.map((record) => record.date));
          const toImport = localOnly.filter((record) => !known.has(record.date));
          if (toImport.length > 0) {
            merged = mergeRecordsByDate([...merged, ...toImport]);
            await replaceRoomRecords(loaded.room.id, merged);
          }
        }
        if (cancelled) return;

        setServerRoom(loaded.room);
        setServerRecords(merged);
        setStorageMode("server");
        localStorage.setItem(STORAGE_ROOM_KEY, loaded.room.roomRef);
        linkRoomToAccount("overtime", loaded.room.roomRef, loaded.room.roomName);
      } catch (error) {
        console.error("계정 야근 방 연결에 실패했습니다.", error);
        if (!cancelled) {
          linkedUserIdRef.current = null;
          await openAlert("계정에 기록을 연결하지 못했어요. 잠시 후 새로고침해 주세요.");
        }
      } finally {
        if (!cancelled) setIsLinking(false);
      }
    };
    void link();

    return () => {
      cancelled = true;
    };
  }, [authLoading, createRoom, fetchRoomData, openAlert, replaceRoomRecords, user]);

  // 계정 방을 서버에서 다시 읽는다 (다른 기기에서 적은 뒤 새로고침 대신)
  const handleReloadServerRoom = useCallback(async () => {
    if (!serverRoom) return;
    try {
      await connectServerRoom(serverRoom.roomRef);
    } catch (error) {
      console.error("야근 기록 다시 불러오기에 실패했습니다.", error);
      await openAlert("기록을 다시 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [connectServerRoom, openAlert, serverRoom]);

  return {
    records,
    storageMode,
    serverRoom,
    isServerLoading: isServerLoading || isLinking,
    user,
    authLoading,
    persistRecords,
    handleReloadServerRoom,
  };
}
