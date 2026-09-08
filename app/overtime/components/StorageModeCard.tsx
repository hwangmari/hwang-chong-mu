import Link from "next/link";
import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import type { AppUser } from "@/hooks/useAuth";
import {
  SecondaryButton,
  StorageActions,
  StorageCard,
  StorageDescription,
  StorageHeader,
  StorageHint,
  StorageLoginLink,
  StorageTitle,
} from "@/app/overtime/components/styles";

interface StorageModeCardProps {
  user: AppUser | null;
  authLoading: boolean;
  serverRoom: OvertimeRoomInfo | null;
  isServerLoading: boolean;
  onReloadServerRoom: () => void;
}

// 기록이 어디에 저장되는지 알려 주는 카드.
// 로그인 전: 이 브라우저에만 저장 + 로그인 유도. 로그인 후: 계정에 자동 저장 (방 이름·코드 없음).
export default function StorageModeCard({
  user,
  authLoading,
  serverRoom,
  isServerLoading,
  onReloadServerRoom,
}: StorageModeCardProps) {
  if (authLoading) {
    return (
      <StorageCard aria-busy="true">
        <StorageHeader>
          <div>
            <StorageTitle>기록 저장</StorageTitle>
            <StorageDescription>계정을 확인하고 있어요…</StorageDescription>
          </div>
        </StorageHeader>
      </StorageCard>
    );
  }

  if (!user) {
    return (
      <StorageCard>
        <StorageHeader>
          <div>
            <StorageTitle>기록 저장</StorageTitle>
            <StorageDescription>
              지금은 이 브라우저에만 저장돼요. 로그인하면 내 계정에 저장돼 폰과 PC에서 이어서 볼 수 있어요.
            </StorageDescription>
          </div>
          <StorageLoginLink as={Link} href="/login">
            로그인하고 이어서 쓰기
          </StorageLoginLink>
        </StorageHeader>
        <StorageHint>
          로그인하면 이 브라우저에 적어 둔 기록도 계정으로 함께 옮겨져요.
        </StorageHint>
      </StorageCard>
    );
  }

  return (
    <StorageCard>
      <StorageHeader>
        <div>
          <StorageTitle>내 계정에 저장 중</StorageTitle>
          <StorageDescription>
            {serverRoom
              ? `${user.nickname} 계정에 저장돼요. 어느 기기에서 로그인해도 같은 기록이 보여요.`
              : "계정의 기록장을 연결하고 있어요…"}
          </StorageDescription>
        </div>
        {serverRoom && (
          <StorageActions>
            <SecondaryButton
              type="button"
              onClick={onReloadServerRoom}
              disabled={isServerLoading}
            >
              다시 불러오기
            </SecondaryButton>
          </StorageActions>
        )}
      </StorageHeader>
    </StorageCard>
  );
}
