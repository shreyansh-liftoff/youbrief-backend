import { PrismaClient } from "@prisma/client";
import { getVideoDetails } from "../../apify/apify";
import { CreateVideoInput } from "../schema/schema";
import { Request, Response } from "express";

const primsaClient = new PrismaClient();

export const createVideoEntry = async (req: Request, res: Response) => {
  try {
    const { url } = CreateVideoInput.parse(req.query);
    const videoData = await getVideoDetails(url);
    const video = await primsaClient.video.create({
      data: {
        id: videoData.id,
        url: videoData.url,
        title: videoData.title,
        description: videoData.text,
        thumbnail: videoData.thumbnailUrl,
        duration: videoData.duration
      },
    });
    res.status(201).send(video);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};
