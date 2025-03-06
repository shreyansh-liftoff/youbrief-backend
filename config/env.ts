import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT;
export const APIFY_API_TOEKN = process.env.APIFY_API_TOKEN;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
export const REDIS_URL = process.env.REDIS_URL;