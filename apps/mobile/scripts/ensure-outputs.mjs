// amplify_outputs.json connects the app to the backend. Create it with:
//   npx ampx generate outputs --app-id dfqe2wyg1hcqx --branch <branch> --out-dir apps/mobile
// When it's missing, write an empty one so the app builds and runs in demo mode.
import { existsSync, writeFileSync } from "node:fs";
const file = new URL("../amplify_outputs.json", import.meta.url);
if (!existsSync(file)) {
  writeFileSync(file, "{}\n");
  console.log("amplify_outputs.json not found: running in demo mode (local data only).");
}
