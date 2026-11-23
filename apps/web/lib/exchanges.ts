"use client";

/**
 * Gift exchange data access. Same functions whether we're talking to the
 * Amplify backend or (demo mode) this browser's local storage, so the pages
 * don't care which.
 */
import {
  DrawError,
  cleanWishlist,
  drawNames,
  newId,
  type Exchange,
  type JoinResult,
  type MyExchangeView,
  type Participant,
  type PublicExchange,
  type WishItem,
} from "@mgl/core";
import { useCallback, useEffect, useState } from "react";
import { api, backendEnabled, parseJson, unwrap } from "./amplify";
import { deleteExchange as deleteLocal, patchExchange, readDB, saveExchange } from "./store";

const pub = { authMode: "apiKey" } as const;

export interface NewExchange {
  name: string;
  date?: string;
  budget?: number;
  message?: string;
  wishCount: number;
  singleLoop: boolean;
  organizerName: string;
}

// ---------------------------------------------------------------------------
// Organizer (signed in)

export async function createExchange(input: NewExchange, adminSub: string): Promise<string> {
  if (!backendEnabled) {
    const adminId = newId("pt_");
    const ex: Exchange = {
      id: newId("ex_"),
      name: input.name,
      date: input.date,
      budget: input.budget ? { amount: input.budget, currency: "USD" } : undefined,
      message: input.message,
      wishCount: input.wishCount,
      singleLoop: input.singleLoop,
      adminId,
      status: "open",
      participants: [{ id: adminId, name: input.organizerName, token: token(), wishlist: [], joinedAt: new Date().toISOString() }],
      exclusions: [],
      createdAt: new Date().toISOString(),
    };
    saveExchange(ex);
    return ex.id;
  }
  const c = api();
  const { data: ex, errors } = await c.models.Exchange.create({
    adminSub,
    name: input.name,
    date: input.date || undefined,
    budgetAmount: input.budget,
    currency: "USD",
    message: input.message,
    wishCount: input.wishCount,
    singleLoop: input.singleLoop,
    status: "open",
    exclusions: JSON.stringify([]),
  });
  if (!ex) throw new Error(errors?.[0]?.message ?? "Couldn't create the exchange");
  // The organizer plays too.
  const organizerParticipantId = await addParticipant(ex.id, input.organizerName, adminSub);
  await c.models.Exchange.update({ id: ex.id, organizerParticipantId });
  return ex.id;
}

export async function listMyExchanges(): Promise<Exchange[]> {
  if (!backendEnabled) return readDB().exchanges;
  const { data } = await api().models.Exchange.list({ limit: 200 });
  const full = await Promise.all(data.map((e) => getAdminExchange(e.id)));
  return full.filter((x): x is Exchange => !!x).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Full exchange incl. participants' private tokens and (for "peek") assignments. */
export async function getAdminExchange(id: string): Promise<Exchange | null> {
  if (!backendEnabled) return readDB().exchanges.find((x) => x.id === id) ?? null;
  const c = api();
  const { data: ex } = await c.models.Exchange.get({ id });
  if (!ex) return null;
  const [{ data: people }, { data: rows }] = await Promise.all([
    c.models.Participant.listParticipantByExchangeId({ exchangeId: id }, { limit: 500 }),
    c.models.Assignment.listAssignmentByExchangeId({ exchangeId: id }, { limit: 1000 }),
  ]);
  const participants: Participant[] = people
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email ?? undefined,
      token: p.token,
      wishlist: parseJson<WishItem[]>(p.wishlist ?? "[]") ?? [],
      managedBy: p.managedBySub ?? undefined,
      joinedAt: p.joinedAt ?? ex.createdAt,
    }))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  return {
    id: ex.id,
    name: ex.name,
    date: ex.date ?? undefined,
    budget: ex.budgetAmount ? { amount: ex.budgetAmount, currency: ex.currency ?? "USD" } : undefined,
    message: ex.message ?? undefined,
    adminId: ex.organizerParticipantId ?? participants[0]?.id ?? "",
    wishCount: ex.wishCount,
    singleLoop: !!ex.singleLoop,
    status: (ex.status ?? "open") as Exchange["status"],
    participants,
    exclusions: parseJson<[string, string][]>(ex.exclusions ?? "[]") ?? [],
    assignments: rows.length ? Object.fromEntries(rows.map((r) => [r.giverId, r.receiverId])) : undefined,
    createdAt: ex.createdAt,
    drawnAt: ex.drawnAt ?? undefined,
  };
}

