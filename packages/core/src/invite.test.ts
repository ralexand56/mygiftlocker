import { describe, expect, it } from "vitest";
import { createTr } from "./i18n";
import { CORE_CATALOGS } from "./catalogs";
import { inviteShareLinks, withInviteLang } from "./invite";

describe("invite language", () => {
  it("adds the chosen language to the link, or leaves it alone", () => {
    expect(withInviteLang("https://www.mygiftlockers.com/join/abc", "es")).toBe("https://www.mygiftlockers.com/join/abc?lang=es");
    expect(withInviteLang("https://www.mygiftlockers.com/join/abc", "")).toBe("https://www.mygiftlockers.com/join/abc");
  });

  it("writes the message in the chosen language", () => {
    const en = inviteShareLinks("https://x/join/a", "Rico", "Ana", createTr("en", CORE_CATALOGS.en));
    const es = inviteShareLinks("https://x/join/a", "Rico", "Ana", createTr("es", CORE_CATALOGS.es));
    expect(es.whatsapp).not.toBe(en.whatsapp);
    expect(decodeURIComponent(es.whatsapp)).toContain("Ana");
  });
});
