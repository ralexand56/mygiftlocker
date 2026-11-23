import { defineFunction } from "@aws-amplify/backend";

export const drawNamesFn = defineFunction({
  name: "draw-names",
  entry: "./handler.ts",
  timeoutSeconds: 20,
});
