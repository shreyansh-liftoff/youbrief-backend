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

const fetchCaptions = async (videoId: string) => {
  try {
    const accessToken = await refreshAccessToken();

    const response = await axios.get(`${YOUTUBE_BASE_URL}captions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        part: "snippet",
        videoId: videoId,
      },
    });

    console.log("✅ Captions Retrieved", response.data.items);
    return response.data.items; // Returns available caption tracks
  } catch (error: any) {
    console.error(
      "❌ Error fetching captions:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const fetchCaptionText = async (captionId: string) => {
  try {
    const accessToken = await refreshAccessToken();

    const response = await axios.get(
      `${YOUTUBE_BASE_URL}captions/${captionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { tfmt: "srt" }, // Get captions in SRT format
      }
    );

    console.log("✅ Caption Text Fetched");
    return response.data; // Subtitle content
  } catch (error: any) {
    console.error(
      "❌ Error fetching caption text:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getVideoSubtitles = async (videoId: string) => {
  try {
    // Step 1: Get available captions
    const result = await YoutubeTranscript.fetchTranscript(videoId);
    if (result) {
        const captions = result.map((caption) => caption.text);
        return captions.join(" ");
    }
    throw new Error("No captions available for this video");
    const captions = await fetchCaptions(videoId);
    if (!captions.length) {
      console.log("⚠️ No captions available for this video.");
      return;
    }

    // Step 2: Get the first caption track (assuming default language)
    const captionId = captions[0].id;

    // Step 3: Fetch caption text
    const subtitleText = await fetchCaptionText(captionId);

    // Step 4: Store subtitle text
    console.log("\n📄 Subtitle Content:\n", subtitleText);
    return subtitleText;
  } catch (error: any) {
    console.error("❌ Error getting subtitles:", error.message);
  }
};
