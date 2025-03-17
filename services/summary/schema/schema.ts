import { z } from "zod";

export const GenerateSummaryInput = z.object({
    id: z.string(),
    language: z.string(),
});

export const GetSummaryInput = z.object({
    id: z.string(),
    language: z.string(),
});