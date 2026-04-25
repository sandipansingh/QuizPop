/// <reference types="vite/client" />

// Allow CSS side-effect imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_CSRF_COOKIE_NAME: string;
  readonly VITE_API_REQUEST_TIMEOUT_MS: string;
  readonly VITE_TOAST_DURATION_MS: string;
  readonly VITE_QUIZ_QUESTION_TIME_LIMIT_MS: string;
  readonly VITE_ROOM_QUESTION_TIME_LIMIT_MS: string;
  readonly VITE_DEFAULT_QUESTION_LIMIT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
