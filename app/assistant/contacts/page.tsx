import { requireSession } from "@/lib/auth";
import { listOperatorContacts } from "@/lib/operator/contacts";
import ContactEditor, { DeleteContactButton } from "@/components/operator/ContactEditor";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const session = await requireSession();
  const contacts = await listOperatorContacts(session.orgId);

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Private directory</span>
          <h1>Give Operator the people and businesses you actually use.</h1>
          <p>Contact details stay inside the Operator core. The planner does not receive your address book; only the resolved destination is attached at execution time.</p>
        </div>
      </header>

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">New contact</span><h2>Add a trusted destination</h2></div>
        </div>
        <ContactEditor />
      </section>

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">Directory</span><h2>{contacts.length} contacts</h2></div>
        </div>
        <div className="operator-contact-list">
          {contacts.length ? contacts.map((contact) => (
            <article key={contact.id}>
              <div>
                <strong>{contact.display_name}</strong>
                <span>{contact.organization ?? "Personal contact"}</span>
                <small>
                  {[contact.phone, contact.email].filter(Boolean).join(" · ")}
                  {contact.aliases.length ? " · aliases: " + contact.aliases.join(", ") : ""}
                </small>
                {contact.notes ? <p>{contact.notes}</p> : null}
              </div>
              <DeleteContactButton id={contact.id} />
            </article>
          )) : (
            <div className="operator-empty">
              <strong>No contacts yet.</strong>
              <span>Add the dentist, salon, favorite restaurants, family, or anyone Operator may need to reach.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
