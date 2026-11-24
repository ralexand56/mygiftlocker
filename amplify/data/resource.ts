import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { eventReminders } from "../functions/event-reminders/resource";
import { exchangeApi } from "../functions/exchange-api/resource";

/**
 * Data model. Mirrors the TypeScript types in packages/core.
 *
 * Access model:
 *  - Signed-in users (organizers / locker owners) read and write their own rows
 *    directly. Ownership is the Cognito `sub` (identityClaim("sub")).
 *  - Everyone else uses a link. Link holders call the custom operations at the
 *    bottom (API key), which run in the `exchange-api` function. That function
 *    checks the secret token in the link, so a participant only ever sees their
 *    own wishlist and their own match.
 */
const schema = a
  .schema({
    PartialDate: a.customType({
      month: a.integer().required(),
      day: a.integer().required(),
      year: a.integer(),
    }),

    PersonKind: a.enum(["adult", "child"]),

    /** Someone in a locker. Created by the owner, or by an invitee via `submitInvite`. */
    Profile: a
      .model({
        ownerSub: a.string(),
        name: a.string().required(),
        kind: a.ref("PersonKind").required(),
        relationship: a.string(),
        color: a.string(),
        /** SizeProfile from @mgl/core, always stored in US sizing. */
        sizes: a.json(),
        /** Address from @mgl/core. */
        address: a.json(),
        birthday: a.ref("PartialDate"),
        anniversary: a.ref("PartialDate"),
        favorites: a.json(),
        /** For child profiles: Cognito subs of guardians who can edit. */
        guardians: a.string().array(),
        fromInviteId: a.id(),
        /** Owner-set: HolidayId[] from @mgl/core (christmas, valentines, mothers-day, fathers-day). */
        holidays: a.string().array(),
        /** Owner's private note about this person. Never returned to link holders. */
        ownerNote: a.string(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("ownerSub").identityClaim("sub"), allow.ownersDefinedIn("guardians").identityClaim("sub")]),

    InviteStatus: a.enum(["pending", "accepted", "revoked"]),

    /** "Please share your sizes with me." The link carries the Invite id. */
    Invite: a
      .model({
        ownerSub: a.string(),
        fromName: a.string().required(),
        toName: a.string(),
        ask: a.json().required(),
        note: a.string(),
        status: a.ref("InviteStatus"),
        acceptedProfileId: a.id(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("ownerSub").identityClaim("sub")]),

    ExchangeStatus: a.enum(["open", "drawn"]),

    Exchange: a
      .model({
        adminSub: a.string(),
        /** The organizer's own Participant row (they play too). */
        organizerParticipantId: a.id(),
        name: a.string().required(),
        date: a.date(),
        budgetAmount: a.float(),
        currency: a.string(),
        message: a.string(),
        wishCount: a.integer().required(),
        singleLoop: a.boolean(),
        status: a.ref("ExchangeStatus"),
        /** [participantId, participantId][] */
        exclusions: a.json(),
        /** Earlier rounds' assignments, to avoid repeats. */
        previous: a.json(),
        drawnAt: a.datetime(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("adminSub").identityClaim("sub")]),

    Participant: a
      .model({
        exchangeId: a.id().required(),
        /** Copied from the exchange so the organizer can manage participants. */
        adminSub: a.string(),
        name: a.string().required(),
        email: a.string(),
        /** Secret in the participant's private link. */
        token: a.string().required(),
        /** For kids: the organizer or parent who manages their wishes. */
        managedBySub: a.string(),
        /** WishItem[] from @mgl/core */
        wishlist: a.json(),
        joinedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [index("exchangeId")])
      .authorization((allow) => [allow.ownerDefinedIn("adminSub").identityClaim("sub")]),

    Assignment: a
      .model({
        exchangeId: a.id().required(),
        adminSub: a.string(),
        giverId: a.id().required(),
        receiverId: a.id().required(),
      })
      .secondaryIndexes((index) => [index("exchangeId")])
      // The organizer may "peek"; participants only see their own via `getMyExchange`.
      .authorization((allow) => [allow.ownerDefinedIn("adminSub").identityClaim("sub").to(["read"])]),

    // ---- Link-holder operations (no account needed) -----------------------
    getPublicExchange: a
      .query()
      .arguments({ exchangeId: a.id().required() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    joinExchange: a
      .mutation()
      .arguments({ exchangeId: a.id().required(), name: a.string().required(), email: a.string(), wishlist: a.json() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    getMyExchange: a
      .query()
      .arguments({ exchangeId: a.id().required(), token: a.string().required() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    saveWishlist: a
      .mutation()
      .arguments({ exchangeId: a.id().required(), token: a.string().required(), wishlist: a.json().required() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    getPublicInvite: a
      .query()
      .arguments({ inviteId: a.id().required() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    submitInvite: a
      .mutation()
      .arguments({ inviteId: a.id().required(), profile: a.json().required(), kids: a.json() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    // ---- Reminder emails ----------------------------------------------------
    /** One per locker owner. The token goes in the unsubscribe link (no sign-in needed). */
    ReminderSettings: a
      .model({
        ownerSub: a.string().required(),
        remindersOff: a.boolean(),
        unsubscribeToken: a.string().required(),
      })
      .identifier(["ownerSub"])
      .secondaryIndexes((index) => [index("unsubscribeToken")])
      .authorization((allow) => [allow.ownerDefinedIn("ownerSub").identityClaim("sub").to(["read"])]),

    /** "ownerSub#YYYY-MM-DD": written before sending so a retried run never emails twice. */
    ReminderLog: a
      .model({
        id: a.id().required(),
        ownerSub: a.string().required(),
        count: a.integer(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("ownerSub").identityClaim("sub").to(["read"])]),

    /** From the email's unsubscribe link: turn reminders off (or back on). */
    setReminders: a
      .mutation()
      .arguments({ token: a.string().required(), enabled: a.boolean().required() })
      .returns(a.json())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    // ---- Organizer operations ---------------------------------------------
    drawNames: a
      .mutation()
      .arguments({ exchangeId: a.id().required() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),

    /** Deletes the exchange with its participants and assignments (organizers can't delete assignments directly). */
    removeExchange: a
      .mutation()
      .arguments({ exchangeId: a.id().required() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(exchangeApi)),
  })
  .authorization((allow) => [allow.resource(exchangeApi), allow.resource(eventReminders)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});
