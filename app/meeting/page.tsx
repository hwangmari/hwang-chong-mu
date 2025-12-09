"use client";

import FooterTips from "@/components/create-room/FooterTips";
import Header from "@/components/create-room/Header";
import RoomForm from "@/components/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";

export default function CreateRoomPage() {
  const {
    formData,
    loading,
    handleChange,
    createRoom,
    isCustomPeriod, // 🔥 추가
    setIsCustomPeriod, // 🔥 추가
  } = useCreateRoom();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <Header />

        <RoomForm
          formData={formData}
          loading={loading}
          onChange={handleChange}
          onSubmit={createRoom}
          isCustomPeriod={isCustomPeriod} // 🔥 전달
          setIsCustomPeriod={setIsCustomPeriod} // 🔥 전달
        />
      </div>
      <FooterTips />
    </div>
  );
}
