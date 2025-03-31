import axios from "axios";
import {
  OAUTH_BASE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  REFERESH_TOKEN,
  YOUTUBE_API_KEY,
  YOUTUBE_BASE_URL,
} from "../../config/env";
import { VideoDTO } from "./schema";
import { YoutubeTranscript } from "youtube-transcript";
import nodeFetch from "node-fetch";

const youtubeClient = axios.create({
  baseURL: YOUTUBE_BASE_URL,
  params: {
    key: YOUTUBE_API_KEY,
  },
});

const refreshAccessToken = async () => {
  try {
    const response = await axios.post(`${OAUTH_BASE_URL}token`, null, {
      params: {
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
        refresh_token: REFERESH_TOKEN,
        grant_type: "refresh_token",
      },
    });

    console.log("✅ Access Token Refreshed");
    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "❌ Error refreshing access token:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getVideoDetails = async (id: string) => {
  try {
    const response = await youtubeClient.get("/videos", {
      params: {
        part: "snippet",
        id,
      },
    });
    const parsedResponse = VideoDTO.parse({
      id: response.data.items[0].id,
      url: `https://www.youtube.com/watch?v=${response.data.items[0].id}`,
      title: response.data.items[0].snippet.title,
      text: response.data.items[0].snippet.description,
      thumbnailUrl:
        response.data.items[0].snippet.thumbnails.standard?.url ||
        response.data.items[0].snippet.thumbnails.default.url,
    });
    return parsedResponse;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getVideosByCategoryId = async (categoryId: string) => {
  try {
    const response = await youtubeClient.get("/videos", {
      params: {
        part: "snippet",
        chart: "mostPopular",
        videoCategoryId: categoryId,
        maxResults: 20,
        regionCode: "IN",
      },
    });

    const parsedResponse = response.data.items.map((item: any) => ({
      id: item.id,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      title: item.snippet.title,
      text: item.snippet.description || "",
      thumbnailUrl:
        item.snippet.thumbnails.standard?.url ||
        item.snippet.thumbnails.default.url,
    }));

    return parsedResponse;
  } catch (error: any) {
    throw new Error(error);
  }
}