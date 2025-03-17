import { PrismaClient } from "@prisma/client";
import { generateSummaryStream } from "../../openai/openai";
import { GenerateSummaryInput } from "../schema/schema";
import { Request, Response } from "express";
import { redis } from "../../../redis/cofig";
import { getVideoSubtitles } from "../../youtube/youtube";

const prisma = new PrismaClient();

export const generateSummary = async (req: Request, res: Response) => {
  try {
    const { id, language } = GenerateSummaryInput.parse(req.query);

    if (!id || !language) {
      throw new Error("id and language are required");
    }
    const key = `${id}-${language}`;
    const cacheSummary = await redis.get(key);

    if (cacheSummary) {
      res.json({ summary: cacheSummary });
      return;
    }

    const summaries = await prisma.summary.findMany({
      where: { videoId: id, language: language },
    });

    if (summaries.length > 0) {
      await redis.setex(key, 3600, summaries[0].text);
      res.json({ summary: summaries[0].text });
      return;
    }

    console.log("Generating subtitles for", id);
    const subtitles = await getVideoSubtitles(id);
    if (!subtitles) {
      throw new Error("No subtitles generated for this video");
    }

    console.log("Generating summary for", id);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Connection", "keep-alive");

    let summaryText = "";
    for await (const chunk of generateSummaryStream(subtitles, language)) {
      summaryText += chunk;
      res.write(chunk); // Stream chunk to client
    }

    res.end(); // Close stream

    // Save summary to DB and cache after streaming is complete
    const data = await prisma.summary.create({
      data: { videoId: id, text: summaryText, language: language },
    });
    await redis.setex(key, 3600, summaryText);
    console.log("Summary stored for", id);
    res.send(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
