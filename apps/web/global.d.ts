import type { CoreCatalog, Locale } from "@mgl/core";
import type en from "@mgl/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en & CoreCatalog;
  }
}
