export type AuthRole = "user" | "curator" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  role: AuthRole;
}
