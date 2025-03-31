import Redis from 'ioredis';
import { REDIS_URL } from '../config/env';

export const redis = new Redis(REDIS_URL || 'redis://localhost:6379');

export const CACHE_KEYS = {
  TRENDING_VIDEOS: 'trending_videos',
  POPULAR_VIDEOS: 'popular_videos',
} as const;

export const CACHE_TTL = {
    TRENDING_VIDEOS: 60 * 60 * 24,
} as const;