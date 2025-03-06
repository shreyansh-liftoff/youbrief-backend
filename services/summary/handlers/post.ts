import { PrismaClient } from "@prisma/client";
import { getVideoSubtitles } from "../../apify/apify";
import { generateSummaryFromSubtitles } from "../../openai/openai";
import { GenerateSummaryInput } from "../schema/schema";
import { Request, Response } from "express";
import { redis } from "../../../redis/cofig";

const prisma = new PrismaClient();

export const generateSummary = async (req: Request, res: Response) => {
    try {
        const { url, language } = GenerateSummaryInput.parse(req.query);
        const key = `${url}-${language}`;
        const cacheSummary = await redis.get(key);

        if (cacheSummary) {
            res.send({ summary: cacheSummary });
            return;
        }
        console.log('generating subtitles for', url);
        const subtitles = (await getVideoSubtitles(url));
        if (!subtitles) {
            throw new Error('No subtitles generated for this video');
        }
        console.log('generating summary for', url);
        const summary = await generateSummaryFromSubtitles(subtitles, language);
        if (!summary) {
            throw new Error('No summary generated for this video');
        }
        await redis.set(key, summary);
        console.log('summary generated for', url);
        res.json({ summary });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}