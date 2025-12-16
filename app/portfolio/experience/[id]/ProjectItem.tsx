import { useState } from "react";

// 🔹 [신규] 프로젝트 하나하나를 담당하는 컴포넌트 (열고 닫기 기능 위함)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProjectItem({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasImages = project.images && project.images.length > 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {project.title}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          )}
        </h3>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
          {project.period}
        </span>
      </div>

      <p className="text-gray-600 mb-6 font-medium">{project.description}</p>

      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-800 mb-2">수행 업무</h4>
        <ul className="list-disc list-outside ml-4 text-sm text-gray-600 space-y-1 leading-relaxed">
          {project.tasks.map((task: string, i: number) => (
            <li key={i}>{task}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {project.techStack.map((tech: string) => (
          <span
            key={tech}
            className="px-3 py-1 bg-yellow-200 text-gray-500 text-xs font-bold rounded-lg"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* 👇 [추가] 이미지 더보기 버튼 및 영역 */}
      {hasImages && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 px-4 py-2 rounded-xl w-full justify-center md:w-auto md:justify-start"
          >
            {isOpen ? "🔼 이미지 접기" : "📷 프로젝트 이미지 보기"}
          </button>

          {isOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
              {project.images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${project.title} screenshot ${idx + 1}`}
                    className="w-full h-auto object-cover  transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
