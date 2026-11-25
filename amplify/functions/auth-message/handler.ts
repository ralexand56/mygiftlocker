/**
 * Writes the code emails Cognito sends (new-account confirmation and passwordless
 * sign-in) in the person's language:
 *   1. the language the site passed with the request (clientMetadata.locale), else
 *   2. the language saved for their reminder emails (ReminderSettings.locale), else
 *   3. English.
 * A failing trigger would block sign-in, so every problem falls back to English.
 */
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { createTr, isLocale, type Locale } from "@mgl/core";
import { CORE_CATALOGS } from "@mgl/core/catalogs";
import { env } from "$amplify/env/auth-message";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";

type CustomMessageEvent = {
  triggerSource: string;
  request: {
    codeParameter?: string;
    userAttributes?: Record<string, string>;
    clientMetadata?: Record<string, string>;
  };
  response: { emailSubject?: string | null; emailMessage?: string | null; smsMessage?: string | null };
};

let client: ReturnType<typeof generateClient<Schema>> | null = null;
async function data() {
  if (!client) {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    client = generateClient<Schema>({ authMode: "iam" });
  }
  return client;
}

/** The saved reminder-email language, if any; gives up after ~2s so Cognito never times out. */
async function savedLocale(sub: string | undefined): Promise<string | undefined> {
  if (!sub) return undefined;
  const lookup = (async () => (await (await data()).models.ReminderSettings.get({ ownerSub: sub })).data?.locale ?? undefined)();
  const timeout = new Promise<undefined>((r) => setTimeout(() => r(undefined), 2000));
  return Promise.race([lookup, timeout]).catch(() => undefined);
}

const KINDS: Record<string, "signUp" | "signIn"> = {
  CustomMessage_SignUp: "signUp",
  CustomMessage_ResendCode: "signUp",
  CustomMessage_Authentication: "signIn",
};

export const handler = async (event: CustomMessageEvent) => {
  const kind = KINDS[event.triggerSource];
  const code = event.request.codeParameter;
  if (!kind || !code) return event; // other messages keep Cognito's defaults
  let locale: Locale = "en";
  try {
    const asked = event.request.clientMetadata?.locale;
    const chosen = isLocale(asked) ? asked : await savedLocale(event.request.userAttributes?.sub);
    if (isLocale(chosen)) locale = chosen;
  } catch (e) {
    console.warn("locale lookup failed", e instanceof Error ? e.message : e);
  }
  const t = createTr(locale, CORE_CATALOGS[locale]);
  event.response.emailSubject = t("authEmail.subject");
  event.response.emailMessage = t(`authEmail.${kind}`, { code });
  return event;
};
