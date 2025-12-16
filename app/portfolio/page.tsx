"use client";

import ProjectCard from "./ProjectCard";
import PortfolioInfo from "./PortfolioInfo";
import ResumeSection from "./ResumeSection"; // 👈 [추가]

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-200">
      {/* 1. 헤더 */}
      <PortfolioInfo />
      <div className="border"></div>
      {/* 2. 이력서 섹션 */}
      <ResumeSection />
      {/* 3. 프로젝트 섹션 */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-10 flex items-center gap-2">
            🚀 Toy Projects
          </h2>

          <div className="space-y-12">
            <ProjectCard
              title="황총무의 약속 잡기 (Hwang's Planner)"
              category="Service"
              period="2025.12.01 - 진행 중 (1인 개발)"
              linkUrl="/meeting"
              description={
                <>
                  단톡방에서 약속 날짜를 잡을 때 발생하는 <b>"무한 되묻기"</b>{" "}
                  문제를 해결하기 위해 개발한 <b>소거법 기반 스케줄러</b>입니다.
                  '되는 날'을 찾는 대신 '안 되는 날'을 제거하는 역발상 UX로 약속
                  확정 시간을 단축시켰습니다.
                </>
              }
              techStack={[
                "Next.js 14",
                "TypeScript",
                "Tailwind CSS",
                "Supabase",
                "Vercel",
                "Google AdSense",
              ]}
              details={{
                problem:
                  "다수 인원의 일정 조율 시, 긍정 응답(되는 날)만으로는 교집합을 찾기 어렵고 시간이 오래 걸림.",
                solution:
                  "불가능한 날짜(Unavailable Dates)를 우선 소거하여 남는 날짜를 도출하는 로직 구현.",
                tech: "3주치 동적 캘린더 알고리즘 구현 (date-fns), SEO 최적화를 통한 애드센스 승인.",
              }}
            />
          </div>
        </div>
      </section>
      {/* 4. 푸터 */}
      <footer className="py-10 text-center text-gray-400 text-xs">
        © 2025 Hwang Hye kyeong. All rights reserved.
      </footer>
    </div>
  );
}
