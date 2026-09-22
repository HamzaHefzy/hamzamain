import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbfbfc", color: "#121418", padding: 68, fontFamily: "Arial, sans-serif", border: "1px solid #e7e8eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "#121418", color: "#ffffff", fontSize: 22 }}>D✓</div>
          Dexyra
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div style={{ fontSize: 78, lineHeight: 1.02, letterSpacing: -3.5, fontWeight: 700 }}>Your right hand for real life.</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: "#686d75", maxWidth: 930 }}>Find the place. Get the number. Make the call. Work across your apps. Finish the task.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, color: "#5d45dc", fontWeight: 700 }}>
          <span>Maps → Apps → Voice → Follow-through</span>
          <span>Dexyra</span>
        </div>
      </div>
    ),
    size,
  );
}
