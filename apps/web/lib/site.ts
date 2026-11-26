/** The site's one public address (the bare domain redirects here). */
export const SITE_URL = "https://www.mygiftlockers.com";

/** Pages search engines may list. Everything else is private (sign-in, tokens) and kept out. */
export const PUBLIC_PATHS = ["/", "/exchange", "/privacy"] as const;

/** Path prefixes that are never indexed: signed-in areas and links carrying private tokens. */
export const PRIVATE_PREFIXES = ["/locker", "/join", "/connect", "/exchange/", "/invite", "/sign-in", "/auth", "/reminders"] as const;
