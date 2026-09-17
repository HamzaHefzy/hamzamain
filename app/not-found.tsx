import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Not found</div>
          <h1>This page is not available.</h1>
          <p className="lede">
            The link may be outdated or the case may no longer exist in this synthetic environment.
          </p>
        </div>
      </header>
      <div>
        <Link className="primary-link" href="/">Return to executive overview</Link>
      </div>
    </div>
  );
}
