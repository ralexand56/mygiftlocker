import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { eventReminders } from "./functions/event-reminders/resource";
import { exchangeApi } from "./functions/exchange-api/resource";
import { authMessage } from "./functions/auth-message/resource";
import { giftIdeas } from "./functions/gift-ideas/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({ auth, data, storage, exchangeApi, eventReminders, authMessage, giftIdeas });

// Reminder emails: look up owners' email addresses and send through SES.
const reminders = backend.eventReminders.resources.lambda;
const userPool = backend.auth.resources.userPool;
const stack = Stack.of(reminders);
backend.eventReminders.addEnvironment("USER_POOL_ID", userPool.userPoolId);
reminders.addToRolePolicy(new PolicyStatement({ actions: ["cognito-idp:ListUsers"], resources: [userPool.userPoolArn] }));
reminders.addToRolePolicy(
  new PolicyStatement({ actions: ["ses:SendEmail", "ses:SendRawEmail"], resources: [`arn:aws:ses:${stack.region}:${stack.account}:identity/*`] }),
);

// Gift ideas: Claude Opus 5.5 through Claude in Amazon Bedrock (the bedrock-mantle endpoint).
// Photos arrive as signed URLs for this bucket; the function only fetches from it.
const gifts = backend.giftIdeas.resources.lambda;
gifts.addToRolePolicy(new PolicyStatement({ actions: ["bedrock-mantle:CreateInference"], resources: ["*"] }));
backend.giftIdeas.addEnvironment("PHOTO_BUCKET", backend.storage.resources.bucket.bucketName);
backend.giftIdeas.addEnvironment("BEDROCK_REGION", stack.region);
