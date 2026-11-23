import { defineAuth, secret } from "@aws-amplify/backend";

/**
 * One Cognito user pool shared by web (Next.js) and mobile (Expo), so a person
 * signs in once and sees the same locker everywhere.
 *
 * Secrets are set per-environment:  npx ampx sandbox secret set GOOGLE_CLIENT_ID
 */
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
      facebook: {
        clientId: secret("FACEBOOK_CLIENT_ID"),
        clientSecret: secret("FACEBOOK_CLIENT_SECRET"),
        scopes: ["email", "public_profile"],
        attributeMapping: { email: "email", fullname: "name" },
      },
      callbackUrls: ["http://localhost:3000/locker", "https://mygiftlocker.com/locker", "mygiftlocker://auth"],
      logoutUrls: ["http://localhost:3000/", "https://mygiftlocker.com/", "mygiftlocker://"],
    },
  },
  userAttributes: {
    fullname: { required: false, mutable: true },
  },
});
