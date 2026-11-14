import { z } from "zod";

export const roundtableInputSchema = z.object({
  themeSlug: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, {
      message: "Theme is required",
    }),
  figureIds: z
    .array(z.string().trim().min(1, "Figure ID cannot be empty"))
    .min(2, "Select at least 2 figures")
    .max(3, "Select at most 3 figures")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Figures must be unique",
    }),
  question: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 10, {
      message: "Question must be at least 10 characters",
    })
    .refine((val) => val.length <= 1000, {
      message: "Question must be at most 1000 characters",
    }),
});

export type RoundtableInput = z.infer<typeof roundtableInputSchema>;
