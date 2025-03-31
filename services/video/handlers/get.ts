import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GetAllVideosInput } from "../schema/schema";
import { redis, CACHE_KEYS } from "../../../redis/cofig";
import { refereshTrendingVideos } from "../../../jobs/cron";
import { getVideosByCategoryId } from "../../youtube/youtube";

const primsaClient = new PrismaClient();

export const getVideoDetails = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (!url) {
      throw new Error("URL is required");
    }
    console.log("Fetching video details for", url);
    const videoData = await primsaClient.video.findUnique({
      where: {
        url: url as string,
      },
    });
    if (!videoData) {
      throw new Error("No video found with this url");
    }
    console.log("Video details", videoData);
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

export const getPopularVideosByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      throw new Error("Category ID is required");
    }
    console.log("Fetching popular videos for category ID:", categoryId);
    const rawVideos = await getVideosByCategoryId(categoryId);

    if (!rawVideos || rawVideos.length === 0) {
      throw new Error("No videos found for this category");
    }
    console.log("Fetched popular videos:", rawVideos);

    const promises = rawVideos.map(async (video: any) => {
      const existingVideo = await primsaClient.video.upsert({
        where: {
          id: video.id,
        },
        update: {
          ...video,
        },
        create: {
          ...video,
        },
      });

      if (!existingVideo) {
        await primsaClient.video.create({
          data: {
            ...video,
          },
        });
      }
    });
    await Promise.allSettled(promises);
    const videos = await primsaClient.video.findMany({
      where: {
        id: {
          in: rawVideos.map((video: any) => video.id),
        },
      },
    });
    res.json({
      videos,
      total: videos.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
