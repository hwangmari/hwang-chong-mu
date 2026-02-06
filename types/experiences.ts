
/** [Depth 3] 확장 히스토리 아이템 (상세 설명/이미지 포함형) */
export interface ProjectItemList {
  id: string;
  date: string;
  title: string;
  description?: string[]; // 상세 내용을 위한 선택적 필드 추가
  url?: string;
  images?: ProjectImage[];
}

/** [Depth 3] 가장 작은 단위의 히스토리 아이템 */
export interface ProjectHistoryItem {
  id: string | number;
  date: string;
  title: string;
  url?: string;
}

/** [Depth 3] 이미지 아이템 */
export interface ProjectImage {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

/** [Depth 2] 프로젝트 내 히스토리 리스트 그룹 */
export interface ProjectHistoryGroup {
  title: string;
  items: ProjectHistoryItem[];
  description?: string;
}

/** [Depth 2] 개별 프로젝트 정보 */
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

/** [Depth 1] 최상위 회사/경력 정보 */
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
