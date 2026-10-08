import { CreateWebhookProps, webhookClient } from ".";
import { env } from "./../env";
import { broadcastQueue } from "./../redis.js";
import { whatsappStatuses } from "../whatsapp";

type SessionStatus = "connected" | "disconnected" | "connecting";

type WebhookSessionBody = {
  session: string;
  status: SessionStatus;
};

export const createWebhookSession =
  (props: CreateWebhookProps) => async (event: WebhookSessionBody) => {
    if (env.REDIS_QUEUE_NAME) {
      const statusInfo = (await whatsappStatuses.get(event.session)) as any;
      const body = {
        event: "session-update",
        session: event.session,
        status: event.status,
        name: statusInfo?.details?.name,
        phoneNumber: statusInfo?.details?.phoneNumber,
      };
      await broadcastQueue.add("session", body, {
        removeOnComplete: {
          age: 7 * 24 * 3600, // Simpan max 7 hari
          count: 5000, // Atau simpan max 5000 data
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Simpan max 7 hari
          count: 5000
        },
      });
    }

    if (!props.baseUrl) return;
    const endpoint = `${props.baseUrl}/session`;

    const body = {
      session: event.session,
      status: event.status,
    } satisfies WebhookSessionBody;

    webhookClient.post(endpoint, body).catch(console.error);
  };
