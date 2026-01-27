"use client";

import { useState } from "react";
import Image from "next/image";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  StImageSection,
  StToggleButton,
  StImageGrid,
  StImageFrame,
} from "./ProjectImageViewer.styled";

// ✨ 타입을 export 하여 부모 페이지에서도 가져다 쓸 수 있게 함
export interface ProjectImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

interface ProjectImageViewerProps {
  images?: ProjectImage[]; // ✨ 부모에서 데이터를 넘겨줌
  projectTitle?: string;
  defaultOpen?: boolean;
}

export default function ProjectImageViewer({
  images,
  projectTitle = "Project",
  defaultOpen = false,
}: ProjectImageViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 이미지가 없으면 아예 렌더링 안 함
  if (!images || images.length === 0) return null;

  return (
    <StImageSection>
      <StToggleButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "프로젝트 이미지 접기" : "프로젝트 이미지 보기"}
        {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </StToggleButton>

      {isOpen && (
        <StImageGrid>
          {images.map((img, idx) => (
            <StImageFrame key={idx} className={img.className}>
              <Image
                src={img.src}
                alt={img.alt || `${projectTitle} screenshot ${idx + 1}`}
                width={img.width || 0}
                height={img.height || 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={idx === 0}
                style={{
                  width: img.width ? "auto" : "100%",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </StImageFrame>
          ))}
        </StImageGrid>
      )}
    </StImageSection>
  );
}
