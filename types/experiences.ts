
export interface ProjectItemList {
  id: string;
  date: string;
  title: string;
  description?: string[]; // 상세 내용을 위한 선택적 필드 추가
  url?: string;
  images?: ProjectImage[];
}

export interface ProjectHistoryItem {
  id: string | number;
  date: string;
  title: string;
  url?: string;
}

export interface ProjectImage {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

export interface ProjectHistoryGroup {
  title: string;
  items: ProjectHistoryItem[];
  description?: string;
}

export interface Project {
  title: string;
  period: string;
  description: string;
  tasks: string[];
  techStack: string[];
  link?: string;
  projectItemList?: ProjectHistoryGroup;
  images?: ProjectImage[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  color: string;
  summary: string[];
  workSummary: string[];
  projects: Project[];
}
