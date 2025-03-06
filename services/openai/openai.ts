import OpenAI from "openai";
import { OPENAI_API_KEY } from "../../config/env";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const generateSummaryFromSubtitles = async (
  subtitles: string,
  language: string
) => {
  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Summarize the transcription in ${language} in very detail.`,
        },
        { role: "user", content: subtitles },
      ],
    });
    const summary = summaryResponse.choices[0].message.content;
    return summary;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const generateAudioFromSummary = async (
  summary: string,
  id: string,
  language: string
) => {
  try {
    const chunkSize = 4096; // OpenAI's max limit
    const textChunks =
      summary.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];
    const audioBuffers: Buffer[] = [];

    // Process each chunk separately
    for (const chunk of textChunks) {
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: chunk,
      });

      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      audioBuffers.push(buffer);
    }
    // Combine all MP3 buffers into one file
    const finalAudio = Buffer.concat(audioBuffers);

    // Sanitize file name by removing special characters and spaces
    const sanitizedFileName = `audio-${id}-${language}`
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();

    const file = new File([finalAudio], `${sanitizedFileName}.mp3`, {
      type: "audio/mpeg",
    });
    return file;
  } catch (error: any) {
    throw new Error(error);
  }
};
