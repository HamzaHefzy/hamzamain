import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";
import LivePhoneDemo from "@/components/marketing/LivePhoneDemo";

export const metadata = {
  title: "Live demo",
  description: "Try an interactive simulation of a Yumna task from request through approval and completion.",
};

export default function DemoPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page y-demo-page">
        <section className="y-page-hero centered">
          <span className="y-eyebrow">Interactive demo</span>
          <h1>See what delegation should feel like.</h1>
          <p>Choose a task and watch Yumna turn one request into a real execution workflow. This public demo is a safe simulation—no calls, bookings, or purchases are actually made.</p>
        </section>
        <LivePhoneDemo large />
        <section className="y-demo-explainer">
          <div><span>01</span><strong>The request stays outcome-focused.</strong><p>You do not need to tell Yumna which app, website, or phone number to use.</p></div>
          <div><span>02</span><strong>Execution is observable.</strong><p>You can see what is happening, what provider is being used, and what Yumna is waiting on.</p></div>
          <div><span>03</span><strong>Commitments are explicit.</strong><p>The workflow can move quickly without quietly spending money or changing an account.</p></div>
        </section>
        <section className="y-small-cta"><div><h2>Ready to try it with your own tasks?</h2><p>Your private workspace starts in safe demo mode until you connect providers.</p></div><Link href="/signup" className="y-primary-link large">Start free</Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}
