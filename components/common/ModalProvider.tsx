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

// 1. Context에서 사용할 함수 타입 정의
interface ModalContextType {
  openAlert: (message: string) => Promise<void>;
  openConfirm: (message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

// 2. Provider 컴포넌트
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
  });

  // 사용자의 응답(확인/취소)을 기다리는 Promise의 resolve 함수를 저장
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  // 닫기/취소 버튼 핸들러
  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolver) resolver.resolve(false); // 취소 시 false 반환
    setResolver(null);
  }, [resolver]);

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolver) resolver.resolve(true); // 확인 시 true 반환
    setResolver(null);
  }, [resolver]);

  // ✅ Alert 열기 (비동기로 닫힐 때까지 대기 가능)
  const openAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({ isOpen: true, type: "alert", message });
      // Alert은 true/false 결과가 중요하지 않으므로 닫히면 무조건 resolve
      setResolver({ resolve: () => resolve() });
    });
  }, []);

  // ✅ Confirm 열기 (사용자가 '확인'을 눌렀는지 true/false로 반환)
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

// 3. 커스텀 훅 (편의성)
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
