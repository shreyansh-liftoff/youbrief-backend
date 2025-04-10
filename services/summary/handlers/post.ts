import { PrismaClient } from "@prisma/client";
import { generateSummaryStream } from "../../openai/openai";
import { GenerateSummaryInput } from "../schema/schema";
import { Request, Response } from "express";
import { redis } from "../../../redis/cofig";
import { getVideoSubtitles } from "../../apify/apify";

const prisma = new PrismaClient();

export const generateSummary = async (req: Request, res: Response) => {
    try {
      const { id, language } = GenerateSummaryInput.parse(req.query);
      console.log("Generating summary for", id, language);
      if (!id || !language) {
        throw new Error("id and language are required");
      }
  
      const key = `${id}-${language}`;
      const cacheSummary = await redis.get(key);
  
      if (cacheSummary) {
        res.json({ text: cacheSummary });
      }
  
      // Check existing summary
      const existingSummary = await prisma.summary.findUnique({
        where: {
          videoId_language: {
            videoId: id,
            language
          }
        }
      });
  
      if (existingSummary) {
        await redis.setex(key, 3600, existingSummary.text);
        res.send(existingSummary);
      }
  
      const subtitles = await getVideoSubtitles(id);
      if (!subtitles) {
        throw new Error("No subtitles generated for this video");
      }
  
      // Set JSON streaming headers
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
  
      let summaryText = "";
      for await (const chunk of generateSummaryStream(subtitles, language)) {
        summaryText += chunk;
        console.log("Sending chunk", chunk);
        // Send each chunk as a JSON object
        res.write(JSON.stringify({ chunk }) + '\n');
      }
  
      // Save to DB and cache asynchronously
      await Promise.all([
        prisma.summary.create({
          data: { videoId: id, text: summaryText, language }
        }),
        redis.setex(key, 3600, summaryText)
      ]);
  
      // Send completion message
      res.write(JSON.stringify({ done: true, complete: summaryText }) + '\n');
      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(400).json({ error: error.message });
      } else {
        res.write(JSON.stringify({ error: error.message }) + '\n');
        res.end();
      }
    }
  };
