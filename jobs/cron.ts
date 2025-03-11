import { PrismaClient } from "@prisma/client";
import { ApifyClient } from "apify-client";
import { APIFY_API_TOEKN } from "../config/env";
import { CACHE_KEYS, CACHE_TTL, redis } from "../redis/cofig";

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

        console.log('items', items);
        
        // Process each trending video
        const createdVideos = await Promise.allSettled(
            items.map((video: any) => {
                return prisma.video.upsert({
                    where: { url: video.url },
                    update: {},
                    create: {
                        id: video.id,
                        url: video.url,
                        title: video.title,
                        description: video.text,
                        thumbnail: video.thumbnailUrl,
                        duration: video.duration
                    }
                });
            })
        );

        console.log('createdVideos', createdVideos);

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