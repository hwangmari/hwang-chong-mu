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

  // ✅ ref 사용: 모달이 열린 상태에서 다시 열려도 이전 Promise가 미해결로 남지 않도록 관리
  const resolverRef = useRef<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    resolverRef.current?.resolve(false); // 취소 시 false 반환
    resolverRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    resolverRef.current?.resolve(true); // 확인 시 true 반환
    resolverRef.current = null;
  }, []);

  const openAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current?.resolve(false); // 이미 열린 모달이 있으면 먼저 해제(Promise 영구 미해결 방지)
      setModalState({ isOpen: true, type: "alert", message });
      resolverRef.current = { resolve: () => resolve() };
    });
  }, []);

  const openConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current?.resolve(false); // 이미 열린 모달이 있으면 먼저 해제(Promise 영구 미해결 방지)
      setModalState({ isOpen: true, type: "confirm", message });
      resolverRef.current = { resolve }; // handleConfirm에서 true, handleClose에서 false 호출됨
    });
  }, []);

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
