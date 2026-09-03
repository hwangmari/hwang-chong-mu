// 야근 계산기 페이지용 훅.
// 실제 조회·저장은 services/overtime.ts에 있고, 여기서는 로딩 상태만 감싼다.
// (홈 대시보드도 같은 services 함수를 써서 계산 규칙·응답 해석이 갈라지지 않게 한다)
import { useCallback, useState } from "react";
import {
  createOvertimeRoom,
  fetchOvertimeRoomData,
  replaceOvertimeRoomRecords,
  type OvertimeRoomInfo,
  type OvertimeRoomRecord,
} from "@/services/overtime";

export type { OvertimeRoomInfo, OvertimeRoomRecord };

export function useOvertimePersistence() {
  const [loading, setLoading] = useState(false);

  const createRoom = useCallback(async (roomName: string) => {
    setLoading(true);
    try {
      return await createOvertimeRoom(roomName);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoomData = useCallback(async (roomRef: string) => {
    setLoading(true);
    try {
      return await fetchOvertimeRoomData(roomRef);
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceRoomRecords = useCallback(
    async (roomId: string, records: OvertimeRoomRecord[]) => {
      setLoading(true);
      try {
        await replaceOvertimeRoomRecords(roomId, records);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createRoom,
    fetchRoomData,
    replaceRoomRecords,
    loading,
  };
}
