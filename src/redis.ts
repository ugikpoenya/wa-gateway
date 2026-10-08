import { env } from "./env";
import { Redis } from 'ioredis';
import { Queue } from "bullmq";

const redisClient = new Redis(env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err: any) => console.log("Redis error:", err));

const broadcastQueue = new Queue(env.REDIS_QUEUE_NAME || "wa_multi_session_queue", {
    connection: redisClient,
    defaultJobOptions: {
        removeOnComplete: {
            age: 7 * 24 * 3600, // Simpan max 7 hari
            count: 5000, // Atau simpan max 5000 data
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Simpan max 7 hari
            count: 5000
        },
    },
});

export { redisClient, broadcastQueue };