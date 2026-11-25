import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { eventReminders } from "./functions/event-reminders/resource";
import { exchangeApi } from "./functions/exchange-api/resource";
import { authMessage } from "./functions/auth-message/resource";

const backend = defineBackend({ auth, data, exchangeApi, eventReminders, authMessage });

// Reminder emails: look up owners' email addresses and send through SES.
const reminders = backend.eventReminders.resources.lambda;
const userPool = backend.auth.resources.userPool;
const stack = Stack.of(reminders);
backend.eventReminders.addEnvironment("USER_POOL_ID", userPool.userPoolId);
reminders.addToRolePolicy(new PolicyStatement({ actions: ["cognito-idp:ListUsers"], resources: [userPool.userPoolArn] }));
reminders.addToRolePolicy(
  new PolicyStatement({ actions: ["ses:SendEmail", "ses:SendRawEmail"], resources: [`arn:aws:ses:${stack.region}:${stack.account}:identity/*`] }),
);
