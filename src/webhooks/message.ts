import { MessageReceived } from "wa-multi-session";
import { CreateWebhookProps, webhookClient } from ".";
import {
  handleWebhookAudioMessage,
  handleWebhookDocumentMessage,
  handleWebhookImageMessage,
  handleWebhookVideoMessage,
} from "./media";

type WebhookMessageBody = {
  session: string;
  from: string | null;
  message: string | null;
  from_me: boolean | null;

  media: {
    image: string | null;
    video: string | null;
    document: string | null;
    audio: string | null;
  };
};

export const createWebhookMessage =
  (props: CreateWebhookProps) => async (message: MessageReceived) => {
    if (message.key.remoteJid?.includes("broadcast")) return; // exclude broadcast
    if (message.key.remoteJid?.includes("newsletter")) return; // exclude newsletter
    if (message.key.remoteJid?.endsWith("@g.us")) return; // exclude group message

    const remoteJid = [message.key.remoteJid, message.key.remoteJidAlt].find((j) => j?.includes("@s.whatsapp.net")) || message.key.remoteJid;

    const endpoint = `${props.baseUrl}/message`;

    const image = await handleWebhookImageMessage(message);
    const video = await handleWebhookVideoMessage(message);
    const document = await handleWebhookDocumentMessage(message);
    const audio = await handleWebhookAudioMessage(message);

    const body = {
      session: message.sessionId,
      from: remoteJid ?? null,
      from_me: message.key.fromMe ?? null,
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
