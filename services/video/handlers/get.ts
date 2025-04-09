import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GetAllVideosInput, GetPopularVideosInput } from "../schema/schema";
import { redis, CACHE_KEYS } from "../../../redis/cofig";
import { refereshTrendingVideos } from "../../../jobs/cron";
import { getVideosByCategoryId } from "../../youtube/youtube";
import { incrementPlayCount } from "../playCount";

const prismaClient = new PrismaClient();

export const getVideoDetails = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (!url) {
      throw new Error("URL is required");
    }
    const videoData = await prismaClient.video.findUnique({
      where: {
        url: url as string,
      },
    });
    if (!videoData) {
      throw new Error("No video found with this url");
    }
    incrementPlayCount(videoData.id).catch(console.error);
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
    const videos = await prismaClient.video.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        [orderBy as string]: order,
      },
    });
    // Increment play counts asynchronously
    incrementPlayCount(videos.map(v => v.id)).catch(console.error);
    res.json(videos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getTrendingVideos = async (req: Request, res: Response) => {
  try {
    // Get trending video IDs from Redis
    console.log("Trending videos from Redis");
    const trendingIdsString = await redis.get(CACHE_KEYS.TRENDING_VIDEOS);

    let videoIds: string[] = [];

    if (trendingIdsString) {
      try {
        videoIds = JSON.parse(trendingIdsString);
      } catch (parseError) {
        console.error("Failed to parse trending IDs:", parseError);
      }
    }

    if (!videoIds.length) {
      console.log("No trending videos found, refreshing...");
      await refereshTrendingVideos();
      // Get fresh IDs after refresh
      const freshIdsString = await redis.get(CACHE_KEYS.TRENDING_VIDEOS);
      videoIds = freshIdsString ? JSON.parse(freshIdsString) : [];
    }

    const trendingVideos = await prismaClient.video.findMany({
      where: {
        id: {
          in: videoIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Increment play counts asynchronously
    incrementPlayCount(trendingVideos.map(v => v.id)).catch(console.error);
    res.json({
      videos: trendingVideos,
      total: trendingVideos.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPopularVideosByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = GetPopularVideosInput.parse(req.query);
    const key = `${CACHE_KEYS.POPULAR_VIDEOS}-${categoryId}`;

    if (!categoryId) {
      res.status(400).json({ error: "Category ID is required" });
      return;
    }

    // Check Redis cache first
    const cachedVideos = await redis.get(key);
    if (cachedVideos) {
      console.log("Fetching popular videos from Redis");
      const videos = JSON.parse(cachedVideos);
      res.json({ videos, total: videos.length });
      return;
    }

    console.log("Fetching popular videos for category ID:", categoryId);
    const rawVideos = await getVideosByCategoryId(categoryId);

    if (!rawVideos || rawVideos.length === 0) {
      res.status(404).json({ error: "No videos found for this category" });
      return;
    }

    console.log("Fetched popular videos:", rawVideos);

    // Bulk Upsert: Avoids unnecessary multiple DB calls
    const videoData = rawVideos.map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.text,
      url: video.url,
      thumbnail: video.thumbnailUrl,
    }));

    await prismaClient.$transaction(
      videoData.map((video: any) =>
        prismaClient.video.upsert({
          where: { id: video.id },
          update: video,
          create: video,
        })
      )
    );

    const videos = await prismaClient.video.findMany({
      where: {
        id: { in: rawVideos.map((video: any) => video.id) },
      },
    });

    // Cache the videos in Redis
    await redis.set(key, JSON.stringify(videos), "EX", 60 * 60 * 24); // Cache for 24 hours

    res.json({ videos, total: videos.length });
  } catch (error: any) {
    console.error("Error fetching popular videos:", error);
    res.status(500).json({ error: error.message });
  }
};
