import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import './lib/i18n';
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

// 追蹤登入重定向次數，防止無限迴圈
let loginRedirectCount = 0;
const MAX_REDIRECT_ATTEMPTS = 3;
const REDIRECT_COOLDOWN_MS = 2000; // 2 秒冷卻時間
let lastRedirectTime = 0;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // 防止無限重定向迴圈
  const now = Date.now();
  if (now - lastRedirectTime < REDIRECT_COOLDOWN_MS) {
    console.warn("[Auth] Redirect cooldown active, skipping redirect");
    return;
  }

  loginRedirectCount++;
  lastRedirectTime = now;

  if (loginRedirectCount > MAX_REDIRECT_ATTEMPTS) {
    console.error("[Auth] Too many redirect attempts, stopping");
    // 顯示友好的錯誤提示而不是無限迴圈
    alert("Authentication failed. Please refresh the page and try again.");
    return;
  }

  console.log(`[Auth] Redirecting to login (attempt ${loginRedirectCount}/${MAX_REDIRECT_ATTEMPTS})`);
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// 初始化 i18n 的語言 - 預設為英文
const savedLanguage = localStorage.getItem('language') || 'en';
if (window.i18next) {
  window.i18next.changeLanguage(savedLanguage);
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
