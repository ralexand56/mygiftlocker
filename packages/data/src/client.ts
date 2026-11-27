/**
 * The typed Amplify Data client and helpers for its responses. Each app configures Amplify with
 * its own amplify_outputs.json, then calls setClient(generateClient<Schema>()).
 */
import { defaultT, translateError, type Tr } from "@mgl/core";
import type { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

export type DataClient = ReturnType<typeof generateClient<Schema>>;
export type { Schema };

let client: DataClient | null = null;
let tr: () => Tr = () => defaultT;

/** Called once at start-up by each app. `currentTr` localizes server errors. */
export function setClient(c: DataClient, currentTr?: () => Tr) {
  client = c;
  if (currentTr) tr = currentTr;
}

export function api(): DataClient {
  if (!client) throw new Error("Backend not configured");
  return client;
}

export const t = (key: string, values?: Record<string, string | number>) => tr()(key, values);

/** Custom operations return a.json(); depending on the transport that's a string or an object. */
export function parseJson<T>(v: unknown): T {
  return (typeof v === "string" ? JSON.parse(v) : v) as T;
}

/** Turn `{ data, errors }` + our `{ error }` payloads into a value or a thrown Error. */
export function unwrap<T>(res: { data?: unknown; errors?: readonly { message: string }[] | null }): T {
  if (res.errors?.length) throw new Error(res.errors[0]!.message);
  const value = parseJson<T & { error?: string }>(res.data);
  if (value && typeof value === "object" && "error" in value && value.error) throw new Error(translateError(value.error, tr()));
  return value as T;
}
