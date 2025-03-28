import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT;
export const APIFY_API_TOEKN = process.env.APIFY_API_TOKEN;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
export const REDIS_URL = process.env.REDIS_URL;
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
export const YOUTUBE_BASE_URL = process.env.YOUTUBE_BASE_URL;
export const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
export const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
export const REFERESH_TOKEN = process.env.REFERESH_TOKEN;
export const OAUTH_BASE_URL = process.env.OAUTH_BASE_URL;
export const OAUTH_AUTHORIZATION_CODE = process.env.OAUTH_AUTHORIZATION_CODE;
export const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
export const VIMEO_BASE_URL = process.env.VIMEO_BASE_URL;