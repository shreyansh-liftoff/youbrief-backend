import { PrismaClient } from "@prisma/client";
import { ApifyClient } from "apify-client";
import { APIFY_API_TOEKN } from "../config/env";
import { CACHE_KEYS, CACHE_TTL, redis } from "../redis/cofig";

const prisma = new PrismaClient();

const apifyClient = new ApifyClient({
    token: APIFY_API_TOEKN
});

export async function GET() {
    try {
        // Run the YouTube trending videos actor
        const run = await apifyClient.actor("matchiq/youtube-trending").call({
            maxItems: 20,
            country: "IN",
            startUrls: [{ url: "https://www.youtube.com/feed/trending" }]
        });

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
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

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${createdVideos.length} trending videos`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching trending videos:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch trending videos'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}