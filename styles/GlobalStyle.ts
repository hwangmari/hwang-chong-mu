"use client";
import { createGlobalStyle, css } from "styled-components";

const utilities = css`
  .block {
    display: block;
  }
  .inline-block {
    display: inline-block;
  }
  .flex {
    display: flex;
  }
  .hidden {
    display: none;
  }

  .fw-400 {
    font-weight: 400;
  }
  .fw-500 {
    font-weight: 500;
  }
  .fw-700 {
    font-weight: 700;
  }
  .fw-800 {
    font-weight: 800;
  }
  .fw-900 {
    font-weight: 900;
  }

  .text-white {
    color: #ffffff;
  }
  .text-black {
    color: #000000;
  }
  .text-gray-400 {
    color: #9ca3af;
  }
  .text-gray-500 {
    color: #6b7280;
  }
  .text-gray-600 {
    color: #4b5563;
  }
  .text-gray-700 {
    color: #374151;
  }
  .text-gray-900 {
    color: #111827;
  }

  .text-blue-600 {
    color: #2563eb;
  } /* 포인트 컬러 */
  .text-blue-700 {
    color: #1d4ed8;
  }

  .text-green-700 {
    color: #15803d;
  }
  .text-orange-500 {
    color: #f97316;
  }

  .mb-0 {
    margin-bottom: 0;
  }
  .mb-1 {
    margin-bottom: 0.25rem;
  }
  .mb-2 {
    margin-bottom: 0.5rem;
  }
  .mb-3 {
    margin-bottom: 0.75rem;
  }
  .mb-4 {
    margin-bottom: 1rem;
  }
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  .mb-8 {
    margin-bottom: 2rem;
  }
  .mb-10 {
    margin-bottom: 2.5rem;
  }

  .mt-1 {
    margin-top: 0.25rem;
  }
  .mt-2 {
    margin-top: 0.5rem;
  }
  .mt-4 {
    margin-top: 1rem;
  }
  .mt-6 {
    margin-top: 1.5rem;
  }

  .p-4 {
    padding: 1rem;
  }
  .p-6 {
    padding: 1.5rem;
  }
  .py-12 {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
  .px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .w-5 {
    width: 20px;
  }
  .h-5 {
    height: 20px;
  }
  .text-center {
    text-align: center;
  }
`;

const GlobalStyle = createGlobalStyle`
 
  * { box-sizing: border-box; padding: 0; margin: 0; }
  
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: ${({ theme }) => theme.colors.gray900};
    background-color: ${({ theme }) => theme.colors.gray50};
    line-height: 1.5;word-break: keep-all;
  }
  
  a { color: inherit; text-decoration: none; }
  button { background: none; border: none; cursor: pointer; font-family: inherit; }

  ${utilities}
`;

export default GlobalStyle;
