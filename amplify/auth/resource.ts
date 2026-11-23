import { defineAuth, secret } from "@aws-amplify/backend";

/**
 * One Cognito user pool shared by web (Next.js) and mobile (Expo), so a person
 * signs in once and sees the same locker everywhere.
 *
 * Only organizers / locker owners sign in. People who join an exchange or fill
 * in an invite do it from a link, no account needed (see functions/exchange-api).
 *
 * Google secrets are set per branch in the Amplify console (Hosting → Secrets):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * Facebook can be added later the same way (FACEBOOK_CLIENT_ID / _SECRET).
 */

/* Amplify generates the Cognito hosted-UI domain on first deploy. Google's
 * "Authorized redirect URI" is then <that domain>/oauth2/idpresponse; it's printed
 * in amplify_outputs.json under auth.oauth.domain. */

const SITE_URLS = [
  "http://localhost:3000/",
  "https://mygiftlockers.com/",
  "https://www.mygiftlockers.com/",
  // Amplify Hosting default domain; set AMPLIFY_SITE_URL in the console once the app exists.
  ...(process.env.AMPLIFY_SITE_URL ? [process.env.AMPLIFY_SITE_URL.replace(/\/?$/, "/")] : []),
];

export const auth = defineAuth({
  loginWith: {
    // Passwordless one-time codes by email (USER_AUTH / EMAIL_OTP).
    email: { otpLogin: true },
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["email", "profile", "openid"],
        attributeMapping: { email: "email", fullname: "name", profilePicture: "picture" },
      },
      callbackUrls: [...SITE_URLS.map((u) => `${u}auth/callback`), "mygiftlocker://auth"],
      logoutUrls: [...SITE_URLS, "mygiftlocker://"],
    },
  },
  userAttributes: {
    fullname: { required: false, mutable: true },
  },
});
