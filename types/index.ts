export interface UserVote {
  id: string | number;
  name: string;
  unavailableDates: Date[];
  isAbsent: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
}

export interface Habit {
  id: number;
  title: string;
  icon: string;
}

export interface HabitLog {
  habit_id: number;
  completed_at: string;
}

export type ExpenseType = "COMMON" | "PERSONAL";

// 지출 내역 인터페이스
export interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}
export interface GoalComment {
  id: number;
  goal_id: number;
  nickname: string;
  content: string;
  created_at: string;
}
