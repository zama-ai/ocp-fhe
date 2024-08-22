import { createClient } from "redis";
import { setupEnv } from "../../utils/env";

setupEnv();

const REDIS_URL = process.env.REDIS_URL;

export const connectRedis = async () => {
    try {
        const client = createClient({
            url: REDIS_URL || "redis://localhost:6379",
            socket: {
                reconnectStrategy: function (retries) {
                    if (retries > 20) {
                        console.log("Too many attempts to reconnect. Redis connection was terminated");
                        return new Error("Too many retries.");
                    } else {
                        return retries * 500;
                    }
                },
            },
        });

        client.on("error", (err) => console.error("❌ | Redis Client Error", err));

        await client.connect();
        console.log("✅ | Redis connected successfully");

        return client;
    } catch (error) {
        console.error(error);
        console.error("❌ | Error connecting to Redis", error.message);
        // Exit process with failure
        process.exit(1);
    }
};
