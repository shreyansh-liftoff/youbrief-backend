import { PrismaClient } from "@prisma/client";
import { ApifyClient } from "apify-client";
import { APIFY_API_TOEKN } from "../config/env";
import { CACHE_KEYS, CACHE_TTL, redis } from "../redis/cofig";
import { getVideoSubtitles } from "../services/apify/apify";

const prisma = new PrismaClient();

const apifyClient = new ApifyClient({
    token: APIFY_API_TOEKN
});

export async function refereshTrendingVideos() {
    try {
        console.log('running trending videos job');
        const input = {
            "type": "n",
            "gl": "in",
            "hl": "en",
            "maxItems": 20,
            "customMapFunction": (object: any) => { return {...object} }
        };
        // Run the YouTube trending videos actor
        const run = await apifyClient.actor("jnHyoAspdnYdE42rn").call(input);

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        // Filter videos with English transcripts
        const videosWithTranscripts = await Promise.allSettled(
            items.map(async (video: any) => {
                try {
                    const hasTranscript = await getVideoSubtitles(video.id);
                    return hasTranscript ? video : null;
                } catch (error) {
                    console.log(`❌ No transcript for video ${video.id}`);
                    return null;
                }
            })
        );
        
        const validVideos = videosWithTranscripts
            .filter(result => 
                result.status === 'fulfilled' && result.value !== null
            )
            .map(result => (result as PromiseFulfilledResult<any>).value);

        console.log(`📊 Found ${validVideos.length} videos with transcripts`);

        // Process filtered videos
        const createdVideos = await Promise.allSettled(
            validVideos.map((video: any) => {
                return prisma.video.upsert({
                    where: { url: video.url },
                    update: {},
                    create: {
                        id: video.id,
                        url: video.url,
                        title: video.title,
                        description: video.description ?? '',
                        thumbnail: video.thumbnails?.[0]?.url
                    }
                });
            })
        );

        const successfulVideos = createdVideos.filter(video => video.status === 'fulfilled');

        // Store trending videos in Redis
        await redis.setex(
            CACHE_KEYS.TRENDING_VIDEOS,
            CACHE_TTL.TRENDING_VIDEOS,
            JSON.stringify(successfulVideos.map(video => video.value.id))
        );

        console.log('Trending videos refreshed');
    } catch (error) {
        console.error('Error fetching trending videos:', error);
    }
}