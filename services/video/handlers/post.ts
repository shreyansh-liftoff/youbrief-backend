import { PrismaClient } from "@prisma/client";
import { CreateVideoInput } from "../schema/schema";
import { Request, Response } from "express";
import { getVideoDetails } from "../../youtube/youtube";

const primsaClient = new PrismaClient();

export const createVideoEntry = async (req: Request, res: Response) => {
  try {
    const { url } = CreateVideoInput.parse(req.query);
    console.log("Creating video entry for", url);
    const id = url.split("v=")[1];
    const videoData = await getVideoDetails(id);
    if (!videoData) {
      throw new Error("No video found with this url");
    }
    const video = await primsaClient.video.create({
      data: {
        id: videoData.id,
        url: videoData.url,
        title: videoData.title,
        description: videoData.text,
        thumbnail: videoData.thumbnailUrl,
      },
    });
    console.log("Video created", url);
    res.status(201).send(video);
  } catch (error: any) {
    res.status(500).send({error: error.message});
  }
};
