import { Redis } from '@upstash/redis';

// Redis client configuration for Upstash
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://neutral-sunfish-23951.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AV2PAAIjcDFhMmJkMDQ1YzVmMjU0NWUwOTJlNTY4OTAwYTE1YjMxOXAxMA',
});

// Redis key prefixes for organization
export const KEY_PREFIXES = {
    COMPANY: 'company',
    COMPANY_BY_FOUNDER: 'founder',
    COMPANY_BY_INVESTOR: 'investor',
    COMPANY_ROUNDS: 'rounds',
    COMPANY_INVESTORS: 'investors',
    COMPANY_SEARCH: 'search',
} as const;

// Utility function to generate Redis keys
export const generateKey = (prefix: string, identifier: string): string =>
    `${prefix}:${identifier}`;

// Health check function for Upstash Redis
export const checkRedisHealth = async (): Promise<boolean> => {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
    }
};

export default redis;
