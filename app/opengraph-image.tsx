import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8fafc",
          color: "#111b26",
          padding: 68,
          fontFamily: "Arial, sans-serif",
          border: "1px solid #e2e8ee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div
            style={{
              width: 44,
              height: 38,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#152232",
              color: "#ffffff",
              fontSize: 20,
            }}
          >
            A
          </div>
          Anchor
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -3, fontWeight: 700 }}>
            Attendance that actually gets solved.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#566675", maxWidth: 930 }}>
            Barrier resolution, virtual participation recovery, and clearer funding impact in one operating system for schools.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, color: "#1769aa", fontWeight: 700 }}>
          <span>Detect → Resolve → Verify</span>
          <span>Anchor</span>
        </div>
      </div>
    ),
    size,
  );
}
