"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import Modal from "./Modal"; // ✅ 기존에 만드신 Modal 컴포넌트 재사용
import { ModalState } from "@/types"; // ✅ types/index.ts에 정의된 타입 활용

interface ModalContextType {
  openAlert: (message: string) => Promise<void>;
  openConfirm: (message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
  });

  // ✅ 모달이 열린 상태에서 새 요청이 오면 이전 모달을 강제 취소하지 않고 큐에 쌓아 순차 표시
  //    (각 Promise는 자기 모달이 닫힐 때 해결되므로 영구 미해결도, 조용한 취소도 없음)
  type ModalRequest = {
    type: "alert" | "confirm";
    message: string;
    resolve: (value: boolean) => void;
  };
  const queueRef = useRef<ModalRequest[]>([]);
  const currentRef = useRef<ModalRequest | null>(null);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    currentRef.current = next;
    if (next) {
      setModalState({ isOpen: true, type: next.type, message: next.message });
    } else {
      setModalState((prev) => ({ ...prev, isOpen: false }));
    }
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      currentRef.current?.resolve(value);
      currentRef.current = null;
      showNext();
    },
    [showNext],
  );

  const handleClose = useCallback(() => settle(false), [settle]); // 취소 시 false 반환
  const handleConfirm = useCallback(() => settle(true), [settle]); // 확인 시 true 반환

  const enqueue = useCallback(
    (type: "alert" | "confirm", message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        queueRef.current.push({ type, message, resolve });
        if (!currentRef.current) showNext();
      });
    },
    [showNext],
  );

  const openAlert = useCallback(
    (message: string): Promise<void> =>
      enqueue("alert", message).then(() => undefined),
    [enqueue],
  );

  const openConfirm = useCallback(
    (message: string): Promise<boolean> => enqueue("confirm", message),
    [enqueue],
  );

  return (
    <ModalContext.Provider value={{ openAlert, openConfirm }}>
      {children}
      {/* 👇 전역 위치에 모달 배치 (항상 최상위에 뜸) */}
      <Modal
        modal={modalState}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
