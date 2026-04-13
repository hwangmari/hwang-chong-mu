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

export function useOvertimeStorage() {
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
  const [roomNameInput, setRoomNameInput] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");

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
        setRoomCodeInput(loaded.room.roomRef);
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
        alert("먼저 서버 저장 방을 연결해주세요.");
        return false;
      }

      const mergedRecords = mergeRecordsByDate(nextRecords);
      await replaceRoomRecords(serverRoom.id, mergedRecords);
      setServerRecords(mergedRecords);
      return true;
    },
    [replaceRoomRecords, serverRoom],
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
      setRoomCodeInput(loaded.room.roomRef);
      setStorageMode("server");

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ROOM_KEY, loaded.room.roomRef);
      }
    },
    [fetchRoomData],
  );

  const handleCreateServerRoom = useCallback(async () => {
    if (!roomNameInput.trim()) {
      alert("방 이름을 입력해주세요.");
      return;
    }

    try {
      const room = await createRoom(roomNameInput.trim());
      setRoomNameInput("");
      await connectServerRoom(room.roomRef);
    } catch (error) {
      console.error("야근 방 생성에 실패했습니다.", error);
      alert("방 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [connectServerRoom, createRoom, roomNameInput]);

  const handleConnectServerRoom = useCallback(async () => {
    if (!roomCodeInput.trim()) {
      alert("방 코드를 입력해주세요.");
      return;
    }

    try {
      await connectServerRoom(roomCodeInput.trim());
    } catch (error) {
      console.error("야근 방 연결에 실패했습니다.", error);
      alert("방을 불러오지 못했어요. 방 코드를 다시 확인해주세요.");
    }
  }, [connectServerRoom, roomCodeInput]);

  const handleDisconnectServerRoom = useCallback(() => {
    setServerRoom(null);
    setServerRecords([]);
    setRoomCodeInput("");
    setStorageMode("local");

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_ROOM_KEY);
    }
  }, []);

  const handleCopyRoomCode = useCallback(async () => {
    if (!serverRoom) {
      return;
    }

    try {
      await navigator.clipboard.writeText(serverRoom.roomRef);
      alert("방 코드를 복사했어요.");
    } catch (error) {
      console.error("방 코드 복사에 실패했습니다.", error);
      alert("방 코드 복사에 실패했어요.");
    }
  }, [serverRoom]);

  return {
    records,
    storageMode,
    setStorageMode,
    serverRoom,
    isServerLoading,
    roomNameInput,
    setRoomNameInput,
    roomCodeInput,
    setRoomCodeInput,
    persistRecords,
    handleCreateServerRoom,
    handleConnectServerRoom,
    handleDisconnectServerRoom,
    handleCopyRoomCode,
  };
}
