import { put } from "@vercel/blob";
import { BLOB_READ_WRITE_TOKEN } from "../config/env";
import { Readable } from "stream";
import path from "path";
import { mkdir } from "fs/promises";

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

export const uploadFileToVercel = async(audioFile: AudioFile) => {
  try {
    const stream = Readable.from(audioFile.buffer);
    const blobKey = BLOB_READ_WRITE_TOKEN;
    const outputDir = "audios";
    const blob = await put(`${outputDir}/${audioFile.fileName}`, stream, {
      access: "public",
      token: blobKey,
    });
    const url = blob.url;
    return url;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function ensureTmpDirectory() {
  const tmpDir = path.join(process.cwd(), 'tmp');
  try {
    await mkdir(tmpDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

// url format can be -
// https://youtu.be/zPyg4N7bcHM?si=0403Bo2XJApkzawn
// https://www.youtube.com/watch?v=zPyg4N7bcHM

export const getIdFromUrl = (url: string): string | null => {
  const id = url.split("v=")[1];
  if (!id) {
    return url.split("be/")[1];
  }
  return id;
};
