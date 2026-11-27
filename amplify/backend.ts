import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
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

// Sign-in address: auth.mygiftlockers.com instead of Cognito's <random>.auth.us-east-1.amazoncognito.com,
// so Google's "continue to …" shows our domain. The original prefix domain stays alongside it.
// Google's redirect URI and Apple's return URL include https://auth.mygiftlockers.com/oauth2/idpresponse.
const AUTH_DOMAIN = "auth.mygiftlockers.com";
{
  const authStack = Stack.of(userPool);
  const zone = HostedZone.fromHostedZoneAttributes(authStack, "SiteZone", { hostedZoneId: "Z02284712XPHC0XF65JXH", zoneName: "mygiftlockers.com" });
  const certificate = new Certificate(authStack, "AuthDomainCert", { domainName: AUTH_DOMAIN, validation: CertificateValidation.fromDns(zone) });
  const domain = new UserPoolDomain(authStack, "AuthCustomDomain", { userPool, customDomain: { domainName: AUTH_DOMAIN, certificate } });
  new ARecord(authStack, "AuthDomainRecord", { zone, recordName: "auth", target: RecordTarget.fromAlias(new UserPoolDomainTarget(domain)) });
}
