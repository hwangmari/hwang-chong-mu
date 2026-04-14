"use client";

import React from "react";
import styled, { css } from "styled-components";

type Props = {
  title: string;
  finalDate: string; // 예: "2025-12-10"
};

const AddToCalendar = ({ title, finalDate }: Props) => {
  const cleanDate = finalDate.replace(/-/g, "");

  const handleGoogleCalendar = () => {
    const dateObj = new Date(finalDate);
    dateObj.setDate(dateObj.getDate() + 1); // 하루 더하기
    const nextDay = dateObj.toISOString().split("T")[0].replace(/-/g, "");

    const dates = `${cleanDate}/${nextDay}`; // YYYYMMDD/YYYYMMDD

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent("황총무 연구소 약속")}`;

    window.open(url, "_blank");
  };

  const handleICalendar = () => {
    const dateObj = new Date(finalDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextDay = dateObj.toISOString().split("T")[0].replace(/-/g, "");

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
    <StContainer>
      <StCalendarButton onClick={handleGoogleCalendar} $variant="google">
        Google 캘린더 저장
      </StCalendarButton>
      <StCalendarButton onClick={handleICalendar} $variant="ical">
        내 폰 캘린더에 저장 📅
      </StCalendarButton>
    </StContainer>
  );
};

export default AddToCalendar;


const StContainer = styled.div`
  display: flex;
  gap: 0.5rem; /* gap-2 */
  justify-content: center;
  margin-top: 1rem; /* mt-4 */
`;

const StCalendarButton = styled.button<{ $variant: "google" | "ical" }>`
  padding: 0.5rem 1rem; /* px-4 py-2 */
  border-radius: 0.25rem; /* rounded (4px) */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  transition: background-color 0.2s;
  color: ${({ $variant, theme }) => ($variant === "google" ? theme.colors.white : theme.colors.black)};

  ${({ $variant }) =>
    $variant === "google"
      ? css`
          background-color: ${({ theme }) => theme.colors.blue500}; /* blue-500 */
          &:hover {
            background-color: ${({ theme }) => theme.colors.blue600}; /* blue-600 */
          }
        `
      : css`
          background-color: ${({ theme }) => theme.colors.yellow400}; /* yellow-400 */
          &:hover {
            background-color: ${({ theme }) => theme.colors.yellow500}; /* yellow-500 */
          }
        `}
`;
