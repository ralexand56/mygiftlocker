/**
 * Runs daily (see resource.ts). Emails each locker owner about their people's
 * birthdays, anniversaries and other dates a week ahead and the day before.
 *
 * Invoke manually with {"preview": {"to": "you@example.com"}} to send one sample
 * email built from the demo people (subject starts with "[Preview]").
 */
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import {
  DEMO_PEOPLE,
  buildReminderEmail,
  cleanHolidays,
  dateKey,
  dueReminders,
  nextOccurrence,
  todayInTimeZone,
  type Person,
  type ReminderEmail,
} from "@mgl/core";
import { env } from "$amplify/env/event-reminders";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { randomBytes } from "node:crypto";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>({ authMode: "iam" });
const ses = new SESv2Client({});
const cognito = new CognitoIdentityProviderClient({});

type Profile = Schema["Profile"]["type"];
type OwnedPerson = Person & { ownerSub: string };

interface ReminderEvent {
  preview?: { to?: string };
}

const lockerUrl = () => `${env.SITE_URL}/locker`;
const unsubscribeUrl = (token: string) => `${env.SITE_URL}/reminders?t=${encodeURIComponent(token)}`;

export const handler = async (event: ReminderEvent = {}) => {
  if (event.preview?.to) return sendPreview(event.preview.to);

  const today = todayInTimeZone(env.REMINDER_TIME_ZONE);
  const day = dateKey(today);
  const byOwner = new Map<string, OwnedPerson[]>();
  for (const p of await allPeople()) byOwner.set(p.ownerSub, [...(byOwner.get(p.ownerSub) ?? []), p]);

  const summary = { date: day, owners: byOwner.size, due: 0, sent: 0, optedOut: 0, alreadySent: 0, noEmail: 0, failed: 0 };
  for (const [ownerSub, people] of byOwner) {
    const due = dueReminders(people, today);
    if (!due.length) continue;
    summary.due++;
    try {
      const outcome = await remindOwner(ownerSub, due, day);
      summary[outcome]++;
    } catch (e) {
      summary.failed++;
      console.error("reminder failed", { ownerSub, error: e instanceof Error ? e.message : e });
    }
  }
  console.log("reminders", summary);
  return summary;
};

async function remindOwner(ownerSub: string, due: ReturnType<typeof dueReminders>, day: string): Promise<"sent" | "optedOut" | "alreadySent" | "noEmail"> {
  const token = await settingsToken(ownerSub);
  if (!token) return "optedOut";

  const user = await findUser(ownerSub);
  if (!user?.email) return "noEmail";

  // Claim today's slot first; a duplicate id means an earlier run already emailed this owner.
  const logId = `${ownerSub}#${day}`;
  const { errors } = await client.models.ReminderLog.create({ id: logId, ownerSub, count: due.length });
  if (errors?.length) return "alreadySent";

  const email = buildReminderEmail({ ownerName: user.name, reminders: due, lockerUrl: lockerUrl(), unsubscribeUrl: unsubscribeUrl(token) });
  try {
    await send(user.email, email, unsubscribeUrl(token));
  } catch (e) {
    await client.models.ReminderLog.delete({ id: logId }); // let a retry try again
    throw e;
  }
  return "sent";
}

/** The owner's unsubscribe token, creating settings on first use; null when reminders are off. */
async function settingsToken(ownerSub: string): Promise<string | null> {
  const { data } = await client.models.ReminderSettings.get({ ownerSub });
  if (data?.remindersOff) return null;
  if (data?.unsubscribeToken) return data.unsubscribeToken;
  const unsubscribeToken = randomBytes(24).toString("base64url");
  await client.models.ReminderSettings.create({ ownerSub, unsubscribeToken, remindersOff: false });
  return unsubscribeToken;
}

/** Works for email-code and Google users alike (their usernames differ; `sub` doesn't). */
async function findUser(sub: string): Promise<{ email?: string; name?: string } | null> {
  const res = await cognito.send(new ListUsersCommand({ UserPoolId: process.env.USER_POOL_ID, Filter: `sub = "${sub.replace(/"/g, "")}"`, Limit: 1 }));
  const attrs = Object.fromEntries((res.Users?.[0]?.Attributes ?? []).map((a) => [a.Name, a.Value]));
  return res.Users?.length ? { email: attrs.email, name: attrs.name } : null;
}

async function send(to: string, email: ReminderEmail, unsubscribe: string) {
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: env.FROM_ADDRESS,
      ReplyToAddresses: [env.REPLY_TO],
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: "UTF-8" },
          Body: { Text: { Data: email.text, Charset: "UTF-8" }, Html: { Data: email.html, Charset: "UTF-8" } },
          Headers: [{ Name: "List-Unsubscribe", Value: `<${unsubscribe}>` }],
        },
      },
    }),
  );
}

async function sendPreview(to: string) {
  // Pretend "today" is a week before the first demo birthday so there's something to show.
  const first = DEMO_PEOPLE.find((p) => p.birthday)!;
  const bday = nextOccurrence(first.birthday!);
  const fakeToday = new Date(bday.getFullYear(), bday.getMonth(), bday.getDate() - 7);
  const due = dueReminders(DEMO_PEOPLE, fakeToday);
  const email = buildReminderEmail({ ownerName: "there", reminders: due, lockerUrl: lockerUrl(), unsubscribeUrl: unsubscribeUrl("preview") });
  await send(to, { ...email, subject: `[Preview] ${email.subject}` }, unsubscribeUrl("preview"));
  return { preview: true, to, reminders: due.length };
}

async function allPeople(): Promise<OwnedPerson[]> {
  const out: OwnedPerson[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Profile.list({ limit: 1000, nextToken });
    for (const p of res.data) if (p.ownerSub) out.push(toPerson(p));
    nextToken = res.nextToken;
  } while (nextToken);
  return out;
}

const parse = <T>(v: unknown): T | undefined => {
  if (v == null) return undefined;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
};

const date = (d: Profile["birthday"]) => (d ? { month: d.month, day: d.day, year: d.year ?? undefined } : undefined);

function toPerson(p: Profile): OwnedPerson {
  return {
    ownerSub: p.ownerSub!,
    id: p.id,
    name: p.name,
    kind: (p.kind ?? "adult") as Person["kind"],
    relationship: p.relationship ?? undefined,
    color: p.color ?? "#FBD3E3",
    sizes: parse(p.sizes) ?? {},
    address: parse(p.address),
    birthday: date(p.birthday),
    anniversary: date(p.anniversary),
    favorites: parse(p.favorites),
    holidays: cleanHolidays(p.holidays),
    ownerNote: p.ownerNote ?? undefined,
    updatedAt: p.updatedAt,
  };
}
