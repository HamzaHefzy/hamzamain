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
          background:
            "radial-gradient(circle at 82% 8%, rgba(91,76,227,.15), transparent 30%), #fbfbfd",
          color: "#15161b",
          padding: 68,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 31, fontWeight: 700 }}>
          <div
            style={{
              position: "relative",
              width: 48,
              height: 48,
              borderRadius: 15,
              background: "#5b4ce3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "absolute", left: 11, top: 10, width: 8, height: 8, borderRadius: 999, background: "#fff" }} />
            <div style={{ position: "absolute", right: 9, top: 9, width: 10, height: 10, borderRadius: 999, background: "#70e2b1" }} />
            <div style={{ position: "absolute", left: 20, bottom: 7, width: 8, height: 8, borderRadius: 999, background: "#fff" }} />
            <div style={{ position: "absolute", left: 16, top: 16, width: 22, height: 5, borderRadius: 999, background: "#fff", transform: "rotate(-42deg)" }} />
            <div style={{ position: "absolute", left: 11, top: 16, width: 20, height: 5, borderRadius: 999, background: "#fff", transform: "rotate(42deg)" }} />
            <div style={{ position: "absolute", left: 22, top: 25, width: 5, height: 15, borderRadius: 999, background: "#fff" }} />
          </div>
          Yumna
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          <div style={{ fontSize: 76, lineHeight: 1.01, letterSpacing: -3.4, fontWeight: 700 }}>
            Say what you need done. Yumna handles the rest.
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.4, color: "#6a6d76", maxWidth: 930 }}>
            Find the place. Get the number. Make the call. Work across your apps. Finish the task.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, color: "#5b4ce3", fontWeight: 700 }}>
          <span>Maps → Apps → Voice → Follow-through</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#70e2b1" }} />
            yumna
          </span>
        </div>
      </div>
    ),
    size,
  );
}
