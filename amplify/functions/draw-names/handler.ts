import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { DrawError, drawNames } from "@mgl/core";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/draw-names";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

/**
 * Server-side draw so nobody — not even the organizer — can see the full map
 * unless they opt in to "peek". Each Assignment row is readable only by its giver.
 */
export const handler: Schema["drawNames"]["functionHandler"] = async (event) => {
  const { exchangeId, redraw } = event.arguments;
  const callerSub = (event.identity as { sub?: string } | undefined)?.sub;

  const { data: exchange } = await client.models.Exchange.get({ id: exchangeId });
  if (!exchange) throw new Error("Exchange not found");
  if (exchange.adminSub !== callerSub) throw new Error("Only the organizer can draw names");
  if (exchange.status === "drawn" && !redraw) throw new Error("Names were already drawn");

  const { data: participants } = await client.models.Participant.list({ filter: { exchangeId: { eq: exchangeId } }, limit: 1000 });
  const ids = participants.map((p) => p.id);
  const exclusions = (exchange.exclusions ?? []) as [string, string][];

  let result: Record<string, string>;
  try {
    result = drawNames(ids, { exclusions, singleLoop: exchange.singleLoop ?? false });
  } catch (e) {
    if (e instanceof DrawError) return { ok: false, message: e.message };
    throw e;
  }

  // Replace any previous draw.
  const { data: old } = await client.models.Assignment.list({ filter: { exchangeId: { eq: exchangeId } }, limit: 1000 });
  await Promise.all(old.map((a) => client.models.Assignment.delete({ id: a.id })));

  const byId = new Map(participants.map((p) => [p.id, p]));
  await Promise.all(
    Object.entries(result).map(([giverId, receiverId]) =>
      client.models.Assignment.create({
        exchangeId,
        giverId,
        receiverId,
        giverSub: byId.get(giverId)?.userSub ?? byId.get(giverId)?.managedBySub ?? exchange.adminSub,
      }),
    ),
  );
  await client.models.Exchange.update({ id: exchangeId, status: "drawn", drawnAt: new Date().toISOString() });
  return { ok: true, message: `Matched ${ids.length} people` };
};
