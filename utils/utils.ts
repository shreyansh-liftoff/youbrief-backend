import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "../config/env";
import path from "path";
import { mkdir } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

export const supportedLanguages = [
  { code: "af", name: "Afrikaans" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "be", name: "Belarusian" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "zh", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "gl", name: "Galician" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "ko", name: "Korean" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mk", name: "Macedonian" },
  { code: "ms", name: "Malay" },
  { code: "mr", name: "Marathi" },
  { code: "mi", name: "Maori" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "es", name: "Spanish" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tl", name: "Tagalog" },
  { code: "ta", name: "Tamil" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
];

export const getAudioFilePath = (videoId: string, language: string) => {
  return `audio/${videoId}/${language}.mp3`;
};

interface AudioFile {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

export const uploadFile = async (audioFile: AudioFile) => {
  try {
    const { data, error } = await supabase.storage
      .from("audios")
      .upload(audioFile.fileName, audioFile.buffer, {
        contentType: audioFile.mimeType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Upload failed - no data returned");
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("audios").getPublicUrl(audioFile.fileName);

    return publicUrl;
  } catch (error: any) {
    console.error("Upload failed:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export async function ensureTmpDirectory() {
  const tmpDir = path.join(process.cwd(), "tmp");
  try {
    await mkdir(tmpDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

// url format can be -
// https://youtu.be/zPyg4N7bcHM?si=0403Bo2XJApkzawn
// https://www.youtube.com/watch?v=zPyg4N7bcHM
// it should return zPyg4N7bcHM in both cases

export const getIdFromUrl = (url: string): string | null => {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match) {
    return match[1];
  }
  return null;
};
