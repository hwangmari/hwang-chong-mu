import type { Metadata } from "next";
import WorkoutShell from "./components/WorkoutShell";
import { byId } from "@/lib/services";

// 제목·설명은 lib/services.ts(서비스 단일 출처)에서 가져온다.
const service = byId("workout");

export const metadata: Metadata = {
  title: service.seoTitle,
  description: service.seoDescription,
};

export default function WorkoutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <WorkoutShell>{children}</WorkoutShell>;
}
