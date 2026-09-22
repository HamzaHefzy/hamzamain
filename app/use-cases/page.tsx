import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Use cases",
  description: "Ways Yumna can take real administrative work off your plate.",
};

const groups = [
  ["Appointments & care", "Find offices, get verified numbers, call for availability, ask administrative questions, book approved appointments, and update your calendar.", ["Dentist", "Salon", "Mechanic", "Veterinarian"]],
  ["Dining & plans", "Search places, compare ratings and constraints, coordinate a group, reserve, and handle changes.", ["Dinner", "Brunch", "Date night", "Group plans"]],
  ["Subscriptions & refunds", "Cancel services, wait on hold, navigate retention flows, start returns, and keep tracking until confirmation or money arrives.", ["Memberships", "Internet", "Returns", "Refunds"]],
  ["Travel admin", "Coordinate flights, hotels, cars, calendars, and changes across the apps you already use.", ["Hotels", "Rental cars", "Trip changes", "Itineraries"]],
  ["Home & local services", "Find local providers, verify them, get quotes, call, compare options, and prepare a booking for approval.", ["Plumber", "Electrician", "Cleaner", "Contractor"]],
  ["Connected-app work", "Send or prepare messages, organize files, update tasks, coordinate schedules, and move information between connected systems.", ["Gmail", "Slack", "Notion", "Microsoft 365"]],
];

export default function UseCasesPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero">
          <span className="y-eyebrow">Use cases</span>
          <h1>Give Yumna the work that is too small to delegate to a person—but too annoying to keep doing yourself.</h1>
          <p>The product is designed around multi-step administrative outcomes rather than one-off answers.</p>
        </section>
        <section className="y-usecase-grid-full">
          {groups.map(([title, body, tags]) => (
            <article key={title as string}>
              <span className="y-usecase-orb" />
              <h2>{title}</h2>
              <p>{body}</p>
              <div>{(tags as string[]).map((tag) => <span key={tag}>{tag}</span>)}</div>
            </article>
          ))}
        </section>
        <section className="y-small-cta"><div><h2>Have a task that does not fit a category?</h2><p>That is the point. Yumna plans the path from the outcome you give it.</p></div><Link href="/demo" className="y-primary-link large">Try the demo</Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}
