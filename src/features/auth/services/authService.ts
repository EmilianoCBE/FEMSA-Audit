import { httpClient } from "@/shared/api/httpClient";
import type { User } from "../types";

export const authService = {
  me: () => httpClient.get<{ user: User }>("/auth/me"),
  login: (identifier: string, password: string) =>
    httpClient.post<{ user: User }>("/auth/login", { identifier, password }),
  logout: () => httpClient.post<{ ok: boolean }>("/auth/logout", {}),
  entraUrl: `${import.meta.env.VITE_API_URL ?? "/api"}/auth/entra`,
};
