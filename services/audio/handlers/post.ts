import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { generateAudioFromSummary } from "../../openai/openai";
import { ensureTmpDirectory, uploadFile } from "../../../utils/utils";
import { GenerateSummaryInput } from "../schema/schema";
import { redis } from "../../../redis/cofig";

const prisma = new PrismaClient();

export const createAudioUrl = async (req: Request, res: Response) => {
  try {
    const { id, language } = GenerateSummaryInput.parse(req.query);
    const key = `${id}-${language}-audio`;
    const cacheVercelUrl = await redis.get(key);

    if (cacheVercelUrl) {
      res.send({ url: cacheVercelUrl });
      return;
    }
    const existingAudio: any = await prisma.audioUrl.findMany({
      where: { videoId: id, language: language },
    });
    if (existingAudio.length) {
      await redis.set(key, existingAudio[0].url);
      res.send({ url: existingAudio[0].url });
      return;
    }

    const summaries = await prisma.summary.findMany({
      where: { videoId: id, language: language },
    });
    if (!summaries.length) {
      console.error("No summary found with this language");
      throw new Error("No summary found with this language");
    }
    const summary = summaries[0];
    console.info("Generating audio for", id);
    await ensureTmpDirectory();
    const audioFile = await generateAudioFromSummary(
      summary.text,
      existingAudio.id!,
      language as string
    );
    if (!audioFile) {
      console.error("No audio generated for this summary");
      throw new Error("No audio generated for this summary");
    }
    const vercelUrl = await uploadFile(audioFile);
    if (!vercelUrl) {
      console.error("No url generated for this audio");
      throw new Error("No url generated for this audio");
    }

    const data = await prisma.audioUrl.create({
      data: {
        videoId: id,
        language: language,
        url: vercelUrl,
      },
    });
    await redis.setex(key, 3600, vercelUrl);
    console.info("audio generated for", id);
    res.send(data);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
