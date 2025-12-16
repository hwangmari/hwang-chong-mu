"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ProjectCardProps {
  title: string;
  category: string;
  period: string;
  linkUrl: string;
  description: ReactNode; // HTML 태그(<b> 등)를 포함하기 위해 ReactNode 사용
  techStack: string[];
  details: {
    problem: string;
    solution: string;
    tech: string;
  };
}

export default function ProjectCard({
  title,
  category,
  period,
  linkUrl,
  description,
  techStack,
  details,
}: ProjectCardProps) {
  return (
    <article className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      {/* 상단: 제목 및 링크 */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
              {category}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{period}</p>
        </div>
        <Link
          href={linkUrl}
          className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition flex items-center gap-2"
        >
          서비스 바로가기 🔗
        </Link>
      </div>

      {/* 설명 및 기술 스택 */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed mb-4 text-sm md:text-base">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 상세 내용 (Problem / Solution / Tech) */}
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-sm text-gray-700 space-y-3">
        <p>
          <b className="text-blue-600">Problem:</b> {details.problem}
        </p>
        <p>
          <b className="text-blue-600">Solution:</b> {details.solution}
        </p>
        <p>
          <b className="text-blue-600">Tech:</b> {details.tech}
        </p>
      </div>
    </article>
  );
}
