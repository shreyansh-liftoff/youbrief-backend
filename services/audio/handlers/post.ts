import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { generateAudioFromSummary } from "../../openai/openai";
import { uploadFileToVercel } from "../../../utils/utils";
import { GenerateSummaryInput } from "../schema/schema";
import { CACHE_KEYS, redis } from "../../../redis/cofig";

const prisma = new PrismaClient();

export const createAudioUrl = async (req: Request, res: Response) => {
  try {
    const { id, language } = GenerateSummaryInput.parse(req.query);
    const key = `${id}-${language}`;
    const cacheVercelUrl = await redis.get(key);

    if (cacheVercelUrl) {
      res.send({ url: cacheVercelUrl });
      return;
    }
    const existingVideo: any = await prisma.video.findUnique({
      where: { id: id },
    });
    if (!existingVideo) {
      console.error("No video found with this id");
      throw new Error("No video found with this id");
    }
    const summary = existingVideo?.summaries?.[language];
    if (!summary) {
      console.error("No summary found with this language");
      throw new Error("No summary found with this language");
    }
    console.info("Generating audio for", id);
    const audioFile = await generateAudioFromSummary(
      summary,
      existingVideo.id!,
      language as string
    );
    if (!audioFile) {
      console.error("No audio generated for this summary");
      throw new Error("No audio generated for this summary");
    }
    const vercelUrl = await uploadFileToVercel(audioFile);
    if (!vercelUrl) {
      console.error("No url generated for this audio");
      throw new Error("No url generated for this audio");
    }
    await redis.set(key, vercelUrl);
    console.info("audio generated for", id);
    res.send({ url: vercelUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
