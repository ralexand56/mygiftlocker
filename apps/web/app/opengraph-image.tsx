import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview shown when a link to the site is shared (iMessage, WhatsApp, Facebook, search results).
export const alt = "My Gift Lockers: sizes, birthdays and gift ideas for everyone you love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const icon = await readFile(join(process.cwd(), "app/icon.svg"));
  const iconSrc = `data:image/svg+xml;base64,${icon.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "linear-gradient(135deg, #fffaf6 0%, #fde6ee 45%, #e9e0ff 100%)",
          color: "#3b2a3f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} width={120} height={120} alt="" />
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>My Gift Lockers</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 52, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Every size, every date, every person you love.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#6e5a72", maxWidth: 980 }}>
          Sizes · Birthday reminders · Gift ideas · Secret Santa
        </div>
        <div style={{ marginTop: 44, fontSize: 28, fontWeight: 700, color: "#b04a74" }}>mygiftlockers.com · free</div>
      </div>
    ),
    size,
  );
}
