import Cookies from "js-cookie";
import type { User } from "@/types";

const TOKEN_KEY = "mrv_token";
const USER_KEY = "mrv_user";

export function setAuth(token: string, user: User): void {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "lax" });
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1, sameSite: "lax" });
}

export function clearAuth(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const raw = Cookies.get(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
