import { ApifyClient } from "apify-client";
import { APIFY_API_TOEKN } from "../../config/env";
import { VideoDTO } from "./schema";
import { redis } from "../../redis/cofig";

const client = new ApifyClient({
  token: APIFY_API_TOEKN,
});

export const getVideoDetails = async (url: string) => {
  try {
    const input = {
      startUrls: [{ url: url }], // Fix the format for startUrls
      maxDepth: 1,
    };
    const run = await client.actor("h7sDV53CddomktSi5").call(input);

    // get video details
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items || items.length === 0) {
      throw new Error("❌ No data found.");
    }
    const videoData = VideoDTO.parse(items[0]);
    return videoData;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getVideoSubtitles = async (videoId: string) => {
  try {
    const key = `${videoId}-en`;
    const cacheSubtitles = await redis.get(key);

    if (cacheSubtitles) {
      return JSON.parse(cacheSubtitles);
    }
    const input = {
      startUrls: [{ url: `https://www.youtube.com/watch?v=${videoId}` }], // Fix the format for startUrls
      maxDepth: 1,
      subtitlesLanguage: 'en', // Change to 'en' or any other language needed
      subtitlesFormat: "plaintext",
      downloadSubtitles: true,
      saveSubsToKVS: true,
    };
    const run = await client.actor("h7sDV53CddomktSi5").call(input);

    // get video details
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items || items.length === 0) {
      throw new Error("❌ No data found.");
    }
    const subtitles = (items[0]?.subtitles as any)[0].plaintext;

    if (!subtitles) {
      throw new Error("❌ No subtitles found.");
    }
    // Save subtitles to Redis with a 1-hour expiration
    await redis.set(key, JSON.stringify(subtitles));
    return subtitles;
  } catch (error: any) {
    throw new Error(error);
  }
};
