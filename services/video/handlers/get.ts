import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GetAllVideosInput } from "../schema/schema";
import { redis, CACHE_KEYS } from "../../../redis/cofig";
import { refereshTrendingVideos } from "../../../jobs/cron";

const primsaClient = new PrismaClient();

export const getVideoDetails = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    const videoData = await primsaClient.video.findUnique({
      where: {
        url: url as string,
      },
    });
    if (!videoData) {
      throw new Error("No video found with this url");
    }
    res.json(videoData);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getVideos = async (req: Request, res: Response) => {
  try {
    const { offset, limit, order, orderBy } = GetAllVideosInput.parse(
      req.query
    );
    const videos = await primsaClient.video.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        [orderBy as string]: order,
      },
    });
    res.json(videos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getTrendingVideos = async (req: Request, res: Response) => {
  try {
    // Get trending video IDs from Redis
    const trendingIds = await redis.get(CACHE_KEYS.TRENDING_VIDEOS);

    console.log("Trending videos from Redis", trendingIds);

    if (!trendingIds) {
      await refereshTrendingVideos();
    }

    console.log("Fetching trending videos from DB", trendingIds);

    const videoIds = trendingIds ? JSON.parse(trendingIds) : [];

    const trendingVideos = await primsaClient.video.findMany({
      where: {
        id: {
          in: videoIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({
      videos: trendingVideos,
      total: trendingVideos.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
