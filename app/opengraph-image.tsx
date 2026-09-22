import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#f8fafd",color:"#1f1f1f",padding:68,fontFamily:"Arial, sans-serif" }}>
      <div style={{display:"flex",alignItems:"center",gap:16,fontSize:30,fontWeight:700}}>
        <div style={{width:48,height:48,borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",background:"#4f46c8",color:"#fff",fontSize:24,fontWeight:800}}>W</div>
        Yumna
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:22,maxWidth:980}}>
        <div style={{fontSize:78,lineHeight:1.02,letterSpacing:-3.5,fontWeight:700}}>More time for your actual life.</div>
        <div style={{fontSize:28,lineHeight:1.4,color:"#5f6368",maxWidth:930}}>Find the place. Get the number. Make the call. Work across your apps. Finish the task.</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:19,color:"#4f46c8",fontWeight:700}}><span>Maps → Apps → Voice → Follow-through</span><span>Yumna</span></div>
    </div>,
    size,
  );
}
