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
          background: "#10241f",
          color: "#f5f8f7",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#b9ead8", fontWeight: 700 }}>Anchor</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 960 }}>
          <div style={{ fontSize: 66, lineHeight: 1.05, fontWeight: 700 }}>
            Attendance resolution and revenue assurance.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#c7d7d1" }}>
            See attendance trajectory, funding exposure, and unresolved student-support work in one operating system.
          </div>
        </div>
        <div style={{ fontSize: 20, color: "#9fb4ac" }}>Texas charter-network MVP · Synthetic data</div>
      </div>
    ),
    size,
  );
}
