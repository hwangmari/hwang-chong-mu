"use client";

import { useState } from "react";
import { experiences } from "@/app/data/experiences";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProjectItem from "./ProjectItem";

// 메인 페이지 컴포넌트
export default function ExperienceDetail() {
  const params = useParams();
  const id = params.id as string;
  const data = experiences.find((exp) => exp.id === id);

  if (!data) {
    return (
      <div className="text-center py-20">찾을 수 없는 페이지입니다. 😢</div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans bg-gray-100">
      {/* 1. 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link
            href="/portfolio"
            className="text-gray-400 hover:text-gray-900 text-sm mb-6 inline-block transition-colors"
          >
            ← 포트폴리오 메인으로 돌아가기
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-3 h-3 rounded-full ${data.color}`} />
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {data.company}
            </h1>
          </div>
          <p className="text-xl text-gray-600 font-bold mb-1">{data.role}</p>
          <p className="text-gray-400 text-sm">{data.period}</p>
        </div>
      </div>

      {/* 2. 상세 프로젝트 리스트 */}
      <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in-up  ">
        <h2 className="text-2xl font-bold mb-8">🔥 Key Projects</h2>

        <div className="space-y-12">
          {data.projects.map((project, idx) => (
            // 분리한 컴포넌트 사용
            <ProjectItem key={idx} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
