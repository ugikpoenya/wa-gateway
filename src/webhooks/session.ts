import { CreateWebhookProps, webhookClient } from ".";
import * as whastapp from "wa-multi-session";

type SessionStatus = "connected" | "disconnected" | "connecting";

type WebhookSessionBody = {
  session: string;
  status: SessionStatus;
  number: string;
  name: string;
  id: string;
  lid: string;
};

export const createWebhookSession =
  (props: CreateWebhookProps) => async (event: WebhookSessionBody) => {
    const endpoint = `${props.baseUrl}/session`;

    const info = whastapp.getSession(event.session);
    const name = info?.user?.name ?? "";
    const jid = info?.user?.id ?? "";
    const number = jid.split(/[:@]/)[0];

    const body = {
      session: event.session,
      status: event.status,
      number: number ?? "",
      name: name,
      id: info?.user?.id ?? "",
      lid: info?.user?.lid ?? "",
    } satisfies WebhookSessionBody;

    webhookClient.post(endpoint, body).catch(console.error);
  };
