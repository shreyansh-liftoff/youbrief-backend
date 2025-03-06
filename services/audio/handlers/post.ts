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
      throw new Error("No video found with this id");
    }
    const summary = existingVideo?.summaries?.[language];
    if (!summary) {
      throw new Error("No summary found with this language");
    }
    const audioFile = await generateAudioFromSummary(
      summary,
      existingVideo.id!,
      language as string
    );
    const vercelUrl = await uploadFileToVercel(audioFile);
    await redis.set(key, vercelUrl);
    res.send({ url: vercelUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