/** Add someone by name (e.g. a child or someone without a phone). The organizer manages them. */
export async function addParticipant(exchangeId: string, name: string, adminSub: string): Promise<string> {
  if (!backendEnabled) {
    const id = newId("pt_");
    patchExchange(exchangeId, (x) => ({
      ...x,
      participants: [...x.participants, { id, name, token: token(), wishlist: [], joinedAt: new Date().toISOString() }],
    }));
    return id;
  }
  const { data, errors } = await api().models.Participant.create({
    exchangeId,
    adminSub,
    managedBySub: adminSub,
    name,
    token: token(),
    wishlist: JSON.stringify([]),
    joinedAt: new Date().toISOString(),
  });
  if (!data) throw new Error(errors?.[0]?.message ?? "Couldn't add them");
  return data.id;
}

export async function removeParticipant(exchangeId: string, participantId: string): Promise<void> {
  if (!backendEnabled) {
    patchExchange(exchangeId, (x) => ({
      ...x,
      participants: x.participants.filter((q) => q.id !== participantId),
      exclusions: x.exclusions.filter(([a, b]) => a !== participantId && b !== participantId),
    }));
    return;
  }
  const c = api();
  await c.models.Participant.delete({ id: participantId });
  const { data: ex } = await c.models.Exchange.get({ id: exchangeId });
  const ex2 = parseJson<[string, string][]>(ex?.exclusions ?? "[]") ?? [];
  await c.models.Exchange.update({ id: exchangeId, exclusions: JSON.stringify(ex2.filter(([a, b]) => a !== participantId && b !== participantId)) });
}

export async function setExclusions(exchangeId: string, exclusions: [string, string][]): Promise<void> {
  if (!backendEnabled) return patchExchange(exchangeId, (x) => ({ ...x, exclusions }));
  await api().models.Exchange.update({ id: exchangeId, exclusions: JSON.stringify(exclusions) });
}

/** Draw names. On the backend this runs server-side so matches stay private. */
export async function draw(exchangeId: string): Promise<void> {
  if (!backendEnabled) {
    const ex = readDB().exchanges.find((x) => x.id === exchangeId);
    if (!ex) throw new Error("Exchange not found");
    try {
      const assignments = drawNames(
        ex.participants.map((p) => p.id),
        { exclusions: ex.exclusions, singleLoop: ex.singleLoop, previous: ex.previous },
      );
      patchExchange(exchangeId, (x) => ({ ...x, status: "drawn", assignments, drawnAt: new Date().toISOString() }));
    } catch (e) {
      throw new Error(e instanceof DrawError ? e.message : "Something went wrong");
    }
    return;
  }
  unwrap(await api().mutations.drawNames({ exchangeId }));
}

export async function resetDraw(exchangeId: string): Promise<void> {
  if (!backendEnabled) return patchExchange(exchangeId, (x) => ({ ...x, status: "open", assignments: undefined, drawnAt: undefined }));
  const c = api();
  // Assignments are deleted server-side on the next draw; reopen the exchange now.
  await c.models.Exchange.update({ id: exchangeId, status: "open" });
}

export async function deleteExchange(exchangeId: string): Promise<void> {
  if (!backendEnabled) return deleteLocal(exchangeId);
  const c = api();
  const { data: people } = await c.models.Participant.listParticipantByExchangeId({ exchangeId }, { limit: 500 });
  await Promise.all(people.map((p) => c.models.Participant.delete({ id: p.id })));
  await c.models.Exchange.delete({ id: exchangeId });
}

