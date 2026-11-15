import { z } from "zod";
import type { Role } from "@prisma/client";

export const ADMIN_ROLES = ["USER", "CURATOR", "ADMIN"] as const;

export const updateRoleSchema = z.object({
  role: z.enum(["USER", "CURATOR", "ADMIN", "user", "curator", "admin"]).transform((val) => {
    return val.toUpperCase() as Role;
  }),
});

export const setUsageLimitSchema = z.object({
  role: z.enum(["USER", "CURATOR", "ADMIN", "user", "curator", "admin"]).transform((val) => {
    return val.toUpperCase() as Role;
  }),
  dailyRoundtables: z
    .number({ error: "Daily limit must be a number" })
    .int("Daily limit must be an integer")
    .min(0, "Daily limit must be 0 or greater"),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetUsageLimitInput = z.infer<typeof setUsageLimitSchema>;
