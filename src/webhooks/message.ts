import type { MessageReceived } from "wa-multi-session";
import { CreateWebhookProps, webhookClient } from ".";
import { env } from "./../env";
import {
  handleWebhookAudioMessage,
  handleWebhookDocumentMessage,
  handleWebhookImageMessage,
  handleWebhookVideoMessage,
} from "./media";
import { broadcastQueue } from "./../redis.js";

type WebhookMessageBody = {
  session: string;
  from: string | null;
  message: string | null;

  media: {
    image: string | null;
    video: string | null;
    document: string | null;
    audio: string | null;
  };
};

export const createWebhookMessage =
  (props: CreateWebhookProps) => async (message: MessageReceived) => {
    if (env.REDIS_QUEUE_NAME) {
      if (message.key.remoteJid?.includes("broadcast"))
        return;

      const image = await handleWebhookImageMessage(message);
      const video = await handleWebhookVideoMessage(message);
      const document = await handleWebhookDocumentMessage(message);
      const audio = await handleWebhookAudioMessage(message);

      const body = {
        event: "message-create",
        session: message.sessionId,
        fromMe: message.key.fromMe,
        id: message.key.id,
        remoteJid: message.key.remoteJid,
        remoteJidAlt: message.key.remoteJidAlt,
        remoteJidUsername: message.key.remoteJidUsername,
        message:
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          message.message?.imageMessage?.caption ||
          message.message?.videoMessage?.caption ||
          message.message?.documentMessage?.caption ||
          message.message?.contactMessage?.displayName ||
          message.message?.locationMessage?.comment ||
          message.message?.liveLocationMessage?.caption ||
          null,

        /**
         * media message
         */
        media: {
          image,
          video,
          document,
          audio,
        },
      }


      await broadcastQueue.add("message", body, {
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
    if (message.key.fromMe || message.key.remoteJid?.includes("broadcast"))
      return;

    const endpoint = `${props.baseUrl}/message`;

    const image = await handleWebhookImageMessage(message);
    const video = await handleWebhookVideoMessage(message);
    const document = await handleWebhookDocumentMessage(message);
    const audio = await handleWebhookAudioMessage(message);

    const body = {
      session: message.sessionId,
      from: message.key.remoteJid ?? null,
      message:
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        message.message?.documentMessage?.caption ||
        message.message?.contactMessage?.displayName ||
        message.message?.locationMessage?.comment ||
        message.message?.liveLocationMessage?.caption ||
        null,

      /**
       * media message
       */
      media: {
        image,
        video,
        document,
        audio,
      },
    } satisfies WebhookMessageBody;
    webhookClient.post(endpoint, body).catch(console.error);
  };
