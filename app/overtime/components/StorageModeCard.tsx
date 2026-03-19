import { OvertimeRoomInfo } from "@/hooks/useOvertimePersistence";
import { StorageMode } from "@/app/overtime/types";
import {
  ConnectedRoomCard,
  ConnectedRoomInfo,
  DangerGhostButton,
  SecondaryButton,
  StorageActions,
  StorageCard,
  StorageDescription,
  StorageHeader,
  StorageHint,
  StorageInlineField,
  StorageInput,
  StorageLabel,
  StorageModeButton,
  StorageModeTabs,
  StorageSetupCard,
  StorageSetupGrid,
  StorageTitle,
} from "@/app/overtime/components/styles";

interface StorageModeCardProps {
  storageMode: StorageMode;
  serverRoom: OvertimeRoomInfo | null;
  roomNameInput: string;
  roomCodeInput: string;
  isServerLoading: boolean;
  onChangeStorageMode: (mode: StorageMode) => void;
  onChangeRoomNameInput: (value: string) => void;
  onChangeRoomCodeInput: (value: string) => void;
  onCreateServerRoom: () => void;
  onConnectServerRoom: () => void;
  onCopyRoomCode: () => void;
  onDisconnectServerRoom: () => void;
}

export default function StorageModeCard({
  storageMode,
  serverRoom,
  roomNameInput,
  roomCodeInput,
  isServerLoading,
  onChangeStorageMode,
  onChangeRoomNameInput,
  onChangeRoomCodeInput,
  onCreateServerRoom,
  onConnectServerRoom,
  onCopyRoomCode,
  onDisconnectServerRoom,
}: StorageModeCardProps) {
  return (
    <StorageCard>
      <StorageHeader>
        <div>
          <StorageTitle>기록 저장 방식</StorageTitle>
          <StorageDescription>
            {storageMode === "local"
              ? "바로 기록하고 이 브라우저에만 저장할 수 있어요."
              : serverRoom
                ? "서버 저장 방에 연결되어 있어서 다른 브라우저에서도 같은 기록을 불러올 수 있어요."
                : "서버 저장 방을 만들거나 방 코드로 연결하면 기록을 서버에 저장할 수 있어요."}
          </StorageDescription>
        </div>
        <StorageModeTabs>
          <StorageModeButton
            type="button"
            $isActive={storageMode === "local"}
            onClick={() => onChangeStorageMode("local")}
          >
            로컬 저장
          </StorageModeButton>
          <StorageModeButton
            type="button"
            $isActive={storageMode === "server"}
            onClick={() => onChangeStorageMode("server")}
          >
            서버 저장
          </StorageModeButton>
        </StorageModeTabs>
      </StorageHeader>

      {storageMode === "server" ? (
        serverRoom ? (
          <ConnectedRoomCard>
            <ConnectedRoomInfo>
              <span>연결된 방</span>
              <strong>{serverRoom.roomName}</strong>
              <small>{serverRoom.roomRef}</small>
            </ConnectedRoomInfo>
            <StorageActions>
              <SecondaryButton
                type="button"
                onClick={onCopyRoomCode}
                disabled={isServerLoading}
              >
                코드 복사
              </SecondaryButton>
              <SecondaryButton
                type="button"
                onClick={onConnectServerRoom}
                disabled={isServerLoading}
              >
                다시 불러오기
              </SecondaryButton>
              <DangerGhostButton
                type="button"
                onClick={onDisconnectServerRoom}
                disabled={isServerLoading}
              >
                연결 해제
              </DangerGhostButton>
            </StorageActions>
          </ConnectedRoomCard>
        ) : (
          <StorageSetupGrid>
            <StorageSetupCard>
              <StorageLabel>새 서버 방 만들기</StorageLabel>
              <StorageInlineField>
                <StorageInput
                  placeholder="예: 2026년 야근 기록"
                  value={roomNameInput}
                  onChange={(event) => onChangeRoomNameInput(event.target.value)}
                  disabled={isServerLoading}
                />
                <SecondaryButton
                  type="button"
                  onClick={onCreateServerRoom}
                  disabled={isServerLoading}
                >
                  방 만들기
                </SecondaryButton>
              </StorageInlineField>
            </StorageSetupCard>

            <StorageSetupCard>
              <StorageLabel>기존 서버 방 불러오기</StorageLabel>
              <StorageInlineField>
                <StorageInput
                  placeholder="방 코드 입력"
                  value={roomCodeInput}
                  onChange={(event) => onChangeRoomCodeInput(event.target.value)}
                  disabled={isServerLoading}
                />
                <SecondaryButton
                  type="button"
                  onClick={onConnectServerRoom}
                  disabled={isServerLoading}
                >
                  불러오기
                </SecondaryButton>
              </StorageInlineField>
            </StorageSetupCard>
          </StorageSetupGrid>
        )
      ) : (
        <StorageHint>
          로컬 저장은 지금 쓰고 있는 브라우저에서만 유지돼요. 다른 기기에서도
          이어서 보고 싶다면 서버 저장 방을 연결해보세요.
        </StorageHint>
      )}
    </StorageCard>
  );
}
