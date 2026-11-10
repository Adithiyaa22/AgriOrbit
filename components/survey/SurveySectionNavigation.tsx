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
  const active = sections.find((section) => section.id === activeSection);

  return (
    <aside
      aria-label="Survey section navigation"
      className="survey-section-nav mb-4 rounded-xl border border-[var(--border)] bg-white/95 p-3 shadow-sm backdrop-blur-sm xl:fixed xl:left-[17rem] xl:top-5 xl:z-30 xl:mb-0 xl:w-[15rem] xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <ClipboardList size={16} className="shrink-0 text-[var(--primary)]" />
        <span className="text-xs font-bold text-[var(--text)]">Survey Sections</span>
        <span className="ml-auto text-[10px] font-semibold text-[var(--muted)]">
          {activeSection.toUpperCase()} / P
        </span>
      </div>

      <p className="mb-2 px-1 text-[10px] leading-4 text-[var(--muted)]">
        Choose any section. Save your changes before switching.
      </p>

      {/* Compact touch-friendly selector for phones and tablets. */}
      <nav
        className="grid grid-cols-8 gap-1.5 xl:hidden"
        aria-label="Choose survey section"
      >
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={`${base}/${section.id}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Section ${section.id.toUpperCase()}: ${section.title}`}
              title={`Section ${section.id.toUpperCase()} — ${section.title}`}
              className={`flex min-h-9 items-center justify-center rounded-lg border text-xs font-bold transition-colors active:scale-95 ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--light-green)]"
              }`}
            >
              {section.id.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      {/* Persistent compact section list on wide laptop/desktop screens. */}
      <nav className="hidden xl:grid xl:grid-cols-1 xl:gap-1" aria-label="Choose survey section">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={`${base}/${section.id}`}
              aria-current={isActive ? "page" : undefined}
              title={`Section ${section.id.toUpperCase()} — ${section.title}`}
              className={`group flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${
                isActive
                  ? "border-green-200 bg-[var(--light-green)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--background)] hover:text-[var(--text)]"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background)] text-[var(--text)] group-hover:bg-white"
                }`}
              >
                {section.id.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-[10px] font-semibold leading-4">
                {section.title}
              </span>
              {isActive ? (
                <CheckCircle2 size={13} className="shrink-0" />
              ) : (
                <Circle size={11} className="shrink-0 opacity-30" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
