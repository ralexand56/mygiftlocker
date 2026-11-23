import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { drawNamesFn } from "./functions/draw-names/resource";

defineBackend({ auth, data, drawNamesFn });
