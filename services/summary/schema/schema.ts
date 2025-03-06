import { z } from "zod";

export const GenerateSummaryInput = z.object({
    url: z.string(),
    language: z.string(),
});