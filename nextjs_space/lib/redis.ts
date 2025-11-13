
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  return redis;
}

export async function setCache(
  key: string,
  value: any,
  expirationSeconds: number = 21600 // 6 horas por padrão
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setex(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
}

export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Error clearing cache pattern:', error);
  }
}

export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationSeconds: number = 21600
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached) {
    return cached;
  }

  const fresh = await fetchFn();
  await setCache(key, fresh, expirationSeconds);
  return fresh;
}
