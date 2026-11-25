import { defineFunction, secret } from "@aws-amplify/backend";

/** "Find the perfect gift": asks Claude (Amazon Bedrock) for ideas for one locker person. */
export const giftIdeas = defineFunction({
  name: "gift-ideas",
  entry: "./handler.ts",
  // Invoked asynchronously (see the findGifts mutation), so it isn't bound by AppSync's 30s limit.
  timeoutSeconds: 180,
  memoryMB: 512,
  resourceGroupName: "data",
  // Set in the Amplify console (Hosting → Secrets). Without it the function uses Amazon Bedrock.
  environment: { ANTHROPIC_API_KEY: secret("ANTHROPIC_API_KEY") },
});
