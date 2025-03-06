import { z } from "zod";

export const VideoDTO = z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    text: z.string(),
    thumbnailUrl: z.string(),
    duration: z.string(),
});