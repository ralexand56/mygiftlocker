import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { exchangeApi } from "./functions/exchange-api/resource";

defineBackend({ auth, data, exchangeApi });
