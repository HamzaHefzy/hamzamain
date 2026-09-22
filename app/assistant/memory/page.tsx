import { requireSession } from "@/lib/auth";
import { listOperatorMemories } from "@/lib/operator/context";
import MemoryEditor, { DeleteMemoryButton } from "@/components/operator/MemoryEditor";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const session = await requireSession();
  const memories = await listOperatorMemories(session.orgId);

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Personal context</span>
          <h1>Teach Yumna how your life works.</h1>
          <p>Store durable preferences and constraints once instead of repeating them in every request. Privacy levels control what can leave the core application for planning.</p>
        </div>
      </header>

      <section className="operator-section">
        <div className="operator-section-heading"><div><span className="operator-kicker">New memory</span><h2>Add a preference or rule</h2></div></div>
        <MemoryEditor />
      </section>

      <section className="operator-section">
        <div className="operator-section-heading"><div><span className="operator-kicker">Remembered context</span><h2>{memories.length} memories</h2></div></div>
        <div className="operator-memory-list">
          {memories.length ? memories.map((memory) => (
            <article key={memory.id}>
              <div>
                <div className="operator-step-meta"><span>{memory.sensitivity}</span><span>{memory.memory_key}</span></div>
                <strong>{typeof memory.value.text === "string" ? memory.value.text : JSON.stringify(memory.value)}</strong>
              </div>
              <DeleteMemoryButton id={memory.id} />
            </article>
          )) : <div className="operator-empty"><strong>Yumna has no saved preferences yet.</strong><span>Add the things you never want to repeat.</span></div>}
        </div>
      </section>
    </div>
  );
}