// ---------------------------------------------------------------------------
// Link holders (no account)

export async function getPublicExchange(exchangeId: string): Promise<PublicExchange> {
  if (!backendEnabled) {
    const ex = readDB().exchanges.find((x) => x.id === exchangeId);
    if (!ex) throw new Error("We couldn't find that gift exchange.");
    return localPublic(ex);
  }
  return unwrap<PublicExchange>(await api().queries.getPublicExchange({ exchangeId }, pub));
}

export async function joinExchange(exchangeId: string, name: string, email: string | undefined, wishlist: { title: string; url?: string }[]): Promise<JoinResult> {
  if (!backendEnabled) {
    const ex = readDB().exchanges.find((x) => x.id === exchangeId);
    if (!ex) throw new Error("We couldn't find that gift exchange.");
    if (ex.status === "drawn") throw new Error("Names have already been drawn. Ask the organizer to add you.");
    const p: Participant = { id: newId("pt_"), name, email, token: token(), joinedAt: new Date().toISOString(), wishlist: cleanWishlist(wishlist, ex.wishCount) };
    patchExchange(exchangeId, (x) => ({ ...x, participants: [...x.participants, p] }));
    return { participantId: p.id, token: p.token };
  }
  return unwrap<JoinResult>(await api().mutations.joinExchange({ exchangeId, name, email, wishlist: JSON.stringify(wishlist) }, pub));
}

export async function getMyExchange(exchangeId: string, tok: string): Promise<MyExchangeView> {
  if (!backendEnabled) {
    const ex = readDB().exchanges.find((x) => x.id === exchangeId);
    const me = ex?.participants.find((p) => p.token === tok);
    if (!ex || !me) throw new Error("That link isn't valid. Ask the organizer for your private link.");
    const receiver = ex.assignments?.[me.id] ? ex.participants.find((p) => p.id === ex.assignments![me.id]) : undefined;
    return {
      exchange: localPublic(ex),
      me: { id: me.id, name: me.name, wishlist: me.wishlist },
      people: ex.participants.map((p) => ({ id: p.id, name: p.name, wishCount: p.wishlist.length })),
      match: receiver ? { name: receiver.name, wishlist: receiver.wishlist } : null,
    };
  }
  return unwrap<MyExchangeView>(await api().queries.getMyExchange({ exchangeId, token: tok }, pub));
}

export async function saveWishlist(exchangeId: string, tok: string, wishlist: { title: string; url?: string }[]): Promise<WishItem[]> {
  if (!backendEnabled) {
    const ex = readDB().exchanges.find((x) => x.id === exchangeId);
    const clean = cleanWishlist(wishlist, ex?.wishCount ?? 3);
    patchExchange(exchangeId, (x) => ({ ...x, participants: x.participants.map((p) => (p.token === tok ? { ...p, wishlist: clean } : p)) }));
    return clean;
  }
  return unwrap<{ wishlist: WishItem[] }>(await api().mutations.saveWishlist({ exchangeId, token: tok, wishlist: JSON.stringify(wishlist) }, pub)).wishlist;
}

// ---------------------------------------------------------------------------

function localPublic(ex: Exchange): PublicExchange {
  return {
    id: ex.id,
    name: ex.name,
    date: ex.date,
    budget: ex.budget,
    message: ex.message,
    wishCount: ex.wishCount,
    singleLoop: ex.singleLoop,
    status: ex.status,
    participantNames: ex.participants.map((p) => p.name),
  };
}

function token(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Tiny async-state hook: { data, error, loading, reload }. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(async () => {
    try {
      const data = await run();
      setState({ data, loading: false });
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  }, [run]);
  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    reload();
  }, [reload]);
  return { ...state, reload };
}
