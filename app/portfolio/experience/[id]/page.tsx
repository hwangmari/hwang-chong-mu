"use client";

import { experiences } from "@/app/data/experiences";
import Link from "next/link";
import { useParams } from "next/navigation";

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
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* 1. 헤더 */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link
            href="/portfolio"
            className="text-gray-500 hover:text-gray-900 text-sm mb-6 inline-block"
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
      <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-8">🔥 Key Projects</h2>

        <div className="space-y-12">
          {data.projects.map((project, idx) => (
            <div
              key={idx}
              className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {project.title}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {project.period}
                </span>
              </div>

              <p className="text-gray-600 mb-6 font-medium">
                {project.description}
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-2">
                  수행 업무
                </h4>
                <ul className="list-disc list-outside ml-4 text-sm text-gray-600 space-y-1 leading-relaxed">
                  {project.tasks.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
