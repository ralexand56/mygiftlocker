/**
 * "Money gifts": the payment apps someone can be sent money on.
 * Username apps (PayPal.me, Cash App, Venmo, Wise, Revolut) get a "send money" link;
 * phone/email-based ones (Zelle, Apple Cash, PIX, Mercado Pago) are shown to copy.
 * Private by default: a connection shares them only when the person turns it on,
 * and they're never part of gift exchanges or the AI gift finder.
 */

export const PAYMENT_APPS = ["paypal", "venmo", "cashapp", "zelle", "applecash", "wise", "revolut", "pix", "mercadopago"] as const;
export type PaymentApp = (typeof PAYMENT_APPS)[number];
export type PaymentHandles = Partial<Record<PaymentApp, string>>;

export const PAYMENT_APP_NAMES: Record<PaymentApp, string> = {
  paypal: "PayPal",
  venmo: "Venmo",
  cashapp: "Cash App",
  zelle: "Zelle",
  applecash: "Apple Cash",
  wise: "Wise",
  revolut: "Revolut",
  pix: "PIX",
  mercadopago: "Mercado Pago",
};

/** Apps whose handle is a public username with a payment page. */
const LINKED: Partial<Record<PaymentApp, { url: (h: string) => string; prefix: string; from: RegExp }>> = {
  paypal: { url: (h) => `https://paypal.me/${h}`, prefix: "", from: /paypal\.me\/([^/?#\s]+)/i },
  venmo: { url: (h) => `https://venmo.com/u/${h}`, prefix: "@", from: /venmo\.com\/(?:u\/)?([^/?#\s]+)/i },
  cashapp: { url: (h) => `https://cash.app/$${h}`, prefix: "$", from: /cash\.app\/\$?([^/?#\s]+)/i },
  wise: { url: (h) => `https://wise.com/pay/me/${h}`, prefix: "@", from: /wise\.com\/pay\/me\/([^/?#\s]+)/i },
  revolut: { url: (h) => `https://revolut.me/${h}`, prefix: "@", from: /revolut\.me\/([^/?#\s]+)/i },
};

const USERNAME = /^[A-Za-z0-9._-]{1,64}$/;

/** True for apps that get a "send money" link (the rest are copied). */
export const isLinkedPaymentApp = (app: PaymentApp) => !!LINKED[app];

/**
 * A typed or pasted handle, normalized: "@maya", "$maya" and "https://cash.app/$maya" all become "maya".
 * Returns "" for an empty value and null when it isn't valid for that app.
 */
export function normalizePaymentHandle(app: PaymentApp, raw: unknown): string | null {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  const linked = LINKED[app];
  if (!linked) return s.length <= 100 ? s : null; // phone, email or key: kept as typed
  const fromUrl = s.match(linked.from)?.[1];
  const handle = (fromUrl ?? s).replace(/^[@$]/, "");
  return USERNAME.test(handle) ? handle : null;
}

/** Valid handles only; undefined when none are left. */
export function cleanPayments(input: unknown): PaymentHandles | undefined {
  if (!input || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  const out: PaymentHandles = {};
  for (const app of PAYMENT_APPS) {
    const h = normalizePaymentHandle(app, o[app]);
    if (h) out[app] = h;
  }
  return Object.keys(out).length ? out : undefined;
}

/** How a handle reads on screen ("$maya", "@maya"). */
export const paymentHandleLabel = (app: PaymentApp, handle: string) => `${LINKED[app]?.prefix ?? ""}${handle}`;

/** The app's "send money" page for this handle, or null for copy-only apps. */
export const paymentLink = (app: PaymentApp, handle: string): string | null => LINKED[app]?.url(encodeURIComponent(handle)) ?? null;
