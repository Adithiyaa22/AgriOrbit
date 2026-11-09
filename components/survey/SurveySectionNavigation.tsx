"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";

const sections = [
  { id: "a", title: "Survey & Enumerator Details" },
  { id: "b", title: "Farmer Profile" },
  { id: "c", title: "Field / Land Details" },
  { id: "d", title: "Soil Details" },
  { id: "e", title: "Season & Crop History" },
  { id: "f", title: "Seed & Variety" },
  { id: "g", title: "Fertilizer & Other Inputs" },
  { id: "h", title: "Water & Irrigation" },
  { id: "i", title: "Crop Problems & Difficulties" },
  { id: "j", title: "Field Observation" },
  { id: "k", title: "Harvest, Yield & Economics" },
  { id: "l", title: "Market & Selling" },
  { id: "m", title: "Labour & Farming Operations" },
  { id: "n", title: "Farmer Knowledge & Tips" },
  { id: "o", title: "Future Farmer Needs" },
  { id: "p", title: "Final Review & Submission" },
];

export default function SurveySectionNavigation({
  surveyId,
  activeSection,
}: {
  surveyId: string;
  activeSection: string;
}) {
  const pathname = usePathname();
  const base = `/surveys/${surveyId}`;

  return (
    <section
      aria-label="Survey section navigation"
      className="mb-5 rounded-2xl border border-[var(--border)] bg-white/95 p-3 shadow-sm backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-[var(--text)]">
        <ClipboardList size={17} className="text-[var(--primary)]" />
        <span>Survey sections</span>
        <span className="ml-auto text-xs font-medium text-[var(--muted)]">{activeSection.toUpperCase()} / P</span>
      </div>
      <p className="mb-3 px-1 text-xs text-[var(--muted)]">Open any section in any order. You do not have to complete the previous section first. Save the current section before switching pages.</p>

      {/* Mobile and tablet: compact, horizontally scrollable section switcher. */}
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Choose survey section">
        {sections.map((section) => {
          const active = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={`${base}/${section.id}`}
              aria-current={active ? "page" : undefined}
              title={`Section ${section.id.toUpperCase()} — ${section.title}`}
              className={`flex min-w-[54px] shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-green-900/15"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[var(--light-green)]"
              }`}
            >
              <span className="text-sm">{section.id.toUpperCase()}</span>
              <span className="mt-0.5 text-[9px] opacity-80">{active ? "Current" : "Open"}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop: named sidebar, so interns can identify a section before opening it. */}
      <nav className="hidden grid-cols-2 gap-2 lg:grid xl:grid-cols-1" aria-label="Choose survey section">
        {sections.map((section) => {
          const active = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={`${base}/${section.id}`}
              aria-current={active ? "page" : undefined}
              className={`group flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                active
                  ? "border-[var(--primary)] bg-[var(--light-green)] text-[var(--primary)] shadow-sm"
                  : "border-transparent text-[var(--muted)] hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--background)] hover:text-[var(--text)]"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${active ? "bg-[var(--primary)] text-white" : "bg-[var(--background)] text-[var(--text)] group-hover:bg-white"}`}>
                {section.id.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-xs font-semibold leading-5">{section.title}</span>
              {active ? <CheckCircle2 size={15} className="shrink-0" /> : <Circle size={13} className="shrink-0 opacity-30" />}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
