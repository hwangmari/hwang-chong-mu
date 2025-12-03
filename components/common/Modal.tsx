import { ModalState } from "@/types";

interface Props {
  modal: ModalState;
  onClose: () => void;
  onConfirm: () => void;
}

export default function Modal({ modal, onClose, onConfirm }: Props) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xs sm:max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all scale-100 animate-bounce-small">
        <div className="text-center">
          <div className="text-4xl mb-4">🐰</div>
          <h3 className="text-lg font-extrabold text-gray-900 whitespace-pre-line mb-2 leading-relaxed">
            {modal.message}
          </h3>
          <div className="flex gap-3 mt-6">
            {modal.type === "confirm" && (
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                취소
              </button>
            )}
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
