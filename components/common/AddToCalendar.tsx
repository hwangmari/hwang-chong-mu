// components/AddToCalendar.tsx
import React from "react";

type Props = {
  title: string;
  finalDate: string; // 예: "2025-12-10" (YYYY-MM-DD 형식)
};

const AddToCalendar = ({ title, finalDate }: Props) => {
  // 날짜 문자열에서 하이픈 제거 (YYYYMMDD)
  const cleanDate = finalDate.replace(/-/g, "");

  // 1. 구글 캘린더 링크 생성
  const handleGoogleCalendar = () => {
    // 구글은 끝나는 날짜를 다음날로 잡아야 해당일 하루종일로 잡힘
    // 혹은 시작일/종료일을 똑같이 YYYYMMDD 형태로 보내면 하루종일로 인식하기도 함
    // 가장 확실한 방법: 시작일(YYYYMMDD) / 종료일(YYYYMMDD + 1일)

    const dateObj = new Date(finalDate);
    dateObj.setDate(dateObj.getDate() + 1); // 하루 더하기
    const nextDay = dateObj.toISOString().split("T")[0].replace(/-/g, "");

    const dates = `${cleanDate}/${nextDay}`; // YYYYMMDD/YYYYMMDD (시간 없음)

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent("황총무 연구소 약속")}`;

    window.open(url, "_blank");
  };

  // 2. .ics 파일 생성 (카카오/애플 호환)
  const handleICalendar = () => {
    // 종료일 계산 (다음날)
    const dateObj = new Date(finalDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextDay = dateObj.toISOString().split("T")[0].replace(/-/g, "");

    // iCal 형식에서 하루 종일은 VALUE=DATE 속성을 씁니다.
    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hwang Lab//Promise Keeper//KO
BEGIN:VEVENT
UID:${new Date().getTime()}@hwang-lab.kr
DTSTAMP:${cleanDate}T000000Z
DTSTART;VALUE=DATE:${cleanDate}
DTEND;VALUE=DATE:${nextDay}
SUMMARY:${title}
DESCRIPTION:황총무 연구소에서 확정된 약속입니다.
END:VEVENT
END:VCALENDAR`.trim();

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2 justify-center mt-4 ">
      <button
        onClick={handleGoogleCalendar}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
      >
        Google 캘린더 저장
      </button>
      <button
        onClick={handleICalendar}
        className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition text-sm font-medium"
      >
        내 폰 캘린더에 저장 📅
      </button>
    </div>
  );
};

export default AddToCalendar;
