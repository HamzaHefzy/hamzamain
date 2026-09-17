import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cases } from "@/lib/data";

type CasePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { id } = await params;
  const item = cases.find((entry) => entry.id === id);
  return {
    title: item ? `${item.id} · ${item.barrier}` : "Case not found",
    description: item ? `Synthetic ResolutionOS case for ${item.barrier}.` : undefined,
  };
}

export default async function CaseDetailPage({ params }: CasePageProps) {
  const { id } = await params;
  const item = cases.find((entry) => entry.id === id);

  if (!item) notFound();

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">ResolutionOS case</div>
          <h1>{item.barrier}</h1>
          <p className="lede">
            Review the current commitment and next step for {item.id}. This synthetic student view contains no financial valuation.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />{item.queue}</div>
      </header>

      <section className="detail-grid">
        <article className="detail-card">
          <div className="eyebrow">Case details</div>
          <h2>{item.id} · Grade {item.grade}</h2>
          <dl className="detail-list">
            <div><dt>Campus</dt><dd>{item.campus}</dd></div>
            <div><dt>Barrier</dt><dd>{item.barrier}</dd></div>
            <div><dt>Owner</dt><dd>{item.owner}</dd></div>
            <div><dt>Status</dt><dd>{item.status}</dd></div>
          </dl>
        </article>

        <article className="detail-card">
          <div className="eyebrow">Current commitment</div>
          <h2>What must happen next</h2>
          <dl className="detail-list">
            <div><dt>Commitment</dt><dd>{item.commitment}</dd></div>
            <div><dt>Due</dt><dd>{item.due}</dd></div>
            <div><dt>Outcome check</dt><dd>Verify support delivery, then compare attendance after the planned return point.</dd></div>
          </dl>
        </article>
      </section>

      <section className="guardrail-card">
        <div>
          <div className="eyebrow">Design rule</div>
          <h2>Support decisions stay separate from finance.</h2>
        </div>
        <p>
          This page is intentionally operational. Aggregate funding scenarios belong in the finance view; individual cases are prioritized by student need and intervention evidence.
        </p>
      </section>

      <div>
        <Link className="secondary-link" href="/cases">Back to resolution queue</Link>
      </div>
    </div>
  );
}
