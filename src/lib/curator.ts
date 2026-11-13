import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createFigureSchema = z.object({
  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required"),
  field: z.string({ error: "Field is required" }).trim().min(1, "Field is required"),
  era: z.string({ error: "Era is required" }).trim().min(1, "Era is required"),
  bio: z.string({ error: "Bio is required" }).trim().min(1, "Bio is required"),
  avatarKey: z.string({ error: "Avatar key is required" }).trim().min(1, "Avatar key is required"),
});

export const updateFigureSchema = createFigureSchema.partial().omit({ slug: true });

export const createThemeSchema = z.object({
  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required"),
  description: z.string({ error: "Description is required" }).trim().min(1, "Description is required"),
  suggestedQuestions: z.array(z.string()).default([]),
  figureIds: z.array(z.string()).default([]),
});

export const updateThemeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  suggestedQuestions: z.array(z.string()).optional(),
  figureIds: z.array(z.string()).optional(),
});

export const uploadWorkSchema = z.object({
  figureId: z.string({ error: "Figure ID is required" }).trim().min(1),
  title: z.string({ error: "Title is required" }).trim().min(1),
  year: z.coerce.number().int().min(0).max(new Date().getFullYear()),
  sourceUrl: z.string({ error: "Source URL is required" }).trim().url("Must be a valid URL"),
  publicDomainConfirmed: z.literal(true, {
    error: "Public domain confirmation is required",
  }),
  textContent: z.string({ error: "Text content is required" }).trim().min(10, "Text content must be at least 10 characters"),
});

export const answerPassageInputSchema = z.object({
  passageId: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  order: z.number().int().default(0),
});

export const createAnswerBankEntrySchema = z.object({
  figureId: z.string().trim().min(1),
  themeId: z.string().trim().min(1),
  topicKeywords: z.string().trim().min(1),
  body: z.string().trim().min(1),
  passages: z.array(answerPassageInputSchema).default([]),
});

export const updateAnswerBankEntrySchema = z.object({
  figureId: z.string().trim().min(1).optional(),
  themeId: z.string().trim().min(1).optional(),
  topicKeywords: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
  passages: z.array(answerPassageInputSchema).optional(),
});

export type CreateFigureInput = z.infer<typeof createFigureSchema>;
export type UpdateFigureInput = z.infer<typeof updateFigureSchema>;
export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type UploadWorkInput = z.infer<typeof uploadWorkSchema>;
export type CreateAnswerBankEntryInput = z.infer<typeof createAnswerBankEntrySchema>;
export type UpdateAnswerBankEntryInput = z.infer<typeof updateAnswerBankEntrySchema>;
