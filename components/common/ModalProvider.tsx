"use client";

import {
  createContext,
  useContext,
  useState,
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

  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolver) resolver.resolve(false); // 취소 시 false 반환
    setResolver(null);
  }, [resolver]);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolver) resolver.resolve(true); // 확인 시 true 반환
    setResolver(null);
  }, [resolver]);

  const openAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({ isOpen: true, type: "alert", message });
      setResolver({ resolve: () => resolve() });
    });
  }, []);

  const openConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({ isOpen: true, type: "confirm", message });
      setResolver({ resolve }); // handleConfirm에서 true, handleClose에서 false 호출됨
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
