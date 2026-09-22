import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbfbfc", color: "#121418", padding: 68, fontFamily: "Arial, sans-serif", border: "1px solid #e7e8eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 44, height: 38, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "#121418", color: "#ffffff", fontSize: 20 }}>O</div>
          Operator
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -3, fontWeight: 700 }}>Give it anything you don&apos;t want to deal with.</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#686d75", maxWidth: 930 }}>Calls, appointments, bookings, follow-ups, and real-world administrative work—owned through completion.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, color: "#7357ff", fontWeight: 700 }}>
          <span>API → Browser → Voice → Human</span>
          <span>Operator</span>
        </div>
      </div>
    ),
    size,
  );
}
