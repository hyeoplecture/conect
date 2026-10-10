/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" 이면 운영 빌드에도 화면 보드(#/screens)를 포함한다 */
  readonly VITE_SCREENS?: string;
}
