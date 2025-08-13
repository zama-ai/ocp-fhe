import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/redis';

// GET /api/health - Health check endpoint
export async function GET() {
    try {
        // Test Redis connection
        const redisStatus = await checkRedisHealth();

        return NextResponse.json({
            status: redisStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'Next.js Company API with Upstash Redis',
            redis: {
                status: redisStatus ? 'connected' : 'disconnected',
                provider: 'Upstash'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                service: 'Next.js Company API with Upstash Redis',
                error: 'Redis connection failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 503 }
        );
    }
}
