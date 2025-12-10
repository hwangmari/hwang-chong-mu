// types/index.ts
export type UserVote = {
  id?: string;
  name: string;
  unavailableDates: Date[];
  isAbsent?: boolean;
};

export type ModalState = {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
};
