import Link from "next/link";

export default function NotFound() {
  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Not found</span>
          <h1>This page is not available.</h1>
          <p>The link may be outdated, or the resource no longer exists in this workspace.</p>
        </div>
      </header>
      <Link className="operator-back" href="/assistant">← Return to Yumna</Link>
    </div>
  );
}
