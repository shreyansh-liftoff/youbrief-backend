import { PrismaClient } from "@prisma/client";
import { GetAudioInput } from "../schema/schema";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAudio = async (req: Request, res: Response) => {
  try {
    const { id, language } = GetAudioInput.parse(req.query);
    const audio = await prisma.audioUrl.findMany({
      where: {
        videoId: id,
        language: language,
      },
    });
    if (!audio.length) {
      throw new Error("Audio not found");
    }
    res.send(audio);
  } catch (error: any) {
    res.status(500).send({error: error.message});
  }
};
