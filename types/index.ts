export interface UserVote {
  id?: string; // DB ID (가끔 없을 수도 있으니 선택적으로 둠)
  name: string;
  unavailableDates: Date[];
  isAbsent: boolean; // ✅ 물음표(?) 제거! 무조건 true 아니면 false
}

export interface ModalState {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
}
