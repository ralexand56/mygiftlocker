import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { drawNamesFn } from "../functions/draw-names/resource";

/**
 * Data model. Mirrors the TypeScript types in packages/core so the web/mobile
 * UIs don't care whether they're talking to Amplify or the local demo store.
 *
 * Privacy model:
 *  - A Profile is owned by the person it describes (or by guardians for kids).
 *  - Sharing = adding someone's sub to `viewers` (read-only).
 *  - Assignments are only readable by the giver.
 */
const schema = a
  .schema({
    PartialDate: a.customType({
      month: a.integer().required(),
      day: a.integer().required(),
      year: a.integer(),
    }),

    Address: a.customType({
      line1: a.string().required(),
      line2: a.string(),
      city: a.string().required(),
      region: a.string().required(),
      postalCode: a.string().required(),
      country: a.string().required(),
    }),

    PersonKind: a.enum(["adult", "child"]),

    Profile: a
      .model({
        name: a.string().required(),
        kind: a.ref("PersonKind").required(),
        color: a.string(),
        /** SizeProfile from @mgl/core, always stored in US sizing. */
        sizes: a.json(),
        address: a.ref("Address"),
        birthday: a.ref("PartialDate"),
        anniversary: a.ref("PartialDate"),
        favorites: a.json(),
        /** Cognito subs allowed to read (people you're connected with). */
        viewers: a.string().array(),
        /** Cognito subs who manage a child profile. */
        guardians: a.string().array(),
        /** Set when a child grows up and claims their own account. */
        claimedBySub: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.ownersDefinedIn("guardians"),
        allow.ownersDefinedIn("viewers").to(["read"]),
      ]),

    /** "I keep X in my locker", with an optional private nickname/relationship. */
    Connection: a
      .model({
        profileId: a.id().required(),
        relationship: a.string(),
        reminders: a.boolean().default(true),
      })
      .authorization((allow) => [allow.owner()]),

    InviteStatus: a.enum(["pending", "accepted", "revoked"]),

    Invite: a
      .model({
        fromName: a.string().required(),
        toName: a.string(),
        ask: a.json().required(),
        note: a.string(),
        channel: a.string(),
        status: a.ref("InviteStatus"),
        acceptedProfileId: a.id(),
      })
      // Invitees open the link before they have an account → readable via API key.
      .authorization((allow) => [allow.owner(), allow.publicApiKey().to(["read"])]),

    ExchangeStatus: a.enum(["open", "drawn"]),

    Exchange: a
      .model({
        name: a.string().required(),
        date: a.date(),
        budgetAmount: a.float(),
        currency: a.string().default("USD"),
        message: a.string(),
        wishCount: a.integer().default(3),
        singleLoop: a.boolean().default(false),
        status: a.ref("ExchangeStatus"),
        exclusions: a.json(),
        adminSub: a.string().required(),
        drawnAt: a.datetime(),
        participants: a.hasMany("Participant", "exchangeId"),
      })
      .authorization((allow) => [allow.ownerDefinedIn("adminSub"), allow.authenticated().to(["read"])]),

    Participant: a
      .model({
        exchangeId: a.id().required(),
        exchange: a.belongsTo("Exchange", "exchangeId"),
        name: a.string().required(),
        email: a.email(),
        phone: a.phone(),
        userSub: a.string(),
        /** For kids: the parent who manages their wishes and sees their match. */
        managedBySub: a.string(),
        wishlist: a.json(),
      })
      .authorization((allow) => [
        allow.ownerDefinedIn("userSub"),
        allow.ownerDefinedIn("managedBySub"),
        allow.authenticated().to(["read"]),
      ]),

    Assignment: a
      .model({
        exchangeId: a.id().required(),
        giverId: a.id().required(),
        receiverId: a.id().required(),
        giverSub: a.string().required(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("giverSub").to(["read"])]),

    DrawResult: a.customType({ ok: a.boolean().required(), message: a.string() }),

    drawNames: a
      .mutation()
      .arguments({ exchangeId: a.id().required(), redraw: a.boolean() })
      .returns(a.ref("DrawResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(drawNamesFn)),
  })
  .authorization((allow) => [allow.resource(drawNamesFn)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});
