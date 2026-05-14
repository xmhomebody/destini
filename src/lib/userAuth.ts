/**
 * 用户身份与唤回链接处理
 *
 *  - 邮箱写入 localStorage，作为"已认证"的轻量凭证
 *  - URL 中的 ?token=xxx 为唤回链接：解码出邮箱写入 localStorage，并清除 URL 中的 token
 */

const EMAIL_KEY = "destini-user-email";
const TOKEN_PARAM = "token";

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function setStoredEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_KEY, email);
}

export function hasUserIdentity(): boolean {
  return !!getStoredEmail();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * 唤回链接 token 解码：URL-safe base64 → 邮箱字符串
 */
function decodeToken(token: string): string | null {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(b64);
  } catch {
    return null;
  }
}

/**
 * 应用挂载时调用：若 URL 含 ?token=...，解析后写入 localStorage 并清除 token 参数
 */
export function consumeUrlToken(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const token = url.searchParams.get(TOKEN_PARAM);
  if (!token) return;
  const decoded = decodeToken(token);
  if (decoded && isValidEmail(decoded)) {
    setStoredEmail(decoded);
  }
  url.searchParams.delete(TOKEN_PARAM);
  window.history.replaceState({}, "", url.toString());
}
