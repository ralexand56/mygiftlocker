import { defineFunction } from "@aws-amplify/backend";

/** Handles every link-holder operation plus the organizer's draw. */
export const exchangeApi = defineFunction({
  name: "exchange-api",
  entry: "./handler.ts",
  timeoutSeconds: 20,
  resourceGroupName: "data",
});
