import { z } from "zod";

export const CreateVideoInput = z.object({
    url: z.string(),
});

export const UpdateSummarySchema = z.object({
    summary: z.string().min(1, "Summary cannot be empty"),
    language: z.string().min(2, "Language code must be at least 2 characters")
});

export const UpdateAudioUrlSchema = z.object({
    id: z.string(),
    language: z.string().min(2, "Language code must be at least 2 characters"),
    url: z.string().url("Invalid URL")
});

export const GetAllVideosInput = z.object({
    limit: z.string().regex(/^\d+$/).default("10").optional().transform((val) => parseInt(val ?? '', 10)),
    offset: z.string().regex(/^\d+$/).default("0").optional().transform((val) => parseInt(val ?? '', 10)),
    orderBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt").optional(),
    order: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const GetPopularVideosInput = z.object({
    categoryId: z.string().min(1, "Category ID is required"),
});