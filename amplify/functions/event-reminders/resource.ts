import { defineFunction } from "@aws-amplify/backend";

/**
 * Daily email reminders a week before and the day before each person's dates.
 * 13:00 UTC = 8am US Eastern in winter (9am in summer).
 */
export const eventReminders = defineFunction({
  name: "event-reminders",
  entry: "./handler.ts",
  schedule: "0 13 * * ? *",
  timeoutSeconds: 300,
  resourceGroupName: "data",
  environment: {
    SITE_URL: "https://mygiftlockers.com",
    FROM_ADDRESS: "My Gift Lockers <no-reply@mygiftlockers.com>",
    REPLY_TO: "hello@mygiftlockers.com",
    REMINDER_TIME_ZONE: "America/New_York",
  },
});
